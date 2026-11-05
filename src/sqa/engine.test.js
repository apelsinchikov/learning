import { describe, expect, it, vi } from "vitest";

import { TIMEOUT_MESSAGE, createEngine } from "./engine.js";

/* Фальшивый воркер: отвечает на init сразу, а на run — как настроено. */
function fakeWorkerFactory(runBehavior) {
    const created = [];

    const factory = () => {
        const worker = {
            terminated: false,
            onmessage: null,
            postMessage({ id, type, payload }) {
                if (worker.terminated) {
                    return;
                }

                if (type === "init") {
                    queueMicrotask(() => worker.onmessage({ data: { id, result: { ok: true } } }));
                } else {
                    runBehavior({ id, payload, reply: result => worker.onmessage({ data: { id, result } }) });
                }
            },
            terminate() {
                worker.terminated = true;
            }
        };

        created.push(worker);

        return worker;
    };

    return { factory, created };
}

describe("движок на странице", () => {
    it("отправляет запрос в воркер и возвращает ответ", async () => {
        const { factory } = fakeWorkerFactory(({ payload, reply }) => reply({ ok: true, rows: [[payload.sql]] }));
        const engine = createEngine({ createWorker: factory });

        expect(engine.isReady()).toBe(false);
        expect(await engine.run({ sql: "SELECT 1" })).toEqual({ ok: true, rows: [["SELECT 1"]] });
        expect(engine.isReady()).toBe(true);
    });

    it("зависший запрос прерывается: воркер завершён, ответ с timeout", async () => {
        vi.useFakeTimers();

        const { factory, created } = fakeWorkerFactory(() => {
            /* никогда не отвечает */
        });
        const engine = createEngine({ createWorker: factory, timeoutMs: 1000 });
        const pendingRun = engine.run({ sql: "WITH RECURSIVE r AS (...) SELECT 1" });

        await vi.advanceTimersByTimeAsync(1100);

        const result = await pendingRun;

        expect(result).toMatchObject({ ok: false, timeout: true, error: TIMEOUT_MESSAGE });
        expect(created[0].terminated).toBe(true);
        expect(engine.isReady()).toBe(false);

        vi.useRealTimers();
    });

    it("после таймаута следующий запуск создаёт новый воркер", async () => {
        vi.useFakeTimers();

        let calls = 0;
        const { factory, created } = fakeWorkerFactory(({ reply }) => {
            calls++;

            if (calls > 1) {
                reply({ ok: true, rows: [] });
            }
        });
        const engine = createEngine({ createWorker: factory, timeoutMs: 1000 });
        const first = engine.run({ sql: "slow" });

        await vi.advanceTimersByTimeAsync(1100);
        expect((await first).timeout).toBe(true);

        const second = await engine.run({ sql: "fast" });

        expect(second.ok).toBe(true);
        expect(created).toHaveLength(2);

        vi.useRealTimers();
    });

    it("запросы идут по очереди, таймер второго стартует после первого", async () => {
        vi.useFakeTimers();

        const order = [];
        const replies = [];
        const { factory } = fakeWorkerFactory(({ payload, reply }) => {
            order.push(payload.sql);
            replies.push(() => reply({ ok: true, rows: [[payload.sql]] }));
        });
        const engine = createEngine({ createWorker: factory, timeoutMs: 1000 });
        const a = engine.run({ sql: "a" });
        const b = engine.run({ sql: "b" });

        await vi.advanceTimersByTimeAsync(10);
        expect(order).toEqual(["a"]);

        replies[0]();
        await vi.advanceTimersByTimeAsync(10);
        expect(order).toEqual(["a", "b"]);

        replies[1]();

        expect((await a).rows).toEqual([["a"]]);
        expect((await b).rows).toEqual([["b"]]);

        vi.useRealTimers();
    });

    it("если воркер не создаётся, возвращает понятную ошибку запуска", async () => {
        const engine = createEngine({
            createWorker() {
                throw new Error("Worker is not defined");
            }
        });
        const result = await engine.run({ sql: "SELECT 1" });

        expect(result).toMatchObject({ ok: false, startup: true });
        expect(result.error).toContain("Worker");
    });
});
