import { describe, expect, it, vi } from "vitest";

import { createCloudStore } from "./cloudStore.js";
import {
    createEmptyProgress,
    markRead,
    saveDraft,
    setCurrentLesson
} from "./progressModel.js";

const AT = "2026-01-01T10:00:00.000Z";

/* Поддельный клиент повторяет форму supabase-js: from().select().eq(), from().upsert(). */
function fakeClient({ lessonRows = [], stateRows = [], error = null } = {}) {
    const upserts = [];
    const tables = { lesson_progress: lessonRows, user_state: stateRows };

    return {
        upserts,
        from: table => ({
            select: () => ({
                eq: async () => ({ data: tables[table], error })
            }),
            upsert: async (rows, options) => {
                upserts.push({ table, rows, options });
                return { error };
            }
        })
    };
}

describe("cloudStore.load", () => {
    it("собирает прогресс из строк обеих таблиц", async () => {
        const client = fakeClient({
            lessonRows: [
                {
                    lesson_id: "t1",
                    read: true,
                    solved: false,
                    draft_yaml: null,
                    draft_updated_at: null
                },
                {
                    lesson_id: "p1",
                    read: false,
                    solved: true,
                    draft_yaml: "openapi: 3.0.3",
                    draft_updated_at: AT
                }
            ],
            stateRows: [{ current_lesson: "p1", updated_at: AT }]
        });

        const progress = await createCloudStore(client).load("u1");

        expect(progress.lessons.t1.read).toBe(true);
        expect(progress.lessons.p1).toEqual({
            read: false,
            solved: true,
            draft: "openapi: 3.0.3",
            draftUpdatedAt: AT
        });
        expect(progress.currentLesson).toEqual({ id: "p1", updatedAt: AT });
    });

    it("пустые таблицы дают пустой прогресс", async () => {
        const progress = await createCloudStore(fakeClient()).load("u1");

        expect(progress).toEqual(createEmptyProgress());
    });

    it("ошибка Supabase превращается в исключение", async () => {
        const client = fakeClient({ error: { message: "boom" } });

        await expect(createCloudStore(client).load("u1")).rejects.toThrow("boom");
    });
});

describe("cloudStore.save", () => {
    it("записывает только изменённые уроки в формате таблицы", async () => {
        const client = fakeClient();
        let progress = markRead(createEmptyProgress(), "t1");
        progress = saveDraft(progress, "p1", "yaml text", AT);
        progress = markRead(progress, "untouched");

        await createCloudStore(client).save("u1", progress, {
            lessonIds: ["t1", "p1"],
            currentLesson: false
        });

        expect(client.upserts).toHaveLength(1);
        const [{ table, rows, options }] = client.upserts;
        expect(table).toBe("lesson_progress");
        expect(options).toEqual({ onConflict: "user_id,lesson_id" });
        expect(rows).toHaveLength(2);
        expect(rows.find(row => row.lesson_id === "p1")).toMatchObject({
            user_id: "u1",
            lesson_id: "p1",
            read: false,
            solved: false,
            draft_yaml: "yaml text",
            draft_updated_at: AT
        });
    });

    it("текущий урок пишется в user_state", async () => {
        const client = fakeClient();
        const progress = setCurrentLesson(createEmptyProgress(), "p2", AT);

        await createCloudStore(client).save("u1", progress, {
            lessonIds: [],
            currentLesson: true
        });

        expect(client.upserts).toHaveLength(1);
        expect(client.upserts[0].table).toBe("user_state");
        expect(client.upserts[0].options).toEqual({ onConflict: "user_id" });
        expect(client.upserts[0].rows).toMatchObject({
            user_id: "u1",
            current_lesson: "p2",
            updated_at: AT
        });
    });

    it("без changed записывает всё", async () => {
        const client = fakeClient();
        let progress = markRead(createEmptyProgress(), "t1");
        progress = setCurrentLesson(progress, "t1", AT);

        await createCloudStore(client).save("u1", progress);

        expect(client.upserts.map(item => item.table).sort()).toEqual([
            "lesson_progress",
            "user_state"
        ]);
    });

    it("если менять нечего, запросов нет", async () => {
        const client = fakeClient();

        await createCloudStore(client).save("u1", createEmptyProgress(), {
            lessonIds: [],
            currentLesson: false
        });

        expect(client.upserts).toHaveLength(0);
    });

    it("ошибка Supabase при записи превращается в исключение", async () => {
        const client = fakeClient({ error: { message: "denied" } });
        const progress = markRead(createEmptyProgress(), "t1");

        await expect(
            createCloudStore(client).save("u1", progress, {
                lessonIds: ["t1"],
                currentLesson: false
            })
        ).rejects.toThrow("denied");
    });
});
