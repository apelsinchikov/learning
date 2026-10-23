import { describe, expect, it } from "vitest";

import { compareResults, normalizeValue, rowsWord } from "./check.js";

const table = (names, rows) => ({
    columns: names.map(name => ({ name, oid: 25 })),
    rows
});

describe("compareResults", () => {
    it("порядок строк не важен, если не просили", () => {
        const a = table(["x"], [[1], [2], [3]]);
        const b = table(["x"], [[3], [1], [2]]);

        expect(compareResults(a, b).ok).toBe(true);
    });

    it("порядок важен при ordered", () => {
        const a = table(["x"], [[1], [2]]);
        const b = table(["x"], [[2], [1]]);

        const result = compareResults(a, b, { ordered: true });

        expect(result.ok).toBe(false);
        expect(result.issues[0]).toContain("ORDER BY");
    });

    it("разное число колонок", () => {
        const result = compareResults(table(["a", "b"], [[1, 2]]), table(["a"], [[1]]));

        expect(result.ok).toBe(false);
        expect(result.issues[0]).toContain("Колонок");
    });

    it("лишние и недостающие строки называются по-разному", () => {
        const more = compareResults(table(["a"], [[1], [2]]), table(["a"], [[1]]));
        const less = compareResults(table(["a"], [[1]]), table(["a"], [[1], [2]]));

        expect(more.issues[0]).toContain("Лишние");
        expect(less.issues[0]).toContain("Не хватает");
    });

    it("повторы считаются: [1,1,2] не равно [1,2,2]", () => {
        const result = compareResults(table(["a"], [[1], [1], [2]]), table(["a"], [[1], [2], [2]]));

        expect(result.ok).toBe(false);
    });

    it("имена колонок проверяются только при names", () => {
        const a = table(["total"], [[1]]);
        const b = table(["cnt"], [[1]]);

        expect(compareResults(a, b).ok).toBe(true);
        expect(compareResults(a, b, { names: true }).ok).toBe(false);
        expect(compareResults(a, table(["TOTAL"], [[1]]), { names: true }).ok).toBe(true);
    });

    it("колонки переставлены местами — отдельная подсказка", () => {
        const result = compareResults(table(["b", "a"], [["x", 1]]), table(["a", "b"], [[1, "x"]]));

        expect(result.ok).toBe(false);
        expect(result.issues[0]).toContain("другом порядке");
    });

    it("число и строка с числом равны для числовых типов", () => {
        const a = { columns: [{ name: "n", oid: 1700 }], rows: [["10.50"]] };
        const b = { columns: [{ name: "n", oid: 700 }], rows: [[10.5]] };

        expect(compareResults(a, b).ok).toBe(true);
    });

    it("NULL равен NULL и не равен пустой строке", () => {
        expect(compareResults(table(["a"], [[null]]), table(["a"], [[null]])).ok).toBe(true);
        expect(compareResults(table(["a"], [[null]]), table(["a"], [[""]])).ok).toBe(false);
    });

    it("подсказки не раскрывают значения ответа", () => {
        const result = compareResults(table(["a"], [["секрет"]]), table(["a"], [["ответ"]]));

        expect(JSON.stringify(result.issues)).not.toContain("ответ");
    });
});

describe("normalizeValue и склонение", () => {
    it("null и undefined — одно и то же", () => {
        expect(normalizeValue(null)).toBe(normalizeValue(undefined));
    });

    it("rowsWord склоняет", () => {
        expect(rowsWord(1)).toBe("1 строка");
        expect(rowsWord(3)).toBe("3 строки");
        expect(rowsWord(5)).toBe("5 строк");
        expect(rowsWord(11)).toBe("11 строк");
        expect(rowsWord(21)).toBe("21 строка");
    });
});
