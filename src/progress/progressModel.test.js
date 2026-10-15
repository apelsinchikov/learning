import { describe, expect, it } from "vitest";

import {
    countDone,
    createEmptyProgress,
    getDraft,
    isLessonDone,
    markRead,
    markSolved,
    mergeProgress,
    saveDraft,
    setCurrentLesson
} from "./progressModel.js";

const T1 = "2026-01-01T10:00:00.000Z";
const T2 = "2026-01-01T11:00:00.000Z";

describe("progressModel: отметки", () => {
    it("markRead отмечает урок прочитанным и не меняет исходный объект", () => {
        const before = createEmptyProgress();
        const after = markRead(before, "theory-1", T1);

        expect(after.lessons["theory-1"].read).toBe(true);
        expect(before.lessons["theory-1"]).toBeUndefined();
    });

    it("markSolved не снимается после saveDraft с другим текстом", () => {
        let p = markSolved(createEmptyProgress(), "practice-1", T1);
        p = saveDraft(p, "practice-1", "openapi: 3.0.3", T2);

        expect(p.lessons["practice-1"].solved).toBe(true);
        expect(getDraft(p, "practice-1")).toBe("openapi: 3.0.3");
        expect(p.lessons["practice-1"].draftUpdatedAt).toBe(T2);
    });

    it("setCurrentLesson запоминает урок и время", () => {
        const p = setCurrentLesson(createEmptyProgress(), "theory-3", T1);

        expect(p.currentLesson).toEqual({ id: "theory-3", updatedAt: T1 });
    });

    it("getDraft возвращает null, если черновика нет", () => {
        expect(getDraft(createEmptyProgress(), "x")).toBeNull();
    });
});

describe("progressModel: слияние", () => {
    it("read и solved объединяются через ИЛИ", () => {
        const a = markRead(createEmptyProgress(), "t", T1);
        const b = markSolved(createEmptyProgress(), "t", T1);
        const merged = mergeProgress(a, b);

        expect(merged.lessons.t.read).toBe(true);
        expect(merged.lessons.t.solved).toBe(true);
    });

    it("побеждает более свежий черновик независимо от порядка аргументов", () => {
        const older = saveDraft(createEmptyProgress(), "p", "old", T1);
        const newer = saveDraft(createEmptyProgress(), "p", "new", T2);

        expect(getDraft(mergeProgress(older, newer), "p")).toBe("new");
        expect(getDraft(mergeProgress(newer, older), "p")).toBe("new");
    });

    it("пустой черновик не затирает непустой", () => {
        const withDraft = saveDraft(createEmptyProgress(), "p", "text", T1);
        const without = markRead(createEmptyProgress(), "p", T2);

        expect(getDraft(mergeProgress(withDraft, without), "p")).toBe("text");
        expect(getDraft(mergeProgress(without, withDraft), "p")).toBe("text");
    });

    it("текущий урок берётся с более поздним updatedAt", () => {
        const a = setCurrentLesson(createEmptyProgress(), "a", T1);
        const b = setCurrentLesson(createEmptyProgress(), "b", T2);

        expect(mergeProgress(a, b).currentLesson.id).toBe("b");
        expect(mergeProgress(b, a).currentLesson.id).toBe("b");
    });

    it("слияние с пустым прогрессом возвращает тот же прогресс", () => {
        const p = saveDraft(markRead(createEmptyProgress(), "t", T1), "p", "x", T2);

        expect(mergeProgress(createEmptyProgress(), p)).toEqual(p);
        expect(mergeProgress(p, createEmptyProgress())).toEqual(p);
    });
});

describe("progressModel: подсчёт", () => {
    const course = [
        { id: "t1", type: "theory" },
        { id: "p1", type: "practice" },
        { id: "t2", type: "theory" }
    ];

    it("isLessonDone: теория — read, практика — solved", () => {
        const p = markRead(markRead(createEmptyProgress(), "t1", T1), "p1", T1);

        expect(isLessonDone(course[0], p)).toBe(true);
        expect(isLessonDone(course[1], p)).toBe(false);
    });

    it("countDone считает только существующие уроки", () => {
        let p = markRead(createEmptyProgress(), "t1", T1);
        p = markSolved(p, "p1", T1);
        p = markSolved(p, "deleted-lesson", T1);

        expect(countDone(course, p)).toBe(2);
    });
});
