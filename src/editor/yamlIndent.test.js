import { describe, expect, it } from "vitest";
import { getNextLineIndent } from "./yamlIndent.js";

const indentAfter = line => getNextLineIndent(line).indent;

describe("getNextLineIndent", () => {
    it("после ключа без значения делает вложенность глубже", () => {
        expect(indentAfter("paths:")).toBe("  ");
        expect(indentAfter("  /users:")).toBe("    ");
        expect(indentAfter("        '200':")).toBe(" ".repeat(10));
    });

    it("после ключа со значением остаётся на том же уровне", () => {
        expect(indentAfter("      summary: Get users")).toBe(" ".repeat(6));
        expect(indentAfter("openapi: 3.0.3")).toBe("");
    });

    it("после «- key: value» выравнивает по ключу элемента списка", () => {
        expect(indentAfter("        - name: id")).toBe(" ".repeat(10));
    });

    it("после «- key:» уходит вглубь относительно ключа", () => {
        expect(indentAfter("    - name:")).toBe(" ".repeat(8));
    });

    it("после «- значение» начинает следующий элемент списка", () => {
        expect(indentAfter("    - id")).toBe("    - ");
    });

    it("на пустом «-» выходит из списка", () => {
        expect(getNextLineIndent("    -")).toEqual({
            indent: "  ",
            exitList: true
        });
    });

    it("блочный скаляр (|) увеличивает отступ", () => {
        expect(indentAfter("      description: |")).toBe(" ".repeat(8));
    });

    it("не считает комментарий частью строки", () => {
        expect(indentAfter("    key: value # note")).toBe("    ");
        expect(indentAfter("    key: # note")).toBe("      ");
    });

    it("на пустой строке сохраняет отступ", () => {
        expect(indentAfter("   ")).toBe("   ");
        expect(indentAfter("")).toBe("");
    });
});
