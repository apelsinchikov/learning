/*
 * Курс «SQL Advanced»: «Сезон в „Перевале“».
 *
 * Формат урока:
 *   id       — уникальный, всегда начинается с «sqa-» (так уроки курса не смешиваются
 *              с уроками других курсов в облаке)
 *   title    — название; summary — одна строка для боковой панели
 *   story    — рабочая ситуация (абзацы через пустую строку)
 *   before   — SQL-скрипт стартового состояния базы (необязательно). Выполняется внутри
 *              каждого запуска перед запросом ученика и откатывается вместе с ним
 *   refs     — «Повторить»: [[курс, id урока, подпись], ...]
 *   theory   — блоки: text, why, trap, example { sql, note? }, code { text, note? }
 *   task     — задача (см. ниже)
 *   cheat    — пары [конструкция, смысл] для шпаргалки
 *
 * В тексте: [[table:bookings]] — кнопка таблицы, [[sql:id|подпись]] — «Повторить».
 *
 * Задача (task.kind):
 *   "query"  — запрос, результат сравнивается с эталоном: prompt, starter, solution,
 *              ordered?, names?, expectRows?, hints[3]
 *   "script" — ученик пишет DDL/вставки; probes — проверочные запросы после его запроса,
 *              verify(run) → { ok, issues[] } по ответам probes и схеме
 *   "plan"   — как script, но проверяется план запроса (индекс)
 *   "quiz"   — вопросы с вариантами: questions[{ prompt, options, correct, explain }]
 *   afterwards — разбор после верного ответа (необязательно)
 */

import { chapter1 } from "./ch1.js";
import { chapter2 } from "./ch2.js";
import { chapter3 } from "./ch3.js";

export const CHAPTERS = [
    { id: 1, title: "Сложные запросы", subtitle: "Читать схему и писать шагами", lessons: chapter1 },
    { id: 2, title: "Отчёты и параметры метода", subtitle: "Пустые значения, даты, фильтры, страницы", lessons: chapter2 },
    { id: 3, title: "Таблицы, представления и ключи", subtitle: "Создаём структуры и защищаем данные", lessons: chapter3 }
];

export const sqaLessons = CHAPTERS.flatMap(chapter => chapter.lessons.map(lesson => ({ ...lesson, chapter: chapter.id })));

export const findSqaLesson = id => sqaLessons.find(lesson => lesson.id === id) || null;

export function lessonNumber(id) {
    const index = sqaLessons.findIndex(lesson => lesson.id === id);

    return index === -1 ? null : index + 1;
}
