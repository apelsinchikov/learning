import { describe, expect, it } from "vitest";

import { createCourseCloudStore } from "./courseCloudStore.js";
import { createSqlCloudStore } from "../sql/sqlCloudStore.js";
import { createCloudStore } from "../progress/cloudStore.js";
import { createEmptyProgress, markSolved, setCurrentLesson } from "../progress/progressModel.js";

const AT = "2026-02-01T10:00:00.000Z";

function fakeClient({ lessonRows = [], stateRows = [] } = {}) {
    const upserts = [];
    const tables = { lesson_progress: lessonRows, course_state: stateRows, user_state: [] };

    return {
        upserts,
        from: table => ({
            select: () => ({ eq: async () => ({ data: tables[table], error: null }) }),
            upsert: async (rows, options) => {
                upserts.push({ table, rows, options });
                return { error: null };
            }
        })
    };
}

const row = (lesson_id, solved = true) => ({ lesson_id, read: true, solved, draft_yaml: null, draft_updated_at: null });

describe("три курса в одной таблице", () => {
    const rows = [row("lesson-1"), row("sql-where"), row("dg-er-keys")];
    const stateRows = [
        { course_id: "sql", current_lesson: "sql-where", updated_at: AT },
        { course_id: "diagrams", current_lesson: "dg-er-keys", updated_at: AT }
    ];

    it("курс «Диаграммы» берёт только dg- и свою строку course_state", async () => {
        const store = createCourseCloudStore(fakeClient({ lessonRows: rows, stateRows }), {
            courseId: "diagrams",
            prefix: "dg-"
        });
        const progress = await store.load("u1");

        expect(Object.keys(progress.lessons)).toEqual(["dg-er-keys"]);
        expect(progress.currentLesson).toEqual({ id: "dg-er-keys", updatedAt: AT });
    });

    it("SQL не видит dg-, OpenAPI не видит ни sql-, ни dg-", async () => {
        const client = fakeClient({ lessonRows: rows, stateRows });

        expect(Object.keys((await createSqlCloudStore(client).load("u1")).lessons)).toEqual(["sql-where"]);
        expect(Object.keys((await createCloudStore(client).load("u1")).lessons)).toEqual(["lesson-1"]);
    });

    it("сохранение: чужие уроки не отправляются, course_id = diagrams", async () => {
        const client = fakeClient();
        let progress = createEmptyProgress();
        progress = markSolved(progress, "dg-er-keys");
        progress = markSolved(progress, "sql-where");
        progress = setCurrentLesson(progress, "dg-er-keys", AT);

        await createCourseCloudStore(client, { courseId: "diagrams", prefix: "dg-" }).save("u1", progress, {
            lessonIds: ["dg-er-keys", "sql-where"],
            currentLesson: true
        });

        expect(client.upserts.find(item => item.table === "lesson_progress").rows.map(r => r.lesson_id)).toEqual([
            "dg-er-keys"
        ]);
        expect(client.upserts.find(item => item.table === "course_state").rows.course_id).toBe("diagrams");
    });
});
