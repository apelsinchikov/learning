import { describe, expect, it } from "vitest";
import {
    classifyBlock,
    dedentText,
    escapeHtml,
    highlightCode,
    renderText
} from "./textFormat.js";

describe("escapeHtml", () => {
    it("экранирует спецсимволы", () => {
        expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
            "&lt;a href=&quot;x&quot;&gt;&#039;&amp;&#039;&lt;/a&gt;"
        );
    });
});

describe("highlightCode", () => {
    it("не ломает апострофы в SQL", () => {
        const html = highlightCode("WHERE name = 'Ivan' AND id = 5", "sql");

        expect(html).toContain("&#039;Ivan&#039;");
        expect(html).not.toContain("&#<span");
    });

    it("не подсвечивает цифры внутри строк JSON", () => {
        const html = highlightCode('{"a": "it\'s 5"}', "json");

        expect(html).toContain("it&#039;s 5");
        expect(html).not.toContain("code-number");
    });

    it("подсвечивает ключи YAML и сохраняет отступы", () => {
        const html = highlightCode("a:\n  b: 1", "yaml");

        expect(html).toContain('<span class="code-key">a</span>:');
        expect(html).toContain("\n  <span");
    });
});

describe("classifyBlock", () => {
    it("узнаёт YAML", () => {
        expect(classifyBlock(["paths:", "  /users:", "    get:"])).toBe("code");
    });

    it("узнаёт схему со стрелками", () => {
        expect(classifyBlock(["User", "↓", "object"])).toBe("diagram");
    });

    it("узнаёт список", () => {
        expect(classifyBlock(["- один", "- два"])).toBe("list");
    });

    it("обычное предложение остаётся абзацем", () => {
        expect(classifyBlock(["Например:"])).toBe("paragraph");
        expect(
            classifyBlock(["Это обычный текст,", "который идёт в две строки."])
        ).toBe("paragraph");
    });

    it("подпись вида «Request:» — не код", () => {
        expect(classifyBlock(["Request:"])).toBe("paragraph");
    });
});

describe("renderText", () => {
    it("сохраняет дерево YAML с отступами", () => {
        const html = renderText(`
            Пример:

            User:
              type: object
              properties:
                id:
                  type: integer
        `);

        expect(html).toContain("<pre");
        expect(html).toContain("\n  <span");
        expect(html).toContain("\n    <span");
    });

    it("склеивает строки обычного абзаца", () => {
        const html = renderText("Первая строка\nвторая строка.");

        expect(html).toContain("Первая строка вторая строка.");
    });

    it("поддерживает явные блоки кода в тройных кавычках", () => {
        const html = renderText("Текст\n\n```yaml\na:\n  b: 1\n```\n\nЕщё текст");

        expect(html).toContain("<pre");
        expect(html).toContain("Ещё текст");
    });

    it("экранирует HTML", () => {
        expect(renderText("<script>alert(1)</script>")).not.toContain("<script>");
    });
});

describe("dedentText", () => {
    it("убирает общий отступ и пустые края", () => {
        expect(dedentText("\n    a:\n      b\n  ")).toBe("a:\n  b");
    });
});
