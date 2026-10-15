import { describe, expect, it } from "vitest";

import { Sidebar } from "./Sidebar.js";
import { course } from "../data/course.js";
import {
    createEmptyProgress,
    markRead,
    markSolved
} from "../progress/progressModel.js";

const count = (html, text) => html.split(text).length - 1;

const firstTheory = course.find(lesson => lesson.type === "theory");
const firstPractice = course.find(lesson => lesson.type === "practice");

describe("сайдбар: прогресс", () => {
    it("без прогресса нет отметок и счётчик 0 / N", () => {
        const html = Sidebar(0);

        expect(count(html, "lesson--done")).toBe(0);
        expect(html).toContain(`0 / ${course.length}`);
    });

    it("отмечает прочитанную теорию и пройденную практику", () => {
        let progress = markRead(createEmptyProgress(), firstTheory.id);
        progress = markSolved(progress, firstPractice.id);

        const html = Sidebar(0, progress);

        expect(count(html, "lesson--done")).toBe(2);
        expect(count(html, "lesson__check")).toBe(2);
        expect(html).toContain(`2 / ${course.length}`);
    });

    it("прочитанная практика без проверки не считается пройденной", () => {
        const progress = markRead(createEmptyProgress(), firstPractice.id);

        expect(count(Sidebar(0, progress), "lesson--done")).toBe(0);
    });

    it("id несуществующих уроков не увеличивают счётчик", () => {
        const progress = markSolved(createEmptyProgress(), "deleted-lesson");

        expect(Sidebar(0, progress)).toContain(`0 / ${course.length}`);
    });

    it("ширина полосы равна проценту пройденного", () => {
        const progress = markRead(createEmptyProgress(), firstTheory.id);
        const percent = Math.round((1 / course.length) * 100);

        expect(Sidebar(0, progress)).toContain(`width: ${percent}%`);
    });
});
