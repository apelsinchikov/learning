import { describe, expect, it } from "vitest";

import { closest, distance, humanizeError } from "./errors.js";

describe("distance и closest", () => {
    it("считает правки", () => {
        expect(distance("abc", "abc")).toBe(0);
        expect(distance("fullname", "full_name")).toBe(1);
    });

    it("находит ближайшее слово и не выдумывает далёкое", () => {
        expect(closest("guest", ["guests", "rooms"])).toBe("guests");
        expect(closest("zzzzzz", ["guests", "rooms"])).toBeNull();
    });
});

describe("humanizeError", () => {
    it("колонка не найдена: подсказывает похожую", () => {
        const result = humanizeError('column "fullname" does not exist');

        expect(result.text).toContain("full_name");
    });

    it("таблица не найдена: подсказывает guests", () => {
        const result = humanizeError('relation "guest" does not exist');

        expect(result.text).toContain("guests");
    });

    it("опечатка FORM вместо FROM", () => {
        const result = humanizeError('syntax error at or near "FORM"');

        expect(result.text).toContain("FROM");
    });

    it("запись данных запрещена", () => {
        const a = humanizeError("cannot execute INSERT in a read-only transaction");
        const b = humanizeError("cannot execute non-SELECT statement in a read-only transaction");

        expect(a.title).toBe("Менять данные нельзя");
        expect(b.title).toBe("Менять данные нельзя");
    });

    it("неоднозначная колонка", () => {
        const result = humanizeError('column reference "room_id" is ambiguous');

        expect(result.text).toContain("room_id");
    });

    it("агрегат в WHERE подсказывает HAVING", () => {
        const result = humanizeError("aggregate functions are not allowed in WHERE");

        expect(result.text).toContain("HAVING");
    });

    it("неизвестная ошибка показывается как есть", () => {
        const result = humanizeError("something weird");

        expect(result.text).toContain("something weird");
    });

    it("пустой ввод не падает", () => {
        expect(() => humanizeError(undefined)).not.toThrow();
    });
});

describe("опечатки в ключевых словах", () => {
    it("FORM вместо FROM после SELECT: база видит колонку form", () => {
        const result = humanizeError('column "form" does not exist');

        expect(result.text).toContain("FROM");
        expect(result.text).toContain("опечатку");
    });

    it("обычная неизвестная колонка отсылает к вкладке «База»", () => {
        const result = humanizeError('column "zzzzzzzz" does not exist');

        expect(result.text).toContain("«База»");
    });
});
