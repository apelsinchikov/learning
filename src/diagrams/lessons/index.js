/*
 * Курс «Диаграммы: проект отеля „Перевал“».
 *
 * Формат урока:
 *   id       — уникальный, всегда начинается с «dg-» (это важно для облака:
 *              так уроки не смешиваются с уроками OpenAPI и SQL)
 *   title    — название
 *   summary  — одна строка для боковой панели
 *   story    — сюжетная сцена (абзацы через пустую строку)
 *   theory   — блоки теории (типы ниже)
 *   task     — задача
 *   cheat    — пары [запись, смысл] для шпаргалки
 *
 * Типы блоков theory:
 *   text, why, trap — текст; why = «зачем», trap = «ловушка»
 *   diagram         — готовая диаграмма с картинкой: { kind: "er" | "sequence", code, caption? }
 *   tryit           — диаграмма, которую можно править прямо в теории: { kind, code }
 *   code            — кусок кода без картинки: { lang, code, caption? }
 *   split           — два куска кода рядом: { left, right } (каждый — { title, lang, code })
 *   compare         — таблица: { head[], rows[][], caption? }
 *   steps           — нумерованный маршрут: { title?, items: [{ title, text }] }
 *   chen            — рисунок нотации Чена
 *
 * Задача (kind):
 *   "diagram" | "fix" — ученик пишет или исправляет диаграмму на Mermaid:
 *       diagram — "er" | "sequence", prompt, starter, solution, hints[3],
 *       check?  — настройки сравнения (exact, types, identifying, named, notes, activations),
 *       afterwards?
 *   "quiz" — вопросы: prompt, questions[], afterwards?
 *       вопрос { type: "choice", text, options[], correct, explain }
 *       вопрос { type: "order", text, items[] (в правильном порядке), shuffle[] (начальная расстановка), explain }
 */

import { chapter1 } from "./ch1.js";
import { chapter2 } from "./ch2.js";
import { chapter3 } from "./ch3.js";
import { chapter4 } from "./ch4.js";
import { chapter5 } from "./ch5.js";

export const CHAPTERS = [
    { id: 1, title: "Как описывают диаграммы", subtitle: "Редакторы, таблицы, код", lessons: chapter1 },
    { id: 2, title: "ER: данные отеля", subtitle: "Сущности, связи, ключи", lessons: chapter2 },
    { id: 3, title: "Sequence: кто кого просит", subtitle: "Сообщения, ветки, метод изнутри", lessons: chapter3 },
    { id: 4, title: "От диаграммы к системе", subtitle: "Таблицы и методы API", lessons: chapter4 },
    { id: 5, title: "Проект целиком", subtitle: "PlantUML и итоговые случаи", lessons: chapter5 }
];

export const diagramLessons = CHAPTERS.flatMap(chapter =>
    chapter.lessons.map(lesson => ({ ...lesson, chapter: chapter.id }))
);

export function findDiagramLesson(id) {
    return diagramLessons.find(lesson => lesson.id === id) || null;
}

export function lessonNumber(id) {
    const index = diagramLessons.findIndex(lesson => lesson.id === id);

    return index === -1 ? null : index + 1;
}

/* Урок, в котором ученик сам пишет диаграмму (она попадает в «Папку проекта»). */
export const isDiagramTask = lesson => lesson.task.kind === "diagram" || lesson.task.kind === "fix";
