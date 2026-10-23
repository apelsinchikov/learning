import { describe, expect, it } from "vitest";

import { Sidebar } from "./Sidebar.js";
import { course } from "../data/course.js";
import { COURSE_SECTIONS } from "../data/courseSections.js";
import {
    createEmptyProgress,
    markRead,
    markSolved
} from "../progress/progressModel.js";

const count = (html, text) => html.split(text).length - 1;

const firstTheory = course.find(lesson => lesson.type === "theory");
const firstPractice = course.find(lesson => lesson.type === "practice");

describe("блоки курса", () => {
    it("каждый урок входит в блоки ровно один раз и в порядке курса", () => {
        const ids = COURSE_SECTIONS.flatMap(section => section.lessons);

        expect(ids).toEqual(course.map(lesson => lesson.id));
    });
});

describe("сайдбар: вид", () => {
    it("показывает заголовки блоков и все уроки с номерами", () => {
        const html = Sidebar(0);

        expect(count(html, "<h3>")).toBe(COURSE_SECTIONS.length);
        expect(html).toContain("Блок 1. Знакомство");
        expect(count(html, "data-lesson-index=")).toBe(course.length);
        expect(html).toContain(`>${course.length}</span>`);
    });

    it("подсвечивает только текущий урок", () => {
        const html = Sidebar(3);

        expect(count(html, "lesson--active")).toBe(1);
        expect(count(html, `aria-current="page"`)).toBe(1);
        expect(html).toContain(`data-lesson-index="3"`);
    });
});

describe("сайдбар: прогресс", () => {
    it("без прогресса нет отметок", () => {
        const html = Sidebar(0);

        expect(count(html, "lesson--done")).toBe(0);
        expect(count(html, "lesson--read")).toBe(0);
        expect(count(html, "✓")).toBe(0);
    });

    it("прочитанная теория светлая, решённая практика зелёная, вместо номера галочка", () => {
        let progress = markRead(createEmptyProgress(), firstTheory.id);
        progress = markSolved(progress, firstPractice.id);

        const html = Sidebar(0, progress);

        expect(count(html, "lesson--read")).toBe(1);
        expect(count(html, "lesson--done")).toBe(1);
        expect(count(html, "✓")).toBe(2);
    });

    it("прочитанная практика без проверки не считается пройденной", () => {
        const progress = markRead(createEmptyProgress(), firstPractice.id);
        const html = Sidebar(0, progress);

        expect(count(html, "lesson--done")).toBe(0);
        expect(count(html, "lesson--read")).toBe(0);
    });
});
