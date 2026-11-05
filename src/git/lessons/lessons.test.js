import { describe, expect, it } from "vitest";

import { checkOutput } from "../check.js";
import { fillPlain, keyLabel } from "../markup.js";
import { validators } from "../profile.js";
import { renderLessonPage } from "../views/page.js";
import { CHAPTERS, findGitLesson, gitLessons, lessonNumber } from "./index.js";

const profile = { login: "anna-ivanova", repo: "git-practice", name: "Анна Иванова", email: "anna@example.com", os: "windows", mode: "vscode" };
const BLOCK_TYPES = ["text", "why", "trap", "important", "cmd", "web", "how", "os"];

function everyBlock(blocks, visit) {
    for (const block of blocks) {
        visit(block);

        if (block.type === "how") {
            everyBlock(block.terminal || [], visit);
            everyBlock(block.vscode || [], visit);
        }

        if (block.type === "os") {
            everyBlock(block.mac || [], visit);
            everyBlock(block.windows || [], visit);
        }
    }
}

function allText(lesson) {
    const parts = [lesson.story, lesson.task.prompt, lesson.task.afterwards];

    everyBlock(lesson.theory, block => {
        parts.push(block.text, block.note, block.output, block.outputNote, ...(block.lines || []), ...(block.steps || []));
    });

    for (const item of lesson.task.items || []) {
        parts.push(item.text, item.check?.prompt);
    }

    for (const question of lesson.task.questions || []) {
        parts.push(question.prompt, question.explain, ...question.options);
    }

    return parts.filter(Boolean).join("\n");
}

describe("курс «Git и проект»: состав", () => {
    it("12 уроков в 4 главах", () => {
        expect(CHAPTERS).toHaveLength(4);
        expect(gitLessons).toHaveLength(12);
        expect(CHAPTERS.map(chapter => chapter.lessons.length)).toEqual([3, 3, 3, 3]);
    });

    it("идентификаторы уникальны и начинаются с git-", () => {
        const ids = gitLessons.map(lesson => lesson.id);

        expect(new Set(ids).size).toBe(ids.length);
        expect(ids.every(id => id.startsWith("git-"))).toBe(true);
    });

    it("поиск и нумерация", () => {
        expect(findGitLesson("git-why").title).toBeTruthy();
        expect(findGitLesson("нет")).toBeNull();
        expect(lessonNumber("git-why")).toBe(1);
        expect(lessonNumber("git-final")).toBe(12);
        expect(lessonNumber("нет")).toBeNull();
    });
});

describe.each(gitLessons.map(lesson => [lesson.id, lesson]))("урок %s", (_id, lesson) => {
    it("заполнен: название, краткое описание, ситуация, теория, задание", () => {
        expect(lesson.title.length).toBeGreaterThan(0);
        expect(lesson.summary.length).toBeGreaterThan(0);
        expect(lesson.story.trim().length).toBeGreaterThan(0);
        expect(lesson.theory.length).toBeGreaterThan(0);
        expect(["steps", "quiz"]).toContain(lesson.task.kind);
        expect(Array.isArray(lesson.cheat)).toBe(true);
    });

    it("блоки теории известного типа и с содержимым", () => {
        everyBlock(lesson.theory, block => {
            expect(BLOCK_TYPES).toContain(block.type);

            if (["text", "why", "trap", "important"].includes(block.type)) {
                expect(block.text.trim().length).toBeGreaterThan(0);
            }

            if (block.type === "cmd") {
                expect(block.lines.length).toBeGreaterThan(0);
            }

            if (block.type === "web") {
                expect(block.steps.length).toBeGreaterThan(0);
            }

            if (block.type === "how") {
                expect(block.terminal.length + block.vscode.length).toBeGreaterThan(0);
            }

            if (block.only) {
                expect(["terminal", "vscode", "mac", "windows"]).toContain(block.only);
            }
        });
    });

    it("в тексте только известные значения и сочетания клавиш", () => {
        const text = allText(lesson);

        for (const [, token] of text.matchAll(/\{\{([a-z]+)\}\}/g)) {
            expect(["login", "repo", "name", "email"]).toContain(token);
        }

        for (const [, spec] of text.matchAll(/\[\[key:([^\]]+)\]\]/g)) {
            expect(spec).toMatch(/^[a-z]+(\+[a-z]+)*$/);
            expect(keyLabel(spec, "mac").length).toBeGreaterThan(0);
        }

        expect(text).not.toContain("[[key:ctrl+`");
    });

    it("команды в одинарных кавычках: имя и почта берутся в них", () => {
        everyBlock(lesson.theory, block => {
            for (const line of block.lines || []) {
                if (/\{\{(name|email)\}\}/.test(line)) {
                    expect(line).toMatch(/'\{\{(name|email)\}\}'/);
                }
            }
        });
    });

    it("страница урока рисуется без ошибок", () => {
        const html = renderLessonPage(lesson, { profile, steps: { done: new Set(), drafts: {}, messages: {} } });

        expect(html).toContain(lesson.title);
        expect(html).not.toContain("undefined");
        expect(html).not.toContain("[[key");
    });

    if (lesson.task.kind === "quiz") {
        it("вопросы: варианты, верный ответ в пределах, есть разбор", () => {
            for (const question of lesson.task.questions) {
                expect(question.options.length).toBeGreaterThanOrEqual(2);
                expect(Number.isInteger(question.correct)).toBe(true);
                expect(question.correct).toBeGreaterThanOrEqual(0);
                expect(question.correct).toBeLessThan(question.options.length);
                expect(question.explain.trim().length).toBeGreaterThan(0);
            }
        });
    } else {
        it("шаги: поля профиля существуют, у проверок есть шаблоны, образцы подходят", () => {
            expect(lesson.task.items.length).toBeGreaterThan(0);

            for (const item of lesson.task.items) {
                expect(item.text.trim().length).toBeGreaterThan(0);

                if (item.field) {
                    expect(Object.keys(validators)).toContain(item.field);
                }

                if (!item.check) {
                    continue;
                }

                expect(item.check.prompt.length).toBeGreaterThan(0);
                expect(item.check.patterns.length).toBeGreaterThan(0);

                for (const pattern of item.check.patterns) {
                    expect(pattern.hint.length).toBeGreaterThan(0);
                    expect(() => new RegExp(pattern.re.replace(/\{\{[a-z]+\}\}/g, "x"), "i")).not.toThrow();
                    expect(pattern.samples?.length).toBeGreaterThan(0);

                    for (const sample of pattern.samples) {
                        const output = fillPlain(sample, profile, "text");
                        const result = checkOutput(output, [pattern], profile);

                        expect(result.ok, `образец «${sample}» не проходит ${pattern.re}`).toBe(true);
                    }

                    /* чужой вывод не должен проходить */
                    expect(checkOutput("fatal: unrelated output", [pattern], profile).ok).toBe(false);
                }
            }
        });
    }

    it("шпаргалка: пары «команда — смысл»", () => {
        for (const entry of lesson.cheat) {
            expect(entry).toHaveLength(2);
            expect(entry.every(part => typeof part === "string" && part.length > 0)).toBe(true);
        }
    });
});

describe("курс «Git и проект»: сквозная проверка", () => {
    it("в каждой главе есть задание, которое проверяет вывод или отметки", () => {
        const kinds = gitLessons.map(lesson => lesson.task.kind);

        expect(kinds.filter(kind => kind === "steps").length).toBeGreaterThanOrEqual(8);
        expect(kinds.filter(kind => kind === "quiz")).toHaveLength(2);
    });

    it("команды курса не требуют кавычек-ёлочек и не оставляют незаменённых значений", () => {
        for (const lesson of gitLessons) {
            const html = renderLessonPage(lesson, { profile, steps: { done: new Set(), drafts: {}, messages: {} } });

            expect(html).not.toContain("{{");
        }
    });
});
