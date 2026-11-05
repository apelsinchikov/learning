/*
 * Движок SQL Advanced на странице. Сам Postgres живёт в воркере (engineWorker.js);
 * здесь мы отправляем ему запросы, ждём ответ и, если запрос идёт дольше десяти
 * секунд, завершаем воркер. Новый воркер создаётся при следующем запуске
 * (запуск Postgres занимает меньше секунды, база засевается заново).
 *
 *   const engine = createEngine();
 *   await engine.init();
 *   await engine.run({ before, sql, probes });
 *   // { ok: true, columns, rows, rowCount, affected, probes: [...] }
 *   // { ok: false, error, code?, constraint?, rejected?, timeout? }
 */

export const TIMEOUT_MS = 10000;

export const TIMEOUT_MESSAGE =
    "Запрос выполнялся дольше 10 секунд, и я его остановил. Частая причина: рекурсивный запрос без условия остановки или соединение таблиц без условия.";

function defaultCreateWorker() {
    return new Worker(new URL("./engineWorker.js", import.meta.url), { type: "module" });
}

export function createEngine({ createWorker = defaultCreateWorker, timeoutMs = TIMEOUT_MS } = {}) {
    let worker = null;
    let ready = false;
    let nextId = 1;
    let queue = Promise.resolve();
    const pending = new Map();

    function settleAll(result) {
        for (const [id, resolve] of pending) {
            pending.delete(id);
            resolve(result);
        }
    }

    function start() {
        if (worker) {
            return worker;
        }

        worker = createWorker();

        worker.onmessage = event => {
            const resolve = pending.get(event.data.id);

            if (resolve) {
                pending.delete(event.data.id);
                resolve(event.data.result);
            }
        };

        worker.onerror = event => {
            console.error(event);
            stop();
            settleAll({ ok: false, error: "Не удалось запустить движок Postgres в браузере.", startup: true });
        };

        return worker;
    }

    function stop() {
        if (worker) {
            worker.terminate();
        }

        worker = null;
        ready = false;
    }

    function send(type, payload, limit) {
        return new Promise(resolve => {
            const id = nextId++;
            const timer = limit
                ? setTimeout(() => {
                      pending.delete(id);
                      stop();
                      resolve({ ok: false, timeout: true, error: TIMEOUT_MESSAGE });
                  }, limit)
                : null;

            pending.set(id, result => {
                clearTimeout(timer);
                resolve(result);
            });

            try {
                start().postMessage({ id, type, payload });
            } catch (error) {
                pending.delete(id);
                clearTimeout(timer);
                stop();
                resolve({ ok: false, error: String((error && error.message) || error), startup: true });
            }
        });
    }

    /* Запросы идут строго по очереди: таймер каждого стартует, когда он дошёл до выполнения. */
    function enqueue(task) {
        const next = queue.then(task, task);

        queue = next.catch(() => {});

        return next;
    }

    function init() {
        return enqueue(async () => {
            if (ready) {
                return;
            }

            /* Первый запуск медленнее: грузится Postgres, поэтому ждём дольше обычного. */
            const result = await send("init", null, timeoutMs * 6);

            if (!result.ok) {
                throw new Error(result.error || "Движок не запустился");
            }

            ready = true;
        });
    }

    async function guarded(type, payload) {
        try {
            await init();
        } catch (error) {
            return { ok: false, error: String(error.message || error), startup: true };
        }

        return enqueue(() => send(type, payload, timeoutMs));
    }

    return {
        init,
        run: payload => guarded("run", payload),
        inspect: (sql, options = {}) => guarded("inspect", { sql, ...options }),
        isReady: () => ready,
        terminate: stop
    };
}
