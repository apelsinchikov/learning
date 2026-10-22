import { createLocalStore } from "../progress/localStore.js";
import { createProgressService } from "../progress/progressService.js";
import { createSqlCloudStore } from "./sqlCloudStore.js";

export const SQL_PROGRESS_KEY = "sql-course-progress-v1";

/*
 * Прогресс курса SQL: тот же механизм, что у OpenAPI (сначала локально,
 * потом в облако, слияние при входе), но другой ключ в браузере
 * и другие уроки в облаке. Прогресс двух курсов не смешивается.
 */
export function createSqlProgress({ storage, supabaseClient = null, ...options } = {}) {
    const cloudStore = supabaseClient
        ? createSqlCloudStore(supabaseClient)
        : {
              load: async () => ({ currentLesson: null, lessons: {} }),
              save: async () => {}
          };

    return createProgressService({
        localStore: createLocalStore(storage, SQL_PROGRESS_KEY),
        cloudStore,
        ...options
    });
}
