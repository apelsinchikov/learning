import { createCourseCloudStore } from "../courses/courseCloudStore.js";
import { createLocalStore } from "../progress/localStore.js";
import { createProgressService } from "../progress/progressService.js";

export const DIAGRAMS_PROGRESS_KEY = "diagrams-course-progress-v1";
export const DIAGRAMS_COURSE_ID = "diagrams";
export const DIAGRAMS_LESSON_PREFIX = "dg-";

/*
 * Прогресс курса «Диаграммы»: тот же механизм, что у OpenAPI и SQL
 * (сначала локально, потом в облако, слияние при входе), но свой ключ в браузере
 * и свои уроки в облаке.
 */
export function createDiagramsProgress({ storage, supabaseClient = null, ...options } = {}) {
    const cloudStore = supabaseClient
        ? createCourseCloudStore(supabaseClient, { courseId: DIAGRAMS_COURSE_ID, prefix: DIAGRAMS_LESSON_PREFIX })
        : {
              load: async () => ({ currentLesson: null, lessons: {} }),
              save: async () => {}
          };

    return createProgressService({
        localStore: createLocalStore(storage, DIAGRAMS_PROGRESS_KEY),
        cloudStore,
        ...options
    });
}
