/*
 * Воркер движка SQL Advanced. Postgres (PGlite) работает здесь, а не на главной
 * странице: PGlite выполняет запрос в одном потоке и его нельзя прервать, поэтому
 * зависший запрос (например, бесконечная рекурсия) остановить можно только
 * завершив воркер. Движок на странице (engine.js) так и делает через 10 секунд.
 */
import { createEngineCore } from "./engineCore.js";
import { buildSeasonSeedSql } from "./db/seed.js";
import { loadPglite } from "../sql/pgliteLoader.js";

const core = createEngineCore({ loadPglite, seedSql: buildSeasonSeedSql() });

self.onmessage = async event => {
    const { id, type, payload } = event.data;

    try {
        if (type === "init") {
            await core.init();
            self.postMessage({ id, result: { ok: true } });
        } else if (type === "run") {
            self.postMessage({ id, result: await core.run(payload) });
        } else if (type === "inspect") {
            self.postMessage({ id, result: await core.inspect(payload.sql, payload) });
        }
    } catch (error) {
        self.postMessage({ id, result: { ok: false, error: String((error && error.message) || error), startup: true } });
    }
};
