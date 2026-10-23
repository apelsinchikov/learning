import { createEmptyProgress } from "../progress/progressModel.js";

function check({ error }) {
    if (error) {
        throw new Error(error.message || "Supabase error");
    }
}

/*
 * Облачное хранилище прогресса одного курса, который живёт рядом с OpenAPI
 * (SQL, «Диаграммы»).
 *
 * Уроки лежат в той же таблице lesson_progress, что и у OpenAPI, но с
 * идентификаторами с префиксом курса (sql-..., dg-...): курсы не пересекаются.
 * Колонка draft_yaml хранит черновик ученика (название осталось от первого курса).
 * «Текущий урок» хранится в course_state — по строке на курс.
 */
export function createCourseCloudStore(client, { courseId, prefix }) {
    const isOwnLesson = id => String(id).startsWith(prefix);

    return {
        async load(userId) {
            const lessonResult = await client
                .from("lesson_progress")
                .select("*")
                .eq("user_id", userId);
            check(lessonResult);

            const stateResult = await client
                .from("course_state")
                .select("*")
                .eq("user_id", userId);
            check(stateResult);

            const progress = createEmptyProgress();

            for (const row of lessonResult.data || []) {
                if (!isOwnLesson(row.lesson_id)) {
                    continue;
                }

                progress.lessons[row.lesson_id] = {
                    read: Boolean(row.read),
                    solved: Boolean(row.solved),
                    draft: row.draft_yaml ?? null,
                    draftUpdatedAt: row.draft_updated_at ?? null
                };
            }

            const state = (stateResult.data || []).find(row => row.course_id === courseId);

            if (state && state.current_lesson) {
                progress.currentLesson = {
                    id: state.current_lesson,
                    updatedAt: state.updated_at
                };
            }

            return progress;
        },

        async save(userId, progress, changed) {
            const lessonIds = (changed ? changed.lessonIds : Object.keys(progress.lessons))
                .filter(id => isOwnLesson(id) && progress.lessons[id]);
            const saveCurrent = changed ? changed.currentLesson : true;

            const rows = lessonIds.map(id => {
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
                    await client.from("course_state").upsert(
                        {
                            user_id: userId,
                            course_id: courseId,
                            current_lesson: progress.currentLesson.id,
                            updated_at: progress.currentLesson.updatedAt
                        },
                        { onConflict: "user_id,course_id" }
                    )
                );
            }
        }
    };
}
