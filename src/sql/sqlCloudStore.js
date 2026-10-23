import { createCourseCloudStore } from "../courses/courseCloudStore.js";

export const SQL_COURSE_ID = "sql";
export const SQL_LESSON_PREFIX = "sql-";

/* Облачное хранилище прогресса курса SQL (подробности — в courseCloudStore.js). */
export function createSqlCloudStore(client) {
    return createCourseCloudStore(client, { courseId: SQL_COURSE_ID, prefix: SQL_LESSON_PREFIX });
}
