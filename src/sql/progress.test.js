import { describe, expect, it } from "vitest";

import { createSqlProgress, SQL_PROGRESS_KEY } from "./progress.js";

function fakeStorage() {
    const data = new Map();

    return {
        getItem: key => (data.has(key) ? data.get(key) : null),
        setItem: (key, value) => data.set(key, String(value)),
        removeItem: key => data.delete(key),
        data
    };
}

describe("createSqlProgress", () => {
    it("пишет в свой ключ и не трогает ключ OpenAPI", () => {
        const storage = fakeStorage();
        const progress = createSqlProgress({ storage });

        progress.markSolved("sql-select");

        expect(storage.data.has(SQL_PROGRESS_KEY)).toBe(true);
        expect(storage.data.has("openapi-course-progress-v1")).toBe(false);
        expect(progress.getProgress().lessons["sql-select"].solved).toBe(true);
    });

    it("прогресс переживает перезагрузку", () => {
        const storage = fakeStorage();

        createSqlProgress({ storage }).markRead("sql-select");

        const again = createSqlProgress({ storage });

        expect(again.getProgress().lessons["sql-select"].read).toBe(true);
    });

    it("после входа отправляет прогресс в облако", async () => {
        const storage = fakeStorage();
        const upserts = [];
        const client = {
            from: table => ({
                select: () => ({ eq: async () => ({ data: [], error: null }) }),
                upsert: async (rows, options) => {
                    upserts.push({ table, rows, options });
                    return { error: null };
                }
            })
        };
        const progress = createSqlProgress({ storage, supabaseClient: client });

        progress.markSolved("sql-select");
        await progress.signedIn("user-1");

        const lessonUpsert = upserts.find(item => item.table === "lesson_progress");

        expect(lessonUpsert.rows[0]).toMatchObject({
            user_id: "user-1",
            lesson_id: "sql-select",
            solved: true
        });
    });

    it("работает без Supabase", async () => {
        const progress = createSqlProgress({ storage: fakeStorage() });

        progress.markRead("sql-a");

        await expect(progress.signedIn("u")).resolves.toBeUndefined();
    });
});
