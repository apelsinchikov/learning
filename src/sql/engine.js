import { loadPglite as defaultLoadPglite } from "./pgliteLoader.js";
import { buildSeedSql } from "./hotel/seed.js";

/*
 * Движок запросов. Один экземпляр на страницу: база создаётся один раз,
 * после чего все запросы читают её, но не меняют (read-only).
 *
 *   const engine = createEngine();
 *   await engine.init();
 *   const result = await engine.run("SELECT 1");
 *   // { ok: true, columns: [{ name, oid }], rows: [[...]], rowCount }
 *   // { ok: false, error: "текст ошибки Postgres" }
 */

const DATE_OID = 1082;
const TIMESTAMP_OID = 1114;
const TIMESTAMPTZ_OID = 1184;

const pad = n => String(n).padStart(2, "0");

/* Даты и время всегда возвращаем строками, как их пишет сам Postgres. */
const PASS_THROUGH = {
    [DATE_OID]: value => value,
    [TIMESTAMP_OID]: value => value,
    [TIMESTAMPTZ_OID]: value => value
};

const READ_ONLY_START = /^(select|with|values|table|explain)\b/i;

/* Убирает комментарии и пробелы в начале, чтобы понять, чем начинается запрос. */
export function stripLeadingNoise(sql) {
    let text = String(sql || "");
    let previous;

    do {
        previous = text;
        text = text.replace(/^\s+/, "").replace(/^--[^\n]*(\n|$)/, "").replace(/^\/\*[\s\S]*?\*\//, "");
    } while (text !== previous);

    return text;
}

export function checkReadOnly(sql) {
    const text = stripLeadingNoise(sql);

    if (!text) {
        return { ok: false, error: "Запрос пустой. Напиши SELECT и нажми «Выполнить»." };
    }

    if (!READ_ONLY_START.test(text)) {
        return { ok: false, error: "cannot execute non-SELECT statement in a read-only transaction" };
    }

    return { ok: true };
}

export function createEngine({
    loadPglite = defaultLoadPglite,
    seedSql = buildSeedSql()
} = {}) {
    let db = null;
    let ready = null;
    let formatters = {};

    /*
     * Если движок всё же вернул объекты Date (старые версии), узнаём,
     * как именно они получены, и выводим дату так же, как её хранит база.
     */
    async function calibrate() {
        const result = await db.query(
            "SELECT TIMESTAMP '2026-02-15 01:12:00', DATE '2026-02-12'",
            [],
            { rowMode: "array", parsers: PASS_THROUGH }
        );

        const [timestamp, date] = result.rows[0];

        if (timestamp instanceof Date) {
            const local = timestamp.getHours() === 1;

            formatters[TIMESTAMP_OID] = value =>
                local
                    ? `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`
                    : value.toISOString().slice(0, 19).replace("T", " ");
        }

        if (date instanceof Date) {
            const local = date.getDate() === 12;

            formatters[DATE_OID] = value =>
                local
                    ? `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
                    : value.toISOString().slice(0, 10);
        }
    }

    function formatValue(value, oid) {
        if (value instanceof Date) {
            const format = formatters[oid] || formatters[TIMESTAMP_OID];

            return format ? format(value) : value.toISOString();
        }

        if (typeof value === "bigint") {
            return Number.isSafeInteger(Number(value)) ? Number(value) : value.toString();
        }

        return value;
    }

    function init() {
        if (!ready) {
            ready = (async () => {
                const PGlite = await loadPglite();

                db = new PGlite({ parsers: PASS_THROUGH });

                if (db.waitReady) {
                    await db.waitReady;
                }

                await db.exec(seedSql);
                await db.exec("SET TIME ZONE 'UTC'; SET default_transaction_read_only = on;");
                await calibrate();
            })().catch(error => {
                ready = null;
                db = null;
                throw error;
            });
        }

        return ready;
    }

    async function run(sql) {
        const allowed = checkReadOnly(sql);

        if (!allowed.ok) {
            return { ok: false, error: allowed.error };
        }

        try {
            await init();

            const result = await db.query(sql, [], { rowMode: "array", parsers: PASS_THROUGH });
            const columns = (result.fields || []).map(field => ({
                name: field.name,
                oid: field.dataTypeID
            }));

            const rows = (result.rows || []).map(row =>
                row.map((value, index) => formatValue(value, columns[index]?.oid))
            );

            return { ok: true, columns, rows, rowCount: rows.length };
        } catch (error) {
            return { ok: false, error: String((error && error.message) || error) };
        }
    }

    return {
        init,
        run,
        isReady: () => db !== null
    };
}
