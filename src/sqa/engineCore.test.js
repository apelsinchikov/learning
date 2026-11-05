import { beforeAll, describe, expect, it } from "vitest";

import { createEngineCore } from "./engineCore.js";

const SEED = `
CREATE TABLE guests (id int PRIMARY KEY, name text NOT NULL, born date);
INSERT INTO guests VALUES (1, 'Анна', '1990-05-01'), (2, 'Борис', '1985-11-30');
CREATE TABLE ev (id int PRIMARY KEY, guest_id int, kind text);
INSERT INTO ev SELECT x, (x * 7919) % 5000, 'k' || (x % 5) FROM generate_series(1, 20000) x;
`;

let engine;

beforeAll(async () => {
    engine = createEngineCore({
        loadPglite: async () => (await import("@electric-sql/pglite")).PGlite,
        seedSql: SEED
    });
    await engine.init();
}, 60000);

describe("запуск с откатом", () => {
    it("обычный запрос возвращает колонки и строки, даты строкой", async () => {
        const result = await engine.run({ sql: "SELECT id, name, born FROM guests ORDER BY id" });

        expect(result.ok).toBe(true);
        expect(result.columns.map(c => c.name)).toEqual(["id", "name", "born"]);
        expect(result.rows).toEqual([[1, "Анна", "1990-05-01"], [2, "Борис", "1985-11-30"]]);
    });

    it("count(*) приходит числом", async () => {
        const result = await engine.run({ sql: "SELECT count(*) FROM guests" });

        expect(result.rows).toEqual([[2]]);
    });

    it("INSERT выполняется (виден в этом же запуске), но не остаётся", async () => {
        const first = await engine.run({ sql: "INSERT INTO guests VALUES (3, 'Вера', NULL); SELECT count(*) FROM guests" });

        expect(first.rows).toEqual([[3]]);

        const second = await engine.run({ sql: "SELECT count(*) FROM guests" });

        expect(second.rows).toEqual([[2]]);
    });

    it("созданная таблица и индекс исчезают после запуска", async () => {
        const created = await engine.run({ sql: "CREATE TABLE t1 (id int PRIMARY KEY); INSERT INTO t1 VALUES (1); SELECT * FROM t1" });

        expect(created.ok).toBe(true);
        expect(created.rows).toEqual([[1]]);

        const gone = await engine.run({ sql: "SELECT * FROM t1" });

        expect(gone.ok).toBe(false);
        expect(gone.error).toContain("t1");
    });

    it("команда без таблицы результата сообщает число затронутых строк", async () => {
        const result = await engine.run({ sql: "UPDATE guests SET name = name" });

        expect(result.ok).toBe(true);
        expect(result.columns).toEqual([]);
        expect(result.affected).toBe(2);
    });

    it("ошибка не ломает следующий запуск", async () => {
        const bad = await engine.run({ sql: "SELECT * FROM nope" });

        expect(bad.ok).toBe(false);

        const good = await engine.run({ sql: "SELECT 1 AS a" });

        expect(good.ok).toBe(true);
    });

    it("before готовит состояние урока и тоже откатывается", async () => {
        const before = "CREATE TABLE draft (id int); INSERT INTO draft VALUES (1), (2), (3);";
        const result = await engine.run({ before, sql: "SELECT count(*) FROM draft" });

        expect(result.rows).toEqual([[3]]);
        expect((await engine.run({ sql: "SELECT * FROM draft" })).ok).toBe(false);
    });
});

describe("запреты", () => {
    it("COMMIT и BEGIN ученика не выполняются, база остаётся прежней", async () => {
        const commit = await engine.run({ sql: "CREATE TABLE leak (id int); COMMIT" });

        expect(commit.ok).toBe(false);
        expect(commit.rejected).toBe("transaction");
        expect((await engine.run({ sql: "SELECT * FROM leak" })).ok).toBe(false);
    });

    it("CREATE EXTENSION и COPY отклонены", async () => {
        expect((await engine.run({ sql: "CREATE EXTENSION pgcrypto" })).rejected).toBe("forbidden");
        expect((await engine.run({ sql: "COPY guests TO STDOUT" })).rejected).toBe("forbidden");
    });
});

describe("ограничения: код и имя в ответе", () => {
    it("UNIQUE", async () => {
        const result = await engine.run({ sql: "CREATE TABLE c (id int PRIMARY KEY, e text UNIQUE); INSERT INTO c VALUES (1, 'a'), (2, 'a')" });

        expect(result.ok).toBe(false);
        expect(result.code).toBe("23505");
        expect(result.constraint).toBe("c_e_key");
    });

    it("CHECK, FOREIGN KEY, NOT NULL", async () => {
        const check = await engine.run({ sql: "CREATE TABLE c (a int CHECK (a >= 0)); INSERT INTO c VALUES (-1)" });
        const fk = await engine.run({ sql: "INSERT INTO ev VALUES (999999, 1, 'x'); CREATE TABLE d (g int REFERENCES guests (id)); INSERT INTO d VALUES (77)" });
        const notNull = await engine.run({ sql: "INSERT INTO guests (id, name) VALUES (9, NULL)" });

        expect(check.code).toBe("23514");
        expect(fk.code).toBe("23503");
        expect(notNull.code).toBe("23502");
    });
});

describe("проверочные запросы (probes)", () => {
    it("видят результат запроса ученика", async () => {
        const result = await engine.run({
            sql: "CREATE TABLE room (a int, b int, PRIMARY KEY (a, b))",
            probes: [
                "SELECT column_name FROM information_schema.columns WHERE table_name = 'room' ORDER BY ordinal_position",
                "SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'room'::regclass"
            ]
        });

        expect(result.ok).toBe(true);
        expect(result.probes[0].rows).toEqual([["a"], ["b"]]);
        expect(result.probes[1].rows).toEqual([["PRIMARY KEY (a, b)"]]);
    });

    it("ошибка одного не мешает остальным; пробные вставки показывают код", async () => {
        const result = await engine.run({
            sql: "CREATE TABLE p (a int CHECK (a > 0))",
            probes: ["INSERT INTO p VALUES (-5)", "SELECT 7", "SELECT * FROM missing_table"]
        });

        expect(result.probes[0].ok).toBe(false);
        expect(result.probes[0].code).toBe("23514");
        expect(result.probes[1].rows).toEqual([[7]]);
        expect(result.probes[2].ok).toBe(false);
    });
});

describe("схема после запроса", () => {
    it("withSchema возвращает таблицы, созданные запросом", async () => {
        const result = await engine.run({ sql: "CREATE TABLE made (id int PRIMARY KEY)", withSchema: true });
        const names = result.schema.map(table => table.name);

        expect(names).toContain("made");
        expect(names).toContain("guests");
    });
});

describe("планы", () => {
    const plan = async sql => (await engine.run({ sql })).rows.map(row => row[0]).join("\n");

    it("без индекса — Seq Scan с обычной стоимостью, с индексом — индексный план", async () => {
        const before = await plan("EXPLAIN SELECT * FROM ev WHERE guest_id = 42");

        expect(before).toContain("Seq Scan");
        expect(before).not.toContain("10000000000");

        const after = (
            await engine.run({
                sql: "CREATE INDEX ix_ev_guest ON ev (guest_id)",
                probes: ["ANALYZE ev", "EXPLAIN SELECT * FROM ev WHERE guest_id = 42"]
            })
        ).probes[1].rows.map(row => row[0]).join("\n");

        expect(after).toMatch(/Index Scan|Bitmap Index Scan|Index Only Scan/);
    });

    it("uuid генерируется встроенной функцией", async () => {
        const result = await engine.run({ sql: "SELECT gen_random_uuid()::text" });

        expect(result.rows[0][0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-/);
    });
});
