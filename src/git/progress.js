import { createCourseCloudStore } from "../courses/courseCloudStore.js";
import { createLocalStore } from "../progress/localStore.js";
import { createProgressService } from "../progress/progressService.js";

export const GIT_PROGRESS_KEY = "git-progress-v1";
export const GIT_COURSE_ID = "git";
export const GIT_LESSON_PREFIX = "git-";

/* Прогресс курса «Git и проект»: тот же механизм, свой ключ и своя часть облака (префикс git-). */
export function createGitProgress({ storage, supabaseClient = null, ...options } = {}) {
    const cloudStore = supabaseClient
        ? createCourseCloudStore(supabaseClient, { courseId: GIT_COURSE_ID, prefix: GIT_LESSON_PREFIX })
        : {
              load: async () => ({ currentLesson: null, lessons: {} }),
              save: async () => {}
          };

    return createProgressService({
        localStore: createLocalStore(storage, GIT_PROGRESS_KEY),
        cloudStore,
        ...options
    });
}
