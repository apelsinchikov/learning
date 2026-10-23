import { describe, expect, it } from "vitest";

import { CHAPTERS, findSqlLesson, lessonNumber, sqlLessons } from "./index.js";
import { TABLES } from "../hotel/schema.js";

const BLOCK_TYPES = new Set([
    "text",
    "why",
    "trap",
    "example",
    "table-peek",
    "fk-explorer",
    "join-visual",
    "order-steps"
]);

const JOIN_KINDS = new Set(["cross", "inner", "left", "right", "full"]);

describe("структура курса SQL", () => {
    it("28 уроков в 7 главах", () => {
        expect(CHAPTERS.length).toBe(7);
        expect(sqlLessons.length).toBe(28);
    });

    it("идентификаторы уникальны и начинаются с sql-", () => {
        const ids = sqlLessons.map(lesson => lesson.id);

        expect(new Set(ids).size).toBe(ids.length);
        expect(ids.every(id => id.startsWith("sql-"))).toBe(true);
    });

    it("findSqlLesson и lessonNumber согласованы", () => {
        expect(findSqlLesson("sql-read-db").chapter).toBe(1);
        expect(findSqlLesson("нет")).toBeNull();
        expect(lessonNumber("sql-read-db")).toBe(1);
        expect(lessonNumber("sql-final")).toBe(28);
        expect(lessonNumber("нет")).toBeNull();
    });

    it("у каждого урока есть название, сцена, теория, задача, шпаргалка", () => {
        for (const lesson of sqlLessons) {
            expect(lesson.title).toBeTruthy();
            expect(lesson.summary).toBeTruthy();
            expect(lesson.story.trim().length).toBeGreaterThan(20);
            expect(lesson.theory.length).toBeGreaterThan(0);
            expect(lesson.cheat.length).toBeGreaterThan(0);
            expect(lesson.task.prompt).toBeTruthy();
        }
    });

    it("в теории только известные типы блоков, примеры содержат запрос", () => {
        for (const lesson of sqlLessons) {
            for (const block of lesson.theory) {
                expect(BLOCK_TYPES.has(block.type)).toBe(true);

                if (block.type === "example") {
                    expect(block.sql.trim().length).toBeGreaterThan(5);
                }

                if (block.type === "join-visual") {
                    expect(JOIN_KINDS.has(block.kind)).toBe(true);
                }

                if (block.type === "table-peek") {
                    expect(TABLES.some(table => table.name === block.table)).toBe(true);
                }
            }
        }
    });

    it("каждый урок объясняет, зачем нужна конструкция", () => {
        for (const lesson of sqlLessons) {
            const hasWhy = lesson.theory.some(block => block.type === "why");

            expect(hasWhy).toBe(true);
        }
    });

    it("в уроках нет INSERT, UPDATE и DELETE", () => {
        const forbidden = /\b(insert|update|delete|drop|alter|create)\b/i;

        for (const lesson of sqlLessons) {
            const queries = [
                lesson.task.solution,
                lesson.task.starter,
                ...lesson.theory.filter(block => block.type === "example").map(block => block.sql)
            ].filter(Boolean);

            for (const sql of queries) {
                expect(forbidden.test(sql)).toBe(false);
            }
        }
    });
});

describe("задачи", () => {
    const queryTasks = sqlLessons.filter(lesson => lesson.task.kind !== "choice");
    const choiceTasks = sqlLessons.filter(lesson => lesson.task.kind === "choice");

    it("у запросных задач есть решение, подсказки, число строк и колонок", () => {
        for (const { task } of queryTasks) {
            expect(task.solution.trim()).toBeTruthy();
            expect(task.hints.length).toBe(3);
            expect(task.expectRows).toBeGreaterThan(0);
            expect(task.expectCols).toBeGreaterThan(0);
        }
    });

    it("третья подсказка запросной задачи не пуста и не длиннее решения втрое", () => {
        for (const { task } of queryTasks) {
            expect(task.hints[2].length).toBeGreaterThan(5);
        }
    });

    it("у «сломанных» задач стартовый запрос не совпадает с решением", () => {
        for (const { task } of sqlLessons.filter(lesson => lesson.task.kind === "fix")) {
            expect(task.starter.replace(/\s+/g, " ")).not.toBe(task.solution.replace(/\s+/g, " "));
        }
    });

    it("у задач с выбором есть варианты и верный ответ внутри диапазона", () => {
        expect(choiceTasks.length).toBeGreaterThan(0);

        for (const { task } of choiceTasks) {
            expect(task.options.length).toBeGreaterThanOrEqual(3);
            expect(task.correct).toBeGreaterThanOrEqual(0);
            expect(task.correct).toBeLessThan(task.options.length);
            expect(task.explain).toBeTruthy();
        }
    });

    it("у каждой задачи есть улика для блокнота", () => {
        for (const { task } of sqlLessons) {
            expect(task.clue.title).toBeTruthy();
            expect(task.clue.text).toBeTruthy();
        }
    });

    it("в финале один верный подозреваемый", () => {
        const verdict = findSqlLesson("sql-final").task.verdict;
        const correct = verdict.suspects.filter(suspect => suspect.correct);

        expect(correct.length).toBe(1);
        expect(correct[0].name).toBe("Тимур Назаров");
    });
});
