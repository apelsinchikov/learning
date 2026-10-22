/*
 * Курс SQL: «Тайна отеля „Перевал“».
 *
 * Формат урока:
 *   id         — уникальный, всегда начинается с «sql-» (это важно для облака:
 *                так уроки SQL не смешиваются с уроками OpenAPI)
 *   title      — название
 *   summary    — одна строка для боковой панели
 *   story      — сюжетная сцена (абзацы через пустую строку)
 *   theory     — блоки теории (см. типы ниже)
 *   task       — задача
 *   cheat      — пары [конструкция, смысл] для шпаргалки
 *
 * Типы блоков theory:
 *   text, why, trap     — текст; why = «зачем», trap = «ловушка»
 *   example             — запрос, который можно запустить: { sql, note? }
 *   table-peek          — первые строки таблицы: { table, limit }
 *   fk-explorer         — интерактивная связь «внешний ключ → запись»
 *   join-visual         — { kind: cross | inner | left | right | full }
 *   order-steps         — порядок выполнения запроса
 *
 * Задача:
 *   kind      — "query" (по умолчанию) | "fix" (дан сломанный запрос) | "choice"
 *   prompt, starter, solution, hints[3], clue{title,text}, afterwards?
 *   ordered   — важен ли порядок строк
 *   names     — важны ли имена колонок
 *   expectRows/expectCols — для самопроверки курса (решение должно давать столько)
 *   options/correct/explain — для kind "choice"
 *   verdict   — только в финале: вердикт по подозреваемым
 */

import { chapter1 } from "./ch1.js";
import { chapter2 } from "./ch2.js";
import { chapter3 } from "./ch3.js";
import { chapter4 } from "./ch4.js";
import { chapter5 } from "./ch5.js";
import { chapter6 } from "./ch6.js";
import { chapter7 } from "./ch7.js";

export const CHAPTERS = [
    { id: 1, title: "Приезд", subtitle: "Знакомимся с архивом", lessons: chapter1 },
    { id: 2, title: "Круг сужается", subtitle: "Фильтры WHERE", lessons: chapter2 },
    { id: 3, title: "Хронология", subtitle: "Порядок и вычисления", lessons: chapter3 },
    { id: 4, title: "Закономерности", subtitle: "Сводки и группы", lessons: chapter4 },
    { id: 5, title: "Имена и поступки", subtitle: "Соединяем таблицы", lessons: chapter5 },
    { id: 6, title: "Кого не хватает", subtitle: "Виды JOIN", lessons: chapter6 },
    { id: 7, title: "Развязка", subtitle: "Всё вместе", lessons: chapter7 }
];

export const sqlLessons = CHAPTERS.flatMap(chapter =>
    chapter.lessons.map(lesson => ({ ...lesson, chapter: chapter.id }))
);

export function findSqlLesson(id) {
    return sqlLessons.find(lesson => lesson.id === id) || null;
}

export function lessonNumber(id) {
    const index = sqlLessons.findIndex(lesson => lesson.id === id);

    return index === -1 ? null : index + 1;
}
