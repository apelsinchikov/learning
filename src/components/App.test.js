import { describe, expect, it } from "vitest";

import { App } from "./App.js";
import { course } from "../data/course.js";
import { createEmptyProgress, markRead } from "../progress/progressModel.js";

const count = (html, className) =>
    html.split(className).length - 1;

describe("кнопки навигации по урокам", () => {
    it("в середине курса есть кнопки сверху и снизу", () => {
        const html = App(3);

        expect(count(html, "lesson-navigation--top")).toBe(1);
        expect(count(html, "lesson-navigation--bottom")).toBe(1);
        expect(count(html, "nav-button--previous")).toBe(2);
        expect(count(html, "nav-button--next")).toBe(2);
    });

    it("на первом уроке нет кнопки «Предыдущий урок»", () => {
        const html = App(0);

        expect(count(html, "nav-button--previous")).toBe(0);
        expect(count(html, "nav-button--next")).toBe(2);
    });

    it("на последнем уроке нет кнопки «Следующий урок»", () => {
        const html = App(course.length - 1);

        expect(count(html, "nav-button--next")).toBe(0);
        expect(count(html, "nav-button--previous")).toBe(2);
    });

    it("верхняя панель стоит раньше содержимого урока", () => {
        const html = App(3);

        expect(html.indexOf("lesson-navigation--top")).toBeLessThan(
            html.indexOf('class="workspace"')
        );
    });
});


describe("прогресс в App", () => {
    it("App передаёт прогресс в сайдбар", () => {
        const first = course.find(lesson => lesson.type === "theory");
        const progress = markRead(createEmptyProgress(), first.id);

        expect(count(App(0, { progress }), "lesson--read")).toBe(1);
        expect(count(App(0), "lesson--read")).toBe(0);
    });
});
