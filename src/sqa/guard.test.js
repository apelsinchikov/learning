import { describe, expect, it } from "vitest";

import { checkSql, splitStatements } from "./guard.js";

describe("splitStatements", () => {
    it("делит по «;» и убирает пустое", () => {
        expect(splitStatements("SELECT 1; SELECT 2;;")).toEqual(["SELECT 1", "SELECT 2"]);
    });

    it("не режет по «;» внутри строки, комментария и $$", () => {
        expect(splitStatements("SELECT 'a;b'; -- c;d\nSELECT 2")).toHaveLength(2);
        expect(splitStatements("SELECT $$x;y$$; SELECT 2")).toHaveLength(2);
        expect(splitStatements("/* a; b */ SELECT 1")).toHaveLength(1);
    });

    it("строки с удвоенной кавычкой и E-строки с обратной косой чертой", () => {
        expect(splitStatements("SELECT 'it''s; ok'; SELECT 2")).toHaveLength(2);
        expect(splitStatements("SELECT E'a\\';b'; SELECT 2")).toHaveLength(2);
    });
});

describe("checkSql", () => {
    it("обычные запросы и DDL проходят", () => {
        for (const sql of [
            "SELECT * FROM guests",
            "WITH x AS (SELECT 1) SELECT * FROM x",
            "CREATE TABLE t (id int)",
            "INSERT INTO t VALUES (1); SELECT * FROM t",
            "CREATE INDEX ix ON t (id)",
            "CREATE VIEW v AS SELECT 1",
            "EXPLAIN SELECT 1"
        ]) {
            expect(checkSql(sql).ok, sql).toBe(true);
        }
    });

    it("пустой запрос и одни комментарии отклоняются", () => {
        expect(checkSql("").ok).toBe(false);
        expect(checkSql("  -- ничего").ok).toBe(false);
    });

    it("BEGIN, COMMIT, ROLLBACK, SAVEPOINT отклоняются с объяснением", () => {
        for (const sql of ["BEGIN", "commit;", "ROLLBACK", "SAVEPOINT a", "START TRANSACTION", "END", "SELECT 1; COMMIT"]) {
            const result = checkSql(sql);

            expect(result.ok, sql).toBe(false);
            expect(result.kind).toBe("transaction");
            expect(result.error).toContain("откатываются сами");
        }
    });

    it("слова в строках и комментариях не считаются командами", () => {
        expect(checkSql("SELECT 'commit; rollback' AS word").ok).toBe(true);
        expect(checkSql("-- begin\nSELECT 1").ok).toBe(true);
        expect(checkSql("SELECT 1 AS \"commit\"").ok).toBe(true);
    });

    it("опасные команды отключены", () => {
        for (const sql of [
            "COPY guests TO STDOUT",
            "CREATE EXTENSION pgcrypto",
            "DROP DATABASE x",
            "CREATE ROLE a",
            "ALTER SYSTEM SET x = 1",
            "SET ROLE x",
            "SET enable_seqscan = off",
            "GRANT ALL ON guests TO x",
            "DO $$ BEGIN COMMIT; END $$"
        ]) {
            expect(checkSql(sql).ok, sql).toBe(false);
        }
    });

    it("DROP TABLE и ALTER TABLE разрешены: всё откатится", () => {
        expect(checkSql("DROP TABLE t").ok).toBe(true);
        expect(checkSql("ALTER TABLE t ADD COLUMN x int").ok).toBe(true);
    });
});
