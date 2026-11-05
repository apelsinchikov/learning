import { createCourseCloudStore } from "../courses/courseCloudStore.js";
import { createLocalStore } from "../progress/localStore.js";
import { createProgressService } from "../progress/progressService.js";

export const SQA_PROGRESS_KEY = "sql-advanced-progress-v1";
export const SQA_COURSE_ID = "sql-advanced";
export const SQA_LESSON_PREFIX = "sqa-";

/*
 * Прогресс курса SQL Advanced: тот же механизм, что у остальных курсов
 * (сначала локально, потом в облако, слияние при входе), но свой ключ
 * в браузере и свои уроки в облаке (префикс sqa-).
 */
export function createSqaProgress({ storage, supabaseClient = null, ...options } = {}) {
    const cloudStore = supabaseClient
        ? createCourseCloudStore(supabaseClient, { courseId: SQA_COURSE_ID, prefix: SQA_LESSON_PREFIX })
        : {
              load: async () => ({ currentLesson: null, lessons: {} }),
              save: async () => {}
          };

    return createProgressService({
        localStore: createLocalStore(storage, SQA_PROGRESS_KEY),
        cloudStore,
        ...options
    });
}
