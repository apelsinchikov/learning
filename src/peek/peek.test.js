import { describe, expect, it } from "vitest";

import { normalizeLesson, renderFull, renderPanel, renderQuick } from "./content.js";
import { PEEK_SOURCES } from "./sources.js";
import { sqaLessons } from "../sqa/lessons/index.js";

describe("панель «Повторить»: все ссылки курса SQL Advanced ведут на существующие уроки", () => {
    const refs = sqaLessons.flatMap(lesson => (lesson.refs || []).map(ref => ({ lesson: lesson.id, ref })));

    it("в курсе есть ссылки", () => {
        expect(refs.length).toBeGreaterThan(0);
    });

    for (const { lesson, ref: [course, id] } of refs) {
        it(`${lesson} → ${course}:${id}`, async () => {
            expect(PEEK_SOURCES[course]).toBeTruthy();

            const loaded = await PEEK_SOURCES[course].load(id);

            expect(loaded?.id).toBe(id);
            expect(loaded.title).toBeTruthy();
            expect(loaded.where).toMatch(/Урок \d+/);
        });
    }
});

describe("содержимое панели", () => {
    const lesson = normalizeLesson({
        course: "sql",
        courseLabel: "SQL",
        chapter: { id: 3 },
        number: 7,
        lesson: {
            id: "x",
            title: "JOIN <ON>",
            summary: "Склеиваем таблицы.",
            cheat: [["JOIN ... ON", "склеить по ключу"]],
            theory: [
                { type: "text", text: "Текст про **JOIN**." },
                { type: "why", text: "Чтобы читать связи." },
                { type: "example", sql: "SELECT 1 AS one;", note: "Один." },
                { type: "trap", text: "Забыли ON." },
                { type: "unknown", text: "не показывать" }
            ],
            task: { starter: "СЕКРЕТ" },
            story: "СЮЖЕТ"
        }
    });

    it("нормализует урок: место и блоки без неизвестных", () => {
        expect(lesson.where).toBe("Глава 3 · Урок 7");
        expect(lesson.blocks.map(block => block.type)).toEqual(["text", "why", "code", "trap"]);
    });

    it("краткий вид: суть, шпаргалка, пример; без задачи и сюжета", () => {
        const html = renderQuick(lesson);

        expect(html).toContain("Склеиваем таблицы.");
        expect(html).toContain("JOIN ... ON");
        expect(html).toContain("SELECT");
        expect(html).not.toContain("СЕКРЕТ");
        expect(html).not.toContain("СЮЖЕТ");
        expect(html).not.toContain("data-run");
    });

    it("полный вид: вся теория", () => {
        const html = renderFull(lesson);

        expect(html).toContain("Забыли ON.");
        expect(html).toContain("Чтобы читать связи.");
    });

    it("заголовок экранируется, ссылка открывается в новой вкладке", () => {
        const html = renderPanel(lesson, { href: "https://x/#/sql/x" });

        expect(html).toContain("JOIN &lt;ON&gt;");
        expect(html).not.toContain("JOIN <ON>");
        expect(html).toContain('target="_blank"');
        expect(html).toContain('role="complementary"');
        expect(renderPanel(lesson, { href: "#", narrow: true })).toContain('role="dialog"');
    });
});
