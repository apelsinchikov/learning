import { beforeAll, describe, expect, it } from "vitest";

import { diagramLessons } from "../../diagrams/lessons/index.js";
import { sqlLessons } from "../../sql/lessons/index.js";
import { compareResults } from "../../sql/check.js";
import { buildSeasonSeedSql } from "../db/seed.js";
import { createEngineCore } from "../engineCore.js";
import { CHAPTERS, findSqaLesson, sqaLessons } from "./index.js";

let engine;

beforeAll(async () => {
    engine = createEngineCore({
        loadPglite: async () => (await import("@electric-sql/pglite")).PGlite,
        seedSql: buildSeasonSeedSql()
    });
    await engine.init();
}, 60000);

const TABLES = ["guests", "bookings", "rooms", "payments", "services", "booking_services", "staff"];
const PEEK_SOURCES = {
    sql: new Set(sqlLessons.map(lesson => lesson.id)),
    diagrams: new Set(diagramLessons.map(lesson => lesson.id))
};

function allText(lesson) {
    const parts = [lesson.story, lesson.task.prompt, lesson.task.afterwards];

    for (const block of lesson.theory) {
        parts.push(block.text, block.note);
    }

    for (const question of lesson.task.questions || []) {
        parts.push(question.prompt, question.explain);
    }

    return parts.filter(Boolean).join("\n");
}

describe("состав курса", () => {
    it("id уникальны и начинаются с sqa-", () => {
        const ids = sqaLessons.map(lesson => lesson.id);

        expect(new Set(ids).size).toBe(ids.length);
        expect(ids.every(id => id.startsWith("sqa-"))).toBe(true);
    });

    it("главы пронумерованы подряд и не пустые", () => {
        expect(CHAPTERS.map(chapter => chapter.id)).toEqual(CHAPTERS.map((_, index) => index + 1));
        expect(CHAPTERS.every(chapter => chapter.lessons.length > 0)).toBe(true);
    });

    it("findSqaLesson находит урок", () => {
        expect(findSqaLesson(sqaLessons[0].id).title).toBe(sqaLessons[0].title);
        expect(findSqaLesson("nope")).toBeNull();
    });
});

describe.each(sqaLessons.map(lesson => [lesson.id, lesson]))("урок %s", (_id, lesson) => {
    it("заполнены обязательные поля", () => {
        expect(lesson.title).toBeTruthy();
        expect(lesson.summary).toBeTruthy();
        expect(lesson.story.trim().length).toBeGreaterThan(20);
        expect(lesson.theory.length).toBeGreaterThan(0);
        expect(lesson.cheat?.length).toBeGreaterThan(0);
        expect(["query", "script", "plan", "quiz"]).toContain(lesson.task.kind);
    });

    it("ссылки «Повторить» ведут на существующие уроки", () => {
        for (const [course, id] of lesson.refs || []) {
            expect(PEEK_SOURCES[course]?.has(id), `${course}:${id}`).toBe(true);
        }

        for (const match of allText(lesson).matchAll(/\[\[(sql|diagrams):([\w-]+)\|/g)) {
            expect(PEEK_SOURCES[match[1]].has(match[2]), match[0]).toBe(true);
        }
    });

    it("названия таблиц в тексте существуют в базе", () => {
        for (const match of allText(lesson).matchAll(/\[\[table:([a-z_]+)\]\]/g)) {
            expect(TABLES).toContain(match[1]);
        }
    });

    it("примеры из теории выполняются", async () => {
        for (const block of lesson.theory.filter(item => item.type === "example")) {
            const result = await engine.run({ before: lesson.before, sql: block.sql });

            expect(result.ok, `${block.sql}\n${result.error}`).toBe(true);
        }
    });

    it("задача устроена правильно", async () => {
        const { task } = lesson;

        if (task.kind === "quiz") {
            expect(task.questions.length).toBeGreaterThan(0);

            for (const question of task.questions) {
                expect(question.options.length).toBeGreaterThanOrEqual(2);
                expect(question.correct).toBeGreaterThanOrEqual(0);
                expect(question.correct).toBeLessThan(question.options.length);
                expect(question.explain).toBeTruthy();
            }

            return;
        }

        expect(task.prompt).toBeTruthy();
        expect(task.starter).toBeTruthy();
        expect(task.hints).toHaveLength(3);

        if (task.kind === "query") {
            const expected = await engine.run({ before: lesson.before, sql: task.solution });

            expect(expected.ok, expected.error).toBe(true);
            expect(expected.rowCount).toBe(task.expectRows);
            expect(expected.columns).toHaveLength(task.expectCols);

            /* Заготовка не должна сразу быть верным ответом. */
            const starter = await engine.run({ before: lesson.before, sql: task.starter });

            if (starter.ok) {
                expect(compareResults(starter, expected, { ordered: Boolean(task.ordered), names: Boolean(task.names) }).ok).toBe(false);
            }
        } else {
            expect(typeof task.verify).toBe("function");
            expect(task.probes.length).toBeGreaterThanOrEqual(0);
            expect(task.solution).toBeTruthy();

            /* Эталонный ответ обязан проходить собственную проверку. */
            const run = await engine.run({ before: lesson.before, sql: task.solution, probes: task.probes });

            expect(run.ok, run.error).toBe(true);
            expect(task.verify(run).ok, JSON.stringify(task.verify(run))).toBe(true);
        }
    });
});
