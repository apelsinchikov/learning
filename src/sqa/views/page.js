import { escapeHtml } from "../../utils/textFormat.js";
import { highlightSqlHtml } from "../../sql/highlight.js";
import { renderNotice } from "../../sql/views/resultTable.js";
import { renderHints } from "../../sql/views/task.js";
import { renderSqaRich } from "../markup.js";
import { CHAPTERS, lessonNumber } from "../lessons/index.js";
import { HASH, neighbours } from "./nav.js";

export { renderHints };

function renderBlock(block, index) {
    switch (block.type) {
        case "text":
            return `<div class="sql-text">${renderSqaRich(block.text)}</div>`;

        case "why":
            return `
                <aside class="sql-why">
                    <div class="sql-why__title">${escapeHtml(block.title ? `Зачем: ${block.title}` : "Зачем это нужно")}</div>
                    ${renderSqaRich(block.text)}
                </aside>`;

        case "trap":
            return `
                <aside class="sql-trap">
                    <div class="sql-trap__title">Ловушка</div>
                    ${renderSqaRich(block.text)}
                </aside>`;

        case "example":
            return `
                <div class="sql-example" data-example="${index}">
                    <pre class="sql-code" data-sql-source><code>${highlightSqlHtml(block.sql)}</code></pre>
                    ${block.note ? `<p class="sql-example__note">${escapeHtml(block.note)}</p>` : ""}
                    <div class="sql-example__actions">
                        <button type="button" class="sql-button sql-button--small" data-example-run>Выполнить</button>
                        <button type="button" class="sql-button sql-button--ghost sql-button--small" data-example-sandbox>Открыть в песочнице</button>
                    </div>
                    <div class="sql-example__result" data-example-result hidden></div>
                </div>`;

        case "code":
            return `
                <div class="sql-example">
                    <pre class="sql-code"><code>${block.lang === "sql" ? highlightSqlHtml(block.text) : escapeHtml(block.text)}</code></pre>
                    ${block.note ? `<p class="sql-example__note">${escapeHtml(block.note)}</p>` : ""}
                </div>`;

        default:
            return "";
    }
}

function renderRefs(lesson) {
    if (!lesson.refs?.length) {
        return "";
    }

    return `
        <p class="sqa-refs">
            <span class="sqa-refs__label">Повторить:</span>
            ${lesson.refs
                .map(([course, id, label]) => `<button type="button" class="sqa-ref" data-peek="${escapeHtml(course)}:${escapeHtml(id)}">${escapeHtml(label)}</button>`)
                .join("")}
        </p>`;
}

/* Что показываем после верного ответа: разбор и переход дальше. */
export function renderSolved(lesson) {
    const { next } = neighbours(lesson.id);

    return `
        <div class="sql-solved">
            ${renderNotice("success", "Верно!", "")}
            ${lesson.task.afterwards ? `<div class="sql-text">${renderSqaRich(lesson.task.afterwards)}</div>` : ""}
            ${
                next
                    ? `<a class="sql-button" href="${HASH}/${encodeURIComponent(next.id)}">Следующий урок: ${escapeHtml(next.title)} →</a>`
                    : `<a class="sql-button sql-button--ghost" href="${HASH}/sandbox">Открыть песочницу</a>`
            }
        </div>
    `;
}

/* Вопросы с вариантами. answers[i] — выбранный вариант или null; checked — показать разбор. */
export function renderQuiz(lesson, { answers = [], checked = false } = {}) {
    const { questions } = lesson.task;

    return `
        <div class="sqa-quiz" data-quiz>
            ${questions
                .map((question, qIndex) => {
                    const chosen = answers[qIndex] ?? null;
                    const right = checked && chosen === question.correct;
                    const wrong = checked && chosen !== null && chosen !== question.correct;

                    return `
                    <fieldset class="sqa-question${right ? " is-right" : ""}${wrong ? " is-wrong" : ""}">
                        <legend>${qIndex + 1}. ${renderSqaRich(question.prompt).replace(/^<p>|<\/p>$/g, "")}</legend>
                        ${question.options
                            .map(
                                (option, index) => `
                            <label class="sql-choice${chosen === index ? " is-chosen" : ""}">
                                <input type="radio" name="q${qIndex}" value="${index}"${chosen === index ? " checked" : ""}>
                                <span>${escapeHtml(option)}</span>
                            </label>`
                            )
                            .join("")}
                        ${checked && right ? `<p class="sqa-question__note">${renderSqaRich(question.explain).replace(/^<p>|<\/p>$/g, "")}</p>` : ""}
                        ${wrong ? `<p class="sqa-question__note sqa-question__note--bad">Не совсем. Подумайте ещё.</p>` : ""}
                        ${checked && chosen === null ? `<p class="sqa-question__note sqa-question__note--bad">Выберите ответ.</p>` : ""}
                    </fieldset>`;
                })
                .join("")}
            <div class="sql-task__actions">
                <button type="button" class="sql-button" data-quiz-submit>Проверить ответы</button>
            </div>
        </div>
    `;
}

function renderCodeTask(lesson) {
    const { task } = lesson;
    const predictable = task.kind === "query" && task.expectRows !== undefined;

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

const KIND_LABEL = { query: "Задача", script: "Задача", plan: "Задача", quiz: "Вопросы" };

export function renderLessonPage(lesson, { solved = false, hintsShown = 0, answers = [], checked = false } = {}) {
    const number = lessonNumber(lesson.id);
    const chapter = CHAPTERS.find(item => item.id === lesson.chapter);
    const { previous, next } = neighbours(lesson.id);

    return `
        <article class="sql-lesson-page" data-lesson="${escapeHtml(lesson.id)}">
            <header class="sql-page-header">
                <div class="sql-page-header__label">Глава ${chapter.id} · ${escapeHtml(chapter.title)} · Урок ${number}</div>
                <h1>${escapeHtml(lesson.title)}</h1>
            </header>

            <section class="sql-story" aria-label="Рабочая ситуация">
                <div class="sql-story__label">Рабочая ситуация</div>
                ${renderSqaRich(lesson.story)}
            </section>

            ${renderRefs(lesson)}

            <section class="sql-theory" aria-label="Теория">
                ${lesson.theory.map(renderBlock).join("")}
            </section>

            <section class="sql-task" aria-label="Задача">
                <div class="sql-task__label">${KIND_LABEL[lesson.task.kind] || "Задача"}</div>
                ${lesson.task.prompt ? `<div class="sql-text">${renderSqaRich(lesson.task.prompt)}</div>` : ""}

                ${lesson.task.kind === "quiz" ? renderQuiz(lesson, { answers, checked }) : renderCodeTask(lesson)}

                ${lesson.task.hints ? `<div class="sql-hints" data-hints>${renderHints(lesson, hintsShown)}</div>` : ""}
                <div class="sql-output" data-output aria-live="polite"></div>
                <div class="sql-feedback" data-feedback aria-live="polite">${solved ? renderSolved(lesson) : ""}</div>
            </section>

            <nav class="sql-pager">
                ${previous ? `<a href="${HASH}/${encodeURIComponent(previous.id)}">← ${escapeHtml(previous.title)}</a>` : "<span></span>"}
                ${next ? `<a href="${HASH}/${encodeURIComponent(next.id)}" data-mark-read>${escapeHtml(next.title)} →</a>` : ""}
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
                <div class="sql-story__label">Как это работает</div>
                <p>Пробуйте любые запросы к базе «Перевала»: в том числе <code class="inline-code">CREATE TABLE</code>, <code class="inline-code">INSERT</code> и <code class="inline-code">CREATE INDEX</code>. Все изменения выполняются по-настоящему, но после каждого запуска откатываются: база снова такая же, как в начале. Поэтому испортить ничего нельзя.</p>
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
