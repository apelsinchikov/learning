import { escapeHtml } from "../../utils/textFormat.js";
import { renderRich } from "../../sql/richText.js";
import { diagramsHash } from "../../courses/router.js";
import { CHAPTERS, isDiagramTask, lessonNumber } from "../lessons/index.js";
import { neighbours } from "./nav.js";
import { renderBench, renderStory, renderTheory } from "./theory.js";

export const HINT_TITLES = ["Намёк", "Что именно нужно", "Почти готовое решение"];

export function renderNotice(kind, title, text) {
    return `
        <div class="sql-notice sql-notice--${kind}" role="status">
            <strong>${escapeHtml(title)}</strong>
            ${text ? `<p>${escapeHtml(text)}</p>` : ""}
        </div>
    `;
}

export function renderErrorBox({ title, text, details = "" }) {
    return `
        <div class="sql-error" role="alert">
            <strong>${escapeHtml(title)}</strong>
            <p>${escapeHtml(text)}</p>
            ${details ? `<p class="dg-error__details">${escapeHtml(details)}</p>` : ""}
        </div>
    `;
}

export function renderHints(lesson, shown) {
    const hints = lesson.task.hints || [];
    const open = hints.slice(0, shown);
    const left = hints.length - shown;

    return `
        ${open
            .map(
                (hint, index) => `
            <div class="sql-hint">
                <strong>${HINT_TITLES[index] || "Подсказка"}</strong>
                <p>${escapeHtml(hint)}</p>
            </div>`
            )
            .join("")}
        ${
            left > 0
                ? `<button type="button" class="sql-link-button" data-hint>Подсказка (${shown + 1} из ${hints.length})</button>`
                : ""
        }
    `;
}

/* Что показываем после правильного ответа: разбор, папка проекта, дальше. */
export function renderSolved(lesson) {
    const { task } = lesson;
    const { next } = neighbours(lesson.id);

    return `
        <div class="sql-solved">
            ${renderNotice("success", "Верно!", "")}
            ${task.afterwards ? `<div class="sql-text">${renderRich(task.afterwards)}</div>` : ""}
            ${
                isDiagramTask(lesson)
                    ? `<div class="sql-clue-card dg-folder-note">
                        <div class="sql-clue-card__label">Диаграмма в «Папке проекта»</div>
                        <p>Ваша диаграмма сохранена справа, во вкладке «Папка проекта». Её код можно скопировать.</p>
                    </div>`
                    : ""
            }
            ${
                next
                    ? `<a class="sql-button" href="${diagramsHash(next.id)}">Следующий урок: ${escapeHtml(next.title)} →</a>`
                    : `<a class="sql-button sql-button--ghost" href="${diagramsHash("sandbox")}">Открыть песочницу</a>`
            }
        </div>
    `;
}

/* ------------------------------ вопросы ------------------------------ */

export const orderOf = (question, state, index) => state.orders?.[index] ?? question.shuffle;

export function isOrderCorrect(question, order) {
    return order.every((value, position) => value === position);
}

export function orderScore(order) {
    return order.filter((value, position) => value === position).length;
}

function renderChoice(question, index, state, locked) {
    return `
        <div class="sql-choices">
            ${question.options
                .map(
                    (option, optionIndex) => `
                <label class="sql-choice${state.choices?.[index] === optionIndex ? " is-chosen" : ""}">
                    <input type="radio" name="q${index}" value="${optionIndex}"${state.choices?.[index] === optionIndex ? " checked" : ""}${locked ? " disabled" : ""}>
                    <span>${escapeHtml(option)}</span>
                </label>`
                )
                .join("")}
        </div>
    `;
}

function renderOrder(question, index, state, locked) {
    const order = orderOf(question, state, index);

    return `
        <ol class="dg-order">
            ${order
                .map(
                    (itemIndex, position) => `
                <li>
                    <span class="dg-order__text">${escapeHtml(question.items[itemIndex])}</span>
                    <span class="dg-order__buttons">
                        <button type="button" class="dg-order__button" aria-label="Выше" data-order-move="${index}:${position}:up"${position === 0 || locked ? " disabled" : ""}>↑</button>
                        <button type="button" class="dg-order__button" aria-label="Ниже" data-order-move="${index}:${position}:down"${position === order.length - 1 || locked ? " disabled" : ""}>↓</button>
                    </span>
                </li>`
                )
                .join("")}
        </ol>
    `;
}

function renderQuestionResult(question, index, state) {
    const result = state.results?.[index];

    if (result === undefined) {
        return "";
    }

    if (result) {
        return renderNotice("success", "Верно", question.explain);
    }

    if (question.type === "order") {
        const score = orderScore(orderOf(question, state, index));

        return renderNotice("warning", "Пока не то", `На своих местах: ${score} из ${question.items.length}. Подумайте, что должно идти раньше.`);
    }

    return renderNotice("warning", "Не совсем", "Подумайте ещё или откройте подсказку.");
}

export function renderQuiz(lesson, state = {}) {
    const { questions } = lesson.task;

    return `
        ${questions
            .map((question, index) => {
                const result = state.results?.[index];
                const locked = result === true;

                return `
                <fieldset class="dg-question${result === true ? " is-right" : result === false ? " is-wrong" : ""}" data-question="${index}">
                    <legend>${index + 1}. ${escapeHtml(question.text)}</legend>
                    ${question.type === "order" ? renderOrder(question, index, state, locked) : renderChoice(question, index, state, locked)}
                    ${renderQuestionResult(question, index, state)}
                </fieldset>`;
            })
            .join("")}
        <div class="sql-task__actions">
            <button type="button" class="sql-button sql-button--accent" data-quiz-submit>Проверить ответы</button>
        </div>
    `;
}

/*
 * Страница урока. Верхняя часть статична, а нижняя (результат, подсказки,
 * сообщение об успехе) меняется на месте, чтобы не терять редактор.
 *
 * Возвращает { html, tryits }: tryits — редакторы из теории, их оживляет приложение.
 */
export function renderLessonPage(lesson, { solved = false, hintsShown = 0, quiz = {} } = {}) {
    const number = lessonNumber(lesson.id);
    const chapter = CHAPTERS.find(item => item.id === lesson.chapter);
    const { previous, next } = neighbours(lesson.id);
    const theory = renderTheory(lesson);
    const { task } = lesson;
    const label = task.kind === "fix" ? "Исправьте диаграмму" : task.kind === "quiz" ? "Вопросы" : "Задача";

    const html = `
        <article class="sql-lesson-page dg-lesson-page" data-lesson="${escapeHtml(lesson.id)}">
            <header class="sql-page-header">
                <div class="sql-page-header__label">Глава ${chapter.id} · ${escapeHtml(chapter.title)} · Урок ${number}</div>
                <h1>${escapeHtml(lesson.title)}</h1>
            </header>

            ${renderStory(lesson)}
            ${theory.html}

            <section class="sql-task" aria-label="Задача">
                <div class="sql-task__label">${label}</div>
                <div class="sql-text">${renderRich(task.prompt)}</div>

                ${
                    task.kind === "quiz"
                        ? `<div class="dg-quiz" data-quiz>${renderQuiz(lesson, quiz)}</div>`
                        : `${renderBench({ id: "task", kind: task.diagram, label: "Ваша диаграмма" })}
                           <div class="sql-task__actions">
                               <button type="button" class="sql-button sql-button--accent" data-check>Проверить ответ</button>
                               <button type="button" class="sql-button sql-button--ghost" data-reset>Сбросить</button>
                               <span class="sql-task__keys">Ctrl + Enter — проверить</span>
                           </div>`
                }

                <div class="sql-hints" data-hints>${task.hints ? renderHints(lesson, hintsShown) : ""}</div>
                <div class="sql-output" data-output aria-live="polite"></div>
                <div class="sql-feedback" data-feedback aria-live="polite">${solved ? renderSolved(lesson) : ""}</div>
            </section>

            <nav class="sql-pager">
                ${
                    previous
                        ? `<a href="${diagramsHash(previous.id)}">← ${escapeHtml(previous.title)}</a>`
                        : "<span></span>"
                }
                ${next ? `<a href="${diagramsHash(next.id)}" data-mark-read>${escapeHtml(next.title)} →</a>` : ""}
            </nav>
        </article>
    `;

    return { html, tryits: theory.tryits };
}

export const SANDBOX_TEMPLATES = [
    {
        id: "er",
        label: "ER",
        code: `erDiagram
    GUEST ||--o{ BOOKING : "делает"
    GUEST {
        int id PK
        string full_name
    }
    BOOKING {
        int id PK
        int guest_id FK
        date check_in
    }
`
    },
    {
        id: "sequence",
        label: "Sequence",
        code: `sequenceDiagram
    actor Guest as Гость
    participant Site as Сайт
    Guest->>Site: Хочу номер
    Site-->>Guest: Есть свободный
`
    },
    {
        id: "flowchart",
        label: "Блок-схема",
        code: `flowchart TD
    A[Гость выбрал даты] --> B{Есть свободный номер?}
    B -- да --> C[Показать цену]
    B -- нет --> D[Предложить другие даты]
`
    }
];

export function renderSandboxPage() {
    return `
        <article class="sql-lesson-page dg-lesson-page" data-lesson="sandbox">
            <header class="sql-page-header">
                <div class="sql-page-header__label">Свободный режим</div>
                <h1>Песочница</h1>
            </header>

            <section class="sql-story">
                <div class="sql-story__label">Из проекта</div>
                <p>Проект сдан, но блокнот остался. Пробуйте любые диаграммы Mermaid: ER, sequence и другие. Проверки здесь нет, прогресс не меняется.</p>
            </section>

            <section class="sql-task" aria-label="Песочница">
                <div class="dg-templates">
                    <span>Начать с шаблона:</span>
                    ${SANDBOX_TEMPLATES.map(
                        template => `<button type="button" class="sql-button sql-button--ghost sql-button--small" data-template="${template.id}">${escapeHtml(template.label)}</button>`
                    ).join("")}
                </div>
                ${renderBench({ id: "sandbox", kind: "any", label: "Текст диаграммы" })}
                <div class="sql-task__actions">
                    <button type="button" class="sql-button sql-button--ghost" data-reset>Очистить</button>
                </div>
            </section>
        </article>
    `;
}
