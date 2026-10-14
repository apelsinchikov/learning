import { describe, expect, it } from "vitest";
import { parse } from "yaml";

import { course } from "./course.js";
import { Theory } from "../components/Theory.js";
import { validateLesson } from "../utils/validator.js";

const practiceLessons = course.filter(lesson => lesson.type === "practice");

describe("структура курса", () => {
    it("у всех уроков уникальный id", () => {
        const ids = course.map(lesson => lesson.id);

        expect(new Set(ids).size).toBe(ids.length);
    });

    it.each(course.map(lesson => [lesson.id, lesson]))(
        "урок %s содержит обязательные поля",
        (_, lesson) => {
            for (const field of ["type", "icon", "title", "subtitle", "sidebarDescription"]) {
                expect(lesson[field], field).toBeTruthy();
            }

            expect(["theory", "practice"]).toContain(lesson.type);
        }
    );

    it.each(course.map(lesson => [lesson.id, lesson]))(
        "урок %s отображается без ошибок",
        (_, lesson) => {
            expect(() => Theory(lesson)).not.toThrow();
        }
    );

    it("ссылки theoryLinks указывают на существующие уроки", () => {
        for (const lesson of practiceLessons) {
            for (const id of lesson.theoryLinks || []) {
                expect(course.some(item => item.id === id), id).toBe(true);
            }
        }
    });
});

describe("практические уроки", () => {
    it.each(practiceLessons.map(lesson => [lesson.id, lesson]))(
        "%s: есть стартовый YAML, проверка и сообщение об успехе",
        (_, lesson) => {
            expect(lesson.initialYaml).toBeTruthy();
            expect(lesson.validation).toBeTruthy();
            expect(lesson.successMessage).toBeTruthy();
        }
    );

    it.each(practiceLessons.map(lesson => [lesson.id, lesson]))(
        "%s: стартовый YAML читается как YAML",
        (_, lesson) => {
            expect(() => parse(lesson.initialYaml)).not.toThrow();
        }
    );

    it.each(practiceLessons.map(lesson => [lesson.id, lesson]))(
        "%s: стартовый YAML ещё не решает задание",
        async (_, lesson) => {
            const result = await validateLesson(lesson, lesson.initialYaml);

            expect(
                result.openapiErrors.length + result.taskErrors.length
            ).toBeGreaterThan(0);
        }
    );

    it.each(practiceLessons.map(lesson => [lesson.id, lesson]))(
        "%s: в стартовом YAML нет пустых скобок {} и []",
        (_, lesson) => {
            expect(lesson.initialYaml).not.toMatch(/:\s*(\{\}|\[\])\s*$/m);
        }
    );
});
