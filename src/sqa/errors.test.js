import { describe, expect, it } from "vitest";

import { humanizeRunError } from "./errors.js";

describe("humanizeRunError", () => {
    it("разбирает ограничения по коду и называет ограничение", () => {
        expect(humanizeRunError({ code: "23505", constraint: "guests_email_key", error: "x" })).toMatchObject({
            title: "Нарушена уникальность"
        });
        expect(humanizeRunError({ code: "23505", constraint: "guests_email_key", error: "x" }).text).toContain("guests_email_key");
        expect(humanizeRunError({ code: "23503", constraint: "fk", error: "x" }).title).toContain("ссылаются");
        expect(humanizeRunError({ code: "23514", constraint: "chk", error: "x" }).title).toContain("CHECK");
        expect(humanizeRunError({ code: "23502", error: "x" }).text).toContain("NOT NULL");
    });

    it("подсказывает названия из текущей схемы, а не из базового курса", () => {
        const schema = [{ name: "bookings", columns: [{ name: "check_in" }, { name: "guest_id" }] }];
        const result = humanizeRunError({ code: "42P01", error: 'relation "bokings" does not exist' }, schema);

        expect(result.text).toContain("bookings");
        expect(result.text).not.toContain("key_log");
    });

    it("остальное отдаёт общему разбору SQL-курса", () => {
        const result = humanizeRunError({ code: "42703", error: 'column "nme" does not exist' });

        expect(result.title).toBeTruthy();
        expect(result.text).toBeTruthy();
    });
});

import { errorRefs } from "./errors.js";

describe("повторить после ошибки", () => {
    it("ограничения и синтаксис ведут на нужные темы", () => {
        expect(errorRefs({ code: "23505" })[0][1]).toBe("dg-er-keys");
        expect(errorRefs({ code: "23502" })[0][1]).toBe("sql-null");
        expect(errorRefs({ code: "42601" })).toHaveLength(1);
        expect(errorRefs({ code: "XX000" })).toEqual([]);
    });
});
