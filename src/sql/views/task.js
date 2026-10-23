import { escapeHtml } from "../../utils/textFormat.js";
import { renderRich } from "../richText.js";
import { renderNotice } from "./resultTable.js";
import { neighbours } from "./nav.js";
import { renderStory, renderTheory } from "./theory.js";
import { lessonNumber, CHAPTERS } from "../lessons/index.js";

export const HINT_TITLES = ["Намёк", "Структура запроса", "Почти готовое решение"];

export function renderHints(lesson, shown) {
    const hints = lesson.task.hints.slice(0, shown);
    const left = lesson.task.hints.length - shown;

    return `
        ${hints
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
                ? `<button type="button" class="sql-link-button" data-hint>Подсказка (${shown + 1} из ${lesson.task.hints.length})</button>`
                : ""
        }
    `;
}

const EPILOGUE =
    "Инспектор Рябова вернула шкатулку управляющему. «Спасибо, архивариус, — сказала она. — Без вашей базы мы искали бы до весны». Дело закрыто.";

export function renderVerdict(verdict, chosen = null) {
    const suspect = chosen === null ? null : verdict.suspects[chosen];

    return `
        <section class="sql-verdict" data-verdict>
            <h3>${escapeHtml(verdict.question)}</h3>
            <p>${escapeHtml(verdict.note)}</p>
            <div class="sql-verdict__list">
                ${verdict.suspects
                    .map(
                        (item, index) => `
                    <label class="sql-choice${chosen === index ? " is-chosen" : ""}">
                        <input type="radio" name="verdict" value="${index}"${chosen === index ? " checked" : ""}>
                        <span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.reason)}</small></span>
                    </label>`
                    )
                    .join("")}
            </div>
            <button type="button" class="sql-button" data-verdict-submit>Назвать виновного</button>
            ${
                suspect
                    ? suspect.correct
                        ? `${renderNotice("success", `Верно: ${suspect.name}`, suspect.why)}<p class="sql-epilogue">${escapeHtml(EPILOGUE)}</p>`
                        : renderNotice("warning", `Не он: ${suspect.name}`, suspect.why)
                    : ""
            }
        </section>
    `;
}

/* Что показываем после правильного ответа: улика, разбор, дальше. */
export function renderSolved(lesson, { verdictChoice = null } = {}) {
    const { task } = lesson;
    const { next } = neighbours(lesson.id);
    const after = task.kind === "choice" ? task.explain : task.afterwards;

    return `
        <div class="sql-solved">
            ${renderNotice("success", "Верно!", "")}
            ${after ? `<div class="sql-text">${renderRich(after)}</div>` : ""}
            <div class="sql-clue-card">
                <div class="sql-clue-card__label">Улика записана в блокнот</div>
                <strong>${escapeHtml(task.clue.title)}</strong>
                <p>${escapeHtml(task.clue.text)}</p>
            </div>
            ${task.verdict ? renderVerdict(task.verdict, verdictChoice) : ""}
            ${
                next
                    ? `<a class="sql-button" href="#/sql/${encodeURIComponent(next.id)}">Следующий урок: ${escapeHtml(next.title)} →</a>`
                    : `<a class="sql-button sql-button--ghost" href="#/sql/sandbox">Открыть песочницу</a>`
            }
        </div>
    `;
}

function renderChoiceTask(lesson, chosen) {
    const { task } = lesson;

    return `
        <div class="sql-choices" data-choices>
            ${task.options
                .map(
                    (option, index) => `
                <label class="sql-choice${chosen === index ? " is-chosen" : ""}">
                    <input type="radio" name="choice" value="${index}"${chosen === index ? " checked" : ""}>
                    <span>${escapeHtml(option)}</span>
                </label>`
                )
                .join("")}
        </div>
        <div class="sql-task__actions">
            <button type="button" class="sql-button" data-choice-submit>Ответить</button>
        </div>
    `;
}

function renderQueryTask(lesson) {
    const { task } = lesson;
    const predictable = task.expectRows !== undefined;

    return `
        ${
            predictable
                ? `<label class="sql-predict">
                    Угадайте заранее: сколько строк вернёт верный запрос?
                    <input type="number" min="0" inputmode="numeric" data-predict placeholder="не обязательно">
                </label>`
                : ""
        }
        <div class="sql-editor" data-editor></div>
        <div class="sql-task__actions">
            <button type="button" class="sql-button" data-run>Выполнить</button>
            <button type="button" class="sql-button sql-button--accent" data-check>Проверить ответ</button>
            <button type="button" class="sql-button sql-button--ghost" data-reset>Сбросить</button>
            <span class="sql-task__keys">Ctrl + Enter — выполнить</span>
        </div>
    `;
}

/*
 * Страница урока. Верхняя часть статична, а нижняя (результат, подсказки,
 * сообщение об успехе) меняется на месте, чтобы не терять редактор.
 */
export function renderLessonPage(lesson, { solved, hintsShown, chosen, verdictChoice }) {
    const number = lessonNumber(lesson.id);
    const chapter = CHAPTERS.find(item => item.id === lesson.chapter);
    const { previous, next } = neighbours(lesson.id);
    const kindLabel = lesson.task.kind === "fix" ? "Найдите ошибку" : "Задача";

    return `
        <article class="sql-lesson-page" data-lesson="${escapeHtml(lesson.id)}">
            <header class="sql-page-header">
                <div class="sql-page-header__label">Глава ${chapter.id} · ${escapeHtml(chapter.title)} · Урок ${number}</div>
                <h1>${escapeHtml(lesson.title)}</h1>
            </header>

            ${renderStory(lesson)}
            ${renderTheory(lesson)}

            <section class="sql-task" aria-label="Задача">
                <div class="sql-task__label">${kindLabel}</div>
                <div class="sql-text">${renderRich(lesson.task.prompt)}</div>

                ${lesson.task.kind === "choice" ? renderChoiceTask(lesson, chosen) : renderQueryTask(lesson)}

                <div class="sql-hints" data-hints>${renderHints(lesson, hintsShown)}</div>
                <div class="sql-output" data-output aria-live="polite"></div>
                <div class="sql-feedback" data-feedback aria-live="polite">${
                    solved ? renderSolved(lesson, { verdictChoice }) : ""
                }</div>
            </section>

            <nav class="sql-pager">
                ${
                    previous
                        ? `<a href="#/sql/${encodeURIComponent(previous.id)}">← ${escapeHtml(previous.title)}</a>`
                        : "<span></span>"
                }
                ${next ? `<a href="#/sql/${encodeURIComponent(next.id)}" data-mark-read>${escapeHtml(next.title)} →</a>` : ""}
            </nav>
        </article>
    `;
}

export function renderSandboxPage() {
    return `
        <article class="sql-lesson-page" data-lesson="sandbox">
            <header class="sql-page-header">
                <div class="sql-page-header__label">Свободный режим</div>
                <h1>Песочница</h1>
            </header>

            <section class="sql-story">
                <div class="sql-story__label">Из дела</div>
                <p>Дело закрыто, но архив остался. Пробуйте любые запросы к базе отеля. Данные изменить нельзя, поэтому испортить ничего не получится.</p>
            </section>

            <section class="sql-task" aria-label="Песочница">
                <div class="sql-editor" data-editor></div>
                <div class="sql-task__actions">
                    <button type="button" class="sql-button" data-run>Выполнить</button>
                    <button type="button" class="sql-button sql-button--ghost" data-reset>Очистить</button>
                    <span class="sql-task__keys">Ctrl + Enter — выполнить</span>
                </div>
                <div class="sql-output" data-output aria-live="polite"></div>
            </section>
        </article>
    `;
}
