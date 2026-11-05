import { escapeHtml } from "../../utils/textFormat.js";
import { renderNotice } from "../../sql/views/resultTable.js";
import { fillTokens, renderGitInline, renderGitRich } from "../markup.js";
import { CHAPTERS, lessonNumber } from "../lessons/index.js";
import { fieldByKey, renderField, renderToggles } from "./aside.js";
import { HASH, neighbours } from "./nav.js";
import { validators } from "../profile.js";

/* ---------------- блоки теории ---------------- */

function renderCmd(block, profile) {
    const lines = block.lines
        .map(line => {
            const comment = line.startsWith("#");

            return `<span class="git-line${comment ? " git-line--comment" : ""}">${fillTokens(escapeHtml(line), profile, "cmd")}</span>`;
        })
        .join("");

    return `
        <div class="git-cmd" data-cmd-block>
            <div class="git-cmd__bar">
                <span>${escapeHtml(block.title || "Команды")}</span>
                <button type="button" class="sql-button sql-button--small" data-copy>Копировать</button>
            </div>
            <pre class="git-cmd__code"><code>${lines}</code></pre>
            ${
                block.output
                    ? `<div class="git-out">
                        <div class="git-out__label">Что вы увидите</div>
                        <pre class="git-out__code"><code>${fillTokens(escapeHtml(block.output), profile, "text")}</code></pre>
                        ${block.outputNote ? `<p class="git-out__note">${renderGitInline(block.outputNote, profile)}</p>` : ""}
                    </div>`
                    : ""
            }
            ${block.note ? `<p class="sql-example__note">${renderGitInline(block.note, profile)}</p>` : ""}
        </div>`;
}

/*
 * Любой блок можно показать только для одного способа работы или одной системы:
 * only: "terminal" | "vscode" | "mac" | "windows". Лишнее прячет CSS.
 */
export function renderBlocks(blocks = [], profile = {}) {
    return blocks
        .map(block => {
            const html = renderBlock(block, profile);

            if (!block.only || !html) {
                return html;
            }

            const attribute = block.only === "mac" || block.only === "windows" ? "data-os-variant" : "data-variant";

            return `<div ${attribute}="${block.only}">${html}</div>`;
        })
        .join("");
}

function renderBlock(block, profile) {
    switch (block.type) {
        case "text":
            return `<div class="sql-text">${renderGitRich(block.text, profile)}</div>`;

        case "why":
            return `
                <aside class="sql-why">
                    <div class="sql-why__title">${escapeHtml(block.title ? `Зачем: ${block.title}` : "Зачем это нужно")}</div>
                    ${renderGitRich(block.text, profile)}
                </aside>`;

        case "trap":
            return `
                <aside class="sql-trap">
                    <div class="sql-trap__title">${escapeHtml(block.title || "Ловушка")}</div>
                    ${renderGitRich(block.text, profile)}
                </aside>`;

        case "important":
            return `
                <aside class="git-important">
                    <div class="git-important__title">${escapeHtml(block.title || "Очень важно")}</div>
                    ${renderGitRich(block.text, profile)}
                </aside>`;

        case "cmd":
            return renderCmd(block, profile);

        case "code":
            return `
                <div class="git-cmd git-cmd--plain">
                    ${block.title ? `<div class="git-cmd__bar"><span>${escapeHtml(block.title)}</span></div>` : ""}
                    <pre class="git-cmd__code"><code>${escapeHtml(block.text)}</code></pre>
                    ${block.note ? `<p class="sql-example__note">${renderGitInline(block.note, profile)}</p>` : ""}
                </div>`;

        case "table":
            /* Таблица из четырёх колонок не помещается в узкую колонку урока: каждая строка — карточка, столбцы — подписанные пункты. */
            return `
                <div class="git-table-block">
                    ${block.title ? `<div class="git-table-block__title">${escapeHtml(block.title)}</div>` : ""}
                    <div class="git-roles">
                        ${block.rows
                            .map(
                                row => `
                            <section class="git-role">
                                <h4>${renderGitInline(row[0], profile)}</h4>
                                <dl>
                                    ${row
                                        .slice(1)
                                        .map((cell, index) => `<div class="git-role__row"><dt>${renderGitInline(block.head[index + 1], profile)}</dt><dd>${renderGitInline(cell, profile)}</dd></div>`)
                                        .join("")}
                                </dl>
                            </section>`
                            )
                            .join("")}
                    </div>
                    ${block.note ? `<p class="git-table-block__note">${renderGitInline(block.note, profile)}</p>` : ""}
                </div>`;

        case "web":
            return `
                <div class="git-web">
                    <div class="git-web__label">${escapeHtml(block.title || "В браузере, на GitHub")}</div>
                    <ol>${block.steps.map(step => `<li>${renderGitInline(step, profile)}</li>`).join("")}</ol>
                    ${block.note ? `<p class="sql-example__note">${renderGitInline(block.note, profile)}</p>` : ""}
                </div>`;

        case "how":
            return `
                <div class="git-how">
                    <section class="git-how__variant" data-variant="terminal">
                        <h4>В терминале</h4>
                        ${renderBlocks(block.terminal, profile)}
                    </section>
                    <section class="git-how__variant" data-variant="vscode">
                        <h4>В VS Code</h4>
                        ${renderBlocks(block.vscode, profile)}
                    </section>
                </div>`;

        case "os":
            return `
                <div class="git-osblock">
                    <section class="git-osblock__variant" data-os-variant="mac">
                        <h4>Mac</h4>
                        ${renderBlocks(block.mac, profile)}
                    </section>
                    <section class="git-osblock__variant" data-os-variant="windows">
                        <h4>Windows</h4>
                        ${renderBlocks(block.windows, profile)}
                    </section>
                </div>`;

        default:
            return "";
    }
}

/* ---------------- вопросы ---------------- */

export function renderQuiz(lesson, { answers = [], checked = false, profile = {} } = {}) {
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
                        <legend>${qIndex + 1}. ${renderGitInline(question.prompt, profile)}</legend>
                        ${question.options
                            .map(
                                (option, index) => `
                            <label class="sql-choice${chosen === index ? " is-chosen" : ""}">
                                <input type="radio" name="q${qIndex}" value="${index}"${chosen === index ? " checked" : ""}>
                                <span>${renderGitInline(option, profile)}</span>
                            </label>`
                            )
                            .join("")}
                        ${right ? `<p class="sqa-question__note">${renderGitInline(question.explain, profile)}</p>` : ""}
                        ${wrong ? `<p class="sqa-question__note sqa-question__note--bad">Не совсем. Подумайте ещё.</p>` : ""}
                        ${checked && chosen === null ? `<p class="sqa-question__note sqa-question__note--bad">Выберите ответ.</p>` : ""}
                    </fieldset>`;
                })
                .join("")}
            <div class="sql-task__actions">
                <button type="button" class="sql-button" data-quiz-submit>Проверить ответы</button>
            </div>
        </div>`;
}

/* ---------------- шаги ---------------- */

/*
 * state: { done: Set<номер шага>, drafts: { номер: вставленный текст }, messages: { номер: { ok, lines } } }
 * Шаг-поле считается выполненным, когда в профиле верное значение.
 */
export function stepDone(item, index, state, profile) {
    if (item.field) {
        return validators[item.field](profile[item.field] || "");
    }

    return state.done.has(index);
}

export function stepsComplete(task, state, profile) {
    return task.items.every((item, index) => stepDone(item, index, state, profile));
}

export function renderSteps(lesson, state, profile) {
    const { items } = lesson.task;
    const doneCount = items.filter((item, index) => stepDone(item, index, state, profile)).length;

    return `
        <div class="git-steps" data-steps>
            <div class="git-steps__count">Выполнено: <strong>${doneCount} из ${items.length}</strong></div>
            <ol>
                ${items
                    .map((item, index) => {
                        const done = stepDone(item, index, state, profile);
                        const message = state.messages[index];

                        return `
                        <li class="git-step${done ? " is-done" : ""}">
                            <div class="git-step__head">
                                ${
                                    item.field
                                        ? `<span class="git-step__mark" aria-hidden="true">${done ? "✓" : index + 1}</span>`
                                        : `<input type="checkbox" class="git-step__check" data-step-toggle="${index}" id="step-${index}"${done ? " checked" : ""} aria-label="Шаг выполнен">`
                                }
                                <label class="git-step__text"${item.field ? "" : ` for="step-${index}"`}>${renderGitInline(item.text, profile)}</label>
                            </div>
                            ${item.field ? renderField(fieldByKey(item.field), profile, { inline: true }) : ""}
                            ${
                                item.check
                                    ? `<div class="git-step__check-box">
                                        <label class="git-step__prompt" for="paste-${index}">${renderGitInline(item.check.prompt, profile)}</label>
                                        <textarea id="paste-${index}" class="git-step__paste" data-step-input="${index}" rows="4" placeholder="Вставьте вывод сюда" spellcheck="false">${escapeHtml(state.drafts[index] || "")}</textarea>
                                        <div class="sql-task__actions">
                                            <button type="button" class="sql-button sql-button--small" data-step-check="${index}">Проверить вывод</button>
                                        </div>
                                        ${
                                            message
                                                ? message.ok
                                                    ? renderNotice("success", "Сходится", "")
                                                    : renderNotice("warning", "Пока не сходится", message.lines.join(" ")) +
                                                      (done ? "" : `<p class="git-step__manual">Не получается сверить? Отметьте шаг вручную, если вы выполнили команду.</p>`)
                                                : ""
                                        }
                                    </div>`
                                    : ""
                            }
                        </li>`;
                    })
                    .join("")}
            </ol>
        </div>`;
}

/* ---------------- страница ---------------- */

export function renderSolved(lesson, profile = {}) {
    const { next } = neighbours(lesson.id);

    return `
        <div class="sql-solved">
            ${renderNotice("success", "Готово!", "")}
            ${lesson.task.afterwards ? `<div class="sql-text">${renderGitRich(lesson.task.afterwards, profile)}</div>` : ""}
            ${next ? `<a class="sql-button" href="${HASH}/${encodeURIComponent(next.id)}">Следующий урок: ${escapeHtml(next.title)} →</a>` : ""}
        </div>`;
}

export function renderLessonPage(lesson, { solved = false, answers = [], checked = false, steps, profile = {} } = {}) {
    const number = lessonNumber(lesson.id);
    const chapter = CHAPTERS.find(item => item.id === lesson.chapter);
    const { previous, next } = neighbours(lesson.id);
    const isQuiz = lesson.task.kind === "quiz";

    return `
        <article class="sql-lesson-page" data-lesson="${escapeHtml(lesson.id)}">
            <header class="sql-page-header">
                <div class="sql-page-header__label">Глава ${chapter.id} · ${escapeHtml(chapter.title)} · Урок ${number}</div>
                <h1>${escapeHtml(lesson.title)}</h1>
            </header>

            <div class="git-toolbar">
                ${renderToggles(profile, { compact: true })}
                <button type="button" class="git-toolbar__profile" data-open-profile>Мои значения для команд</button>
            </div>

            <section class="sql-story" aria-label="Рабочая ситуация">
                <div class="sql-story__label">Рабочая ситуация</div>
                ${renderGitRich(lesson.story, profile)}
            </section>

            <section class="sql-theory" aria-label="Теория">
                ${renderBlocks(lesson.theory, profile)}
            </section>

            <section class="sql-task" aria-label="Задание">
                <div class="sql-task__label">${isQuiz ? "Вопросы" : "Задание"}</div>
                ${lesson.task.prompt ? `<div class="sql-text">${renderGitRich(lesson.task.prompt, profile)}</div>` : ""}
                ${isQuiz ? renderQuiz(lesson, { answers, checked, profile }) : renderSteps(lesson, steps, profile)}
                <div class="sql-feedback" data-feedback aria-live="polite">${solved ? renderSolved(lesson, profile) : ""}</div>
            </section>

            <nav class="sql-pager">
                ${previous ? `<a href="${HASH}/${encodeURIComponent(previous.id)}">← ${escapeHtml(previous.title)}</a>` : "<span></span>"}
                ${next ? `<a href="${HASH}/${encodeURIComponent(next.id)}" data-mark-read>${escapeHtml(next.title)} →</a>` : ""}
            </nav>
        </article>`;
}
