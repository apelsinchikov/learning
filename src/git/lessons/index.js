/*
 * Курс «Git и проект»: настоящий репозиторий от создания до первого pull request.
 *
 * Формат урока:
 *   id       — уникальный, всегда начинается с «git-» (так уроки курса не смешиваются
 *              с уроками других курсов в облаке)
 *   title    — название; summary — одна строка для боковой панели
 *   story    — рабочая ситуация (абзацы через пустую строку)
 *   theory   — блоки (см. ниже)
 *   task     — задание (см. ниже)
 *   cheat    — пары [команда, смысл] для шпаргалки (показываются после выполнения урока)
 *
 * В тексте: {{login}} {{repo}} {{name}} {{email}} — значения ученика из «Мой проект»,
 * [[key:mod+shift+p]] — сочетание клавиш (Mac и Windows).
 *
 * Блоки теории:
 *   text, why { title? }, trap { title? }, important { title? } — текст
 *   cmd { title?, lines[], output?, outputNote?, note? } — команды с кнопкой «Копировать».
 *       Строка с «#» в начале — комментарий. output — что ученик увидит в ответ
 *   web { title?, steps[], note? } — шаги в интерфейсе GitHub в браузере
 *   how { terminal[], vscode[] } — один и тот же шаг двумя способами; показывается выбранный
 *   os { mac[], windows[] } — разное для Mac и Windows
 *
 * Задание (task.kind):
 *   "steps" — items[{ text, field?, check? }]. field — поле профиля, которое нужно заполнить.
 *             check { prompt, patterns[{ re, hint }] } — ученик вставляет вывод команды,
 *             курс сверяет его. Шаг можно отметить и вручную. Урок решён, когда готовы все шаги
 *   "quiz"  — questions[{ prompt, options, correct, explain }]
 *   afterwards — разбор после выполнения (необязательно)
 */

import { chapter1 } from "./ch1.js";
import { chapter2 } from "./ch2.js";
import { chapter3 } from "./ch3.js";
import { chapter4 } from "./ch4.js";
import { chapter5 } from "./ch5.js";

export const CHAPTERS = [
    { id: 1, title: "Подготовка", subtitle: "Аккаунт, git и ваши данные", lessons: chapter1 },
    { id: 2, title: "Проект на GitHub", subtitle: "Репозиторий, ветки и защита main", lessons: chapter2 },
    { id: 3, title: "Работа на компьютере", subtitle: "Клонируем, правим, отправляем", lessons: chapter3 },
    { id: 4, title: "Pull request", subtitle: "Предлагаем изменения и вливаем", lessons: chapter4 },
    { id: 5, title: "OpenSpec в проекте", subtitle: "Описываем изменения до кода", lessons: chapter5 }
];

export const gitLessons = CHAPTERS.flatMap(chapter => chapter.lessons.map(lesson => ({ ...lesson, chapter: chapter.id })));

export const findGitLesson = id => gitLessons.find(lesson => lesson.id === id) || null;

export function lessonNumber(id) {
    const index = gitLessons.findIndex(lesson => lesson.id === id);

    return index === -1 ? null : index + 1;
}
