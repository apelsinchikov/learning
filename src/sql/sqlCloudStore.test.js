import { describe, expect, it } from "vitest";

import { createSqlCloudStore } from "./sqlCloudStore.js";
import { createCloudStore } from "../progress/cloudStore.js";
import { createEmptyProgress, markSolved, saveDraft, setCurrentLesson } from "../progress/progressModel.js";

const AT = "2026-02-01T10:00:00.000Z";

function fakeClient({ lessonRows = [], stateRows = [], error = null } = {}) {
    const upserts = [];
    const tables = { lesson_progress: lessonRows, course_state: stateRows, user_state: [] };

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

describe("sqlCloudStore.load", () => {
    it("берёт только уроки sql- и состояние курса sql", async () => {
        const client = fakeClient({
            lessonRows: [
                { lesson_id: "sql-select", read: true, solved: true, draft_yaml: "select 1", draft_updated_at: AT },
                { lesson_id: "lesson-19", read: true, solved: false, draft_yaml: null, draft_updated_at: null }
            ],
            stateRows: [
                { course_id: "other", current_lesson: "x", updated_at: AT },
                { course_id: "sql", current_lesson: "sql-where", updated_at: AT }
            ]
        });

        const progress = await createSqlCloudStore(client).load("u1");

        expect(Object.keys(progress.lessons)).toEqual(["sql-select"]);
        expect(progress.lessons["sql-select"]).toEqual({
            read: true,
            solved: true,
            draft: "select 1",
            draftUpdatedAt: AT
        });
        expect(progress.currentLesson).toEqual({ id: "sql-where", updatedAt: AT });
    });

    it("пустое облако — пустой прогресс", async () => {
        const progress = await createSqlCloudStore(fakeClient()).load("u1");

        expect(progress).toEqual(createEmptyProgress());
    });

    it("ошибка Supabase превращается в исключение", async () => {
        const client = fakeClient({ error: { message: "нет связи" } });

        await expect(createSqlCloudStore(client).load("u1")).rejects.toThrow("нет связи");
    });
});

describe("sqlCloudStore.save", () => {
    it("отправляет только изменённые уроки sql- и состояние курса", async () => {
        const client = fakeClient();
        let progress = createEmptyProgress();
        progress = markSolved(progress, "sql-select");
        progress = saveDraft(progress, "sql-select", "select * from guests", AT);
        progress = markSolved(progress, "lesson-1");
        progress = setCurrentLesson(progress, "sql-select", AT);

        await createSqlCloudStore(client).save("u1", progress, {
            lessonIds: ["sql-select", "lesson-1"],
            currentLesson: true
        });

        const lessonUpsert = client.upserts.find(item => item.table === "lesson_progress");
        const stateUpsert = client.upserts.find(item => item.table === "course_state");

        expect(lessonUpsert.rows.map(row => row.lesson_id)).toEqual(["sql-select"]);
        expect(lessonUpsert.rows[0].draft_yaml).toBe("select * from guests");
        expect(lessonUpsert.options).toEqual({ onConflict: "user_id,lesson_id" });
        expect(stateUpsert.rows).toEqual({
            user_id: "u1",
            course_id: "sql",
            current_lesson: "sql-select",
            updated_at: AT
        });
        expect(stateUpsert.options).toEqual({ onConflict: "user_id,course_id" });
    });

    it("без изменений ничего не отправляет", async () => {
        const client = fakeClient();

        await createSqlCloudStore(client).save("u1", createEmptyProgress(), {
            lessonIds: [],
            currentLesson: false
        });

        expect(client.upserts).toEqual([]);
    });

    it("ошибка записи пробрасывается", async () => {
        const client = fakeClient({ error: { message: "RLS" } });
        const progress = markSolved(createEmptyProgress(), "sql-a");

        await expect(
            createSqlCloudStore(client).save("u1", progress, { lessonIds: ["sql-a"], currentLesson: false })
        ).rejects.toThrow("RLS");
    });
});

describe("два курса не мешают друг другу", () => {
    it("OpenAPI не видит уроки sql-", async () => {
        const client = fakeClient({
            lessonRows: [
                { lesson_id: "sql-select", read: true, solved: true, draft_yaml: null, draft_updated_at: null },
                { lesson_id: "lesson-1", read: true, solved: false, draft_yaml: null, draft_updated_at: null }
            ]
        });

        const progress = await createCloudStore(client).load("u1");

        expect(Object.keys(progress.lessons)).toEqual(["lesson-1"]);
    });
});
