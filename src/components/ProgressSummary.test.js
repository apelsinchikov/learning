import { describe, expect, it } from "vitest";

import { ProgressSummary } from "./ProgressSummary.js";
import { Header } from "./Header.js";
import { Sidebar } from "./Sidebar.js";
import { course } from "../data/course.js";
import {
    createEmptyProgress,
    markRead,
    markSolved
} from "../progress/progressModel.js";

const firstTheory = course.find(lesson => lesson.type === "theory");
const firstPractice = course.find(lesson => lesson.type === "practice");

describe("прогресс в шапке", () => {
    it("без прогресса показывает 0 / N", () => {
        const html = ProgressSummary(createEmptyProgress());

        expect(html).toContain(`0 / ${course.length}`);
        expect(html).toContain("header__progress");
    });

    it("считает прочитанные теории и пройденные практики", () => {
        let progress = markRead(createEmptyProgress(), firstTheory.id);
        progress = markSolved(progress, firstPractice.id);

        expect(ProgressSummary(progress)).toContain(`2 / ${course.length}`);
    });

    it("id несуществующих уроков не увеличивают счётчик", () => {
        const progress = markSolved(createEmptyProgress(), "deleted-lesson");

        expect(ProgressSummary(progress)).toContain(`0 / ${course.length}`);
    });

    it("ширина полосы равна проценту пройденного", () => {
        const progress = markRead(createEmptyProgress(), firstTheory.id);
        const percent = Math.round((1 / course.length) * 100);

        expect(ProgressSummary(progress)).toContain(`width: ${percent}%`);
    });

    it("шапка содержит прогресс, а сайдбар его больше не показывает", () => {
        const progress = markRead(createEmptyProgress(), firstTheory.id);

        expect(Header({ progress })).toContain(`1 / ${course.length}`);
        expect(Sidebar(0, progress)).not.toContain("progress-bar");
        expect(Sidebar(0, progress)).not.toContain(`1 / ${course.length}`);
    });
});
