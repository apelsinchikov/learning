import { normalizeLesson } from "./content.js";

/*
 * Откуда берём уроки для «Повторить». Курсы грузятся лениво: код курса, чей урок
 * нужен, подключается только по первой ссылке на него.
 * Для каждого курса: подпись, адрес урока и загрузчик нормализованного урока.
 */
export const PEEK_SOURCES = {
    sql: {
        label: "SQL",
        hash: id => `#/sql/${encodeURIComponent(id)}`,
        async load(id) {
            const { findSqlLesson, CHAPTERS, lessonNumber } = await import("../sql/lessons/index.js");
            const lesson = findSqlLesson(id);

            if (!lesson) {
                return null;
            }

            return normalizeLesson({
                course: "sql",
                courseLabel: "SQL",
                lesson,
                chapter: CHAPTERS.find(item => item.id === lesson.chapter),
                number: lessonNumber(id)
            });
        }
    },
    diagrams: {
        label: "Диаграммы",
        hash: id => `#/diagrams/${encodeURIComponent(id)}`,
        async load(id) {
            const { findDiagramLesson, CHAPTERS, lessonNumber } = await import("../diagrams/lessons/index.js");
            const lesson = findDiagramLesson(id);

            if (!lesson) {
                return null;
            }

            return normalizeLesson({
                course: "diagrams",
                courseLabel: "Диаграммы",
                lesson,
                chapter: CHAPTERS.find(item => item.id === lesson.chapter),
                number: lessonNumber(id)
            });
        }
    }
};
