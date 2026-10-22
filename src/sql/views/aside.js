import { escapeHtml } from "../../utils/textFormat.js";
import { TABLES } from "../hotel/schema.js";
import { sqlLessons } from "../lessons/index.js";

/* Улики открываются по мере решения задач. */
export function collectClues(progress) {
    return sqlLessons
        .map((lesson, index) => ({ lesson, number: index + 1 }))
        .filter(({ lesson }) => progress.lessons?.[lesson.id]?.solved)
        .map(({ lesson, number }) => ({
            lessonId: lesson.id,
            number,
            title: lesson.task.clue.title,
            text: lesson.task.clue.text
        }));
}

/* Шпаргалка пополняется из решённых уроков. */
export function collectCheats(progress) {
    return sqlLessons
        .map((lesson, index) => ({ lesson, number: index + 1 }))
        .filter(({ lesson }) => progress.lessons?.[lesson.id]?.solved && lesson.cheat?.length)
        .map(({ lesson, number }) => ({
            lessonId: lesson.id,
            number,
            title: lesson.title,
            items: lesson.cheat
        }));
}

function renderColumn(column) {
    const badge = column.key
        ? `<span class="sql-key sql-key--${column.key.toLowerCase()}" title="${column.key === "PK" ? "Первичный ключ" : `Внешний ключ → ${escapeHtml(column.ref)}`}">${column.key}</span>`
        : "";

    return `
        <li>
            <span class="sql-col__name">${escapeHtml(column.name)}</span>
            <span class="sql-col__type">${escapeHtml(column.type)}${column.nullable ? ", может быть NULL" : ""}</span>
            ${badge}
            ${column.ref ? `<span class="sql-col__ref">→ ${escapeHtml(column.ref)}</span>` : ""}
        </li>
    `;
}

export function renderSchemaPanel(mentioned = []) {
    return `
        <div class="sql-schema">
            ${TABLES.map(
                table => `
                <section class="sql-table-card${mentioned.includes(table.name) ? " is-mentioned" : ""}" data-table-card="${table.name}">
                    <header>
                        <strong>${escapeHtml(table.name)}</strong>
                        <span>${table.rows} строк</span>
                    </header>
                    <p class="sql-table-card__title">${escapeHtml(table.title)}</p>
                    <ul class="sql-cols">${table.columns.map(renderColumn).join("")}</ul>
                    <button type="button" class="sql-link-button" data-peek-toggle="${table.name}">Показать первые строки</button>
                    <div class="sql-table-card__peek" data-peek-box="${table.name}" hidden></div>
                </section>`
            ).join("")}
        </div>
    `;
}

export function renderNotebook(progress) {
    const clues = collectClues(progress);

    if (clues.length === 0) {
        return `
            <div class="sql-empty-state">
                <strong>Блокнот пуст</strong>
                <p>Решайте задачи. После каждой верной находки сюда записывается улика.</p>
            </div>`;
    }

    return `
        <ol class="sql-clues">
            ${clues
                .map(
                    clue => `
                <li>
                    <a href="#/sql/${encodeURIComponent(clue.lessonId)}" class="sql-clue__title">${clue.number}. ${escapeHtml(clue.title)}</a>
                    <p>${escapeHtml(clue.text)}</p>
                </li>`
                )
                .join("")}
        </ol>
    `;
}

export function renderCheatSheet(progress) {
    const groups = collectCheats(progress);

    if (groups.length === 0) {
        return `
            <div class="sql-empty-state">
                <strong>Шпаргалка пуста</strong>
                <p>Конструкции появляются после решённых уроков.</p>
            </div>`;
    }

    return `
        <div class="sql-cheats">
            ${groups
                .map(
                    group => `
                <section>
                    <h4>${group.number}. ${escapeHtml(group.title)}</h4>
                    <dl>
                        ${group.items
                            .map(([code, meaning]) => `<dt><code>${escapeHtml(code)}</code></dt><dd>${escapeHtml(meaning)}</dd>`)
                            .join("")}
                    </dl>
                </section>`
                )
                .join("")}
        </div>
    `;
}

export const ASIDE_TABS = [
    { id: "schema", label: "База" },
    { id: "notebook", label: "Блокнот" },
    { id: "cheat", label: "Шпаргалка" }
];

export function renderAside(progress, { tab = "schema", mentioned = [] } = {}) {
    const clues = collectClues(progress).length;

    return `
        <aside class="sql-aside" aria-label="Справка">
            <div class="sql-tabs" role="tablist">
                ${ASIDE_TABS.map(
                    item => `
                    <button type="button" role="tab" class="sql-tab${item.id === tab ? " is-active" : ""}" aria-selected="${item.id === tab}" data-aside-tab="${item.id}">
                        ${item.label}${item.id === "notebook" && clues ? ` <span class="sql-badge">${clues}</span>` : ""}
                    </button>`
                ).join("")}
            </div>
            <div class="sql-aside__body" data-aside-body>
                ${
                    tab === "notebook"
                        ? renderNotebook(progress)
                        : tab === "cheat"
                          ? renderCheatSheet(progress)
                          : renderSchemaPanel(mentioned)
                }
            </div>
        </aside>
    `;
}
