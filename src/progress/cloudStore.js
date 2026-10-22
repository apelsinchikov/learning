import { createEmptyProgress } from "./progressModel.js";

function check({ error }) {
    if (error) {
        throw new Error(error.message || "Supabase error");
    }
}

/*
 * Облачное хранилище прогресса поверх Supabase.
 * client — объект supabase-js (или его поддельная копия в тестах).
 */
export function createCloudStore(client) {
    return {
        async load(userId) {
            const lessonResult = await client
                .from("lesson_progress")
                .select("*")
                .eq("user_id", userId);
            check(lessonResult);

            const stateResult = await client
                .from("user_state")
                .select("*")
                .eq("user_id", userId);
            check(stateResult);

            const progress = createEmptyProgress();

            for (const row of lessonResult.data || []) {
                /* Уроки курса SQL (sql-...) хранятся в той же таблице, но это другой курс. */
                if (String(row.lesson_id).startsWith("sql-")) {
                    continue;
                }

                progress.lessons[row.lesson_id] = {
                    read: Boolean(row.read),
                    solved: Boolean(row.solved),
                    draft: row.draft_yaml ?? null,
                    draftUpdatedAt: row.draft_updated_at ?? null
                };
            }

            const state = (stateResult.data || [])[0];

            if (state && state.current_lesson) {
                progress.currentLesson = {
                    id: state.current_lesson,
                    updatedAt: state.updated_at
                };
            }

            return progress;
        },

        async save(userId, progress, changed) {
            const lessonIds = changed
                ? changed.lessonIds
                : Object.keys(progress.lessons);
            const saveCurrent = changed ? changed.currentLesson : true;

            const rows = lessonIds
                .filter(id => progress.lessons[id])
                .map(id => {
                    const entry = progress.lessons[id];

                    return {
                        user_id: userId,
                        lesson_id: id,
                        read: entry.read,
                        solved: entry.solved,
                        draft_yaml: entry.draft,
                        draft_updated_at: entry.draftUpdatedAt,
                        updated_at: new Date().toISOString()
                    };
                });

            if (rows.length > 0) {
                check(
                    await client
                        .from("lesson_progress")
                        .upsert(rows, { onConflict: "user_id,lesson_id" })
                );
            }

            if (saveCurrent && progress.currentLesson) {
                check(
                    await client.from("user_state").upsert(
                        {
                            user_id: userId,
                            current_lesson: progress.currentLesson.id,
                            updated_at: progress.currentLesson.updatedAt
                        },
                        { onConflict: "user_id" }
                    )
                );
            }
        }
    };
}
