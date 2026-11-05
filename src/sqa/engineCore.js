import { checkSql } from "./guard.js";

/*
 * Ядро движка SQL Advanced: Postgres (PGlite) с записью, но без последствий.
 *
 *   run({ before, sql, probes })
 *
 * Всё идёт внутри одной транзакции, которая в конце ВСЕГДА откатывается:
 *   1. before — подготовка состояния урока (создать таблицу, добавить строки);
 *   2. sql    — запрос ученика;
 *   3. probes — проверочные запросы после запроса ученика (каждый в своей точке
 *               сохранения, чтобы ошибка одного не ломала остальные).
 * Результат запроса ученика — последняя команда, которая вернула колонки.
 * Ядро работает в воркере (engineWorker.js), в тестах — напрямую.
 */

const DATE_OID = 1082;
const TIMESTAMP_OID = 1114;
const TIMESTAMPTZ_OID = 1184;

/* Даты и время всегда возвращаем строками, как их пишет сам Postgres. */
const PASS_THROUGH = {
    [DATE_OID]: value => value,
    [TIMESTAMP_OID]: value => value,
    [TIMESTAMPTZ_OID]: value => value
};

const QUERY_OPTIONS = { rowMode: "array", parsers: PASS_THROUGH };

function plainValue(value) {
    if (typeof value === "bigint") {
        return Number.isSafeInteger(Number(value)) ? Number(value) : value.toString();
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    return value;
}

function toTable(results) {
    const list = Array.isArray(results) ? results : [results];
    const withColumns = list.filter(item => (item.fields || []).length > 0);
    const shown = withColumns[withColumns.length - 1] || list[list.length - 1] || { fields: [], rows: [] };
    const columns = (shown.fields || []).map(field => ({ name: field.name, oid: field.dataTypeID }));
    const rows = (shown.rows || []).map(row => row.map(plainValue));
    const affected = list.reduce((sum, item) => sum + (Number(item.affectedRows) || 0), 0);

    return { columns, rows, rowCount: rows.length, affected, statements: list.length };
}

function failure(error) {
    return {
        ok: false,
        error: String((error && error.message) || error),
        code: error && error.code ? String(error.code) : null,
        constraint: error && error.constraint ? String(error.constraint) : null,
        position: error && error.position ? Number(error.position) : null
    };
}

export function createEngineCore({ loadPglite, seedSql }) {
    let db = null;
    let ready = null;

    function init() {
        if (!ready) {
            ready = (async () => {
                const PGlite = await loadPglite();

                db = new PGlite({ parsers: PASS_THROUGH });

                if (db.waitReady) {
                    await db.waitReady;
                }

                await db.exec(seedSql);
                await db.exec("SET TIME ZONE 'UTC'; SET enable_seqscan = on;");
            })().catch(error => {
                ready = null;
                db = null;
                throw error;
            });
        }

        return ready;
    }

    async function runProbe(sql, index) {
        const point = `sqa_probe_${index}`;

        await db.exec(`SAVEPOINT ${point}`);

        try {
            const table = toTable(await db.exec(sql, QUERY_OPTIONS));

            return { ok: true, ...table };
        } catch (error) {
            await db.exec(`ROLLBACK TO SAVEPOINT ${point}`);

            return failure(error);
        } finally {
            await db.exec(`RELEASE SAVEPOINT ${point}`).catch(() => {});
        }
    }

    async function run({ before = "", sql, probes = [] }) {
        const allowed = checkSql(sql);

        if (!allowed.ok) {
            return { ok: false, error: allowed.error, rejected: allowed.kind || "empty" };
        }

        try {
            await init();
        } catch (error) {
            return { ...failure(error), startup: true };
        }

        try {
            await db.exec("BEGIN");

            if (before) {
                await db.exec(before);
            }

            const table = toTable(await db.exec(sql, QUERY_OPTIONS));
            const probeResults = [];

            for (let index = 0; index < probes.length; index++) {
                probeResults.push(await runProbe(probes[index], index));
            }

            return { ok: true, ...table, probes: probeResults };
        } catch (error) {
            return failure(error);
        } finally {
            try {
                await db.exec("ROLLBACK");
            } catch {
                /* транзакция уже закрыта ошибкой — откатывать нечего */
            }
        }
    }

    /* Запрос без ограничений ученика: для схемы и первых строк таблиц (только чтение). */
    async function inspect(sql, { before = "" } = {}) {
        try {
            await init();
            await db.exec("BEGIN");

            if (before) {
                await db.exec(before);
            }

            return { ok: true, ...toTable(await db.exec(sql, QUERY_OPTIONS)) };
        } catch (error) {
            return failure(error);
        } finally {
            try {
                await db.exec("ROLLBACK");
            } catch {
                /* ничего */
            }
        }
    }

    return { init, run, inspect, isReady: () => db !== null };
}
