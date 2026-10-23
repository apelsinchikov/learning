import { escapeHtml } from "../../utils/textFormat.js";
import { diagramsHash } from "../../courses/router.js";
import { diagramLessons, isDiagramTask } from "../lessons/index.js";
import { highlightDiagramHtml } from "../highlight.js";

/* «Папка проекта»: диаграммы из решённых уроков (код берём из черновика ученика). */
export function collectFolder(progress) {
    return diagramLessons
        .map((lesson, index) => ({ lesson, number: index + 1 }))
        .filter(({ lesson }) => isDiagramTask(lesson) && progress.lessons?.[lesson.id]?.solved)
        .map(({ lesson, number }) => ({
            lessonId: lesson.id,
            number,
            title: lesson.title,
            kind: lesson.task.diagram,
            code: (progress.lessons[lesson.id].draft || "").trim() ? progress.lessons[lesson.id].draft : lesson.task.solution
        }));
}

/* Шпаргалка пополняется из решённых уроков. */
export function collectCheats(progress) {
    return diagramLessons
        .map((lesson, index) => ({ lesson, number: index + 1 }))
        .filter(({ lesson }) => progress.lessons?.[lesson.id]?.solved && lesson.cheat?.length)
        .map(({ lesson, number }) => ({
            lessonId: lesson.id,
            number,
            title: lesson.title,
            items: lesson.cheat
        }));
}

export function renderFolder(progress) {
    const items = collectFolder(progress);

    if (items.length === 0) {
        return `
            <div class="sql-empty-state">
                <strong>Папка пуста</strong>
                <p>Решайте задачи с диаграммами. Каждая верная диаграмма попадёт сюда вместе с кодом.</p>
            </div>`;
    }

    return `
        <div class="dg-folder">
            ${items
                .map(
                    item => `
                <section class="dg-folder__card" data-folder-card="${escapeHtml(item.lessonId)}" data-folder-kind="${escapeHtml(item.kind)}">
                    <a href="${diagramsHash(item.lessonId)}" class="sql-clue__title">${item.number}. ${escapeHtml(item.title)}</a>
                    <div class="dg-folder__picture" data-folder-picture><p class="dg-preview__empty">Рисую…</p></div>
                    <details>
                        <summary>Код диаграммы</summary>
                        <pre class="sql-code dg-code" data-folder-code="${escapeHtml(item.code)}"><code>${highlightDiagramHtml(item.code)}</code></pre>
                        <button type="button" class="sql-button sql-button--ghost sql-button--small" data-copy-folder="${escapeHtml(item.lessonId)}">Скопировать код</button>
                    </details>
                </section>`
                )
                .join("")}
        </div>
    `;
}

export function renderCheatSheet(progress) {
    const groups = collectCheats(progress);

    if (groups.length === 0) {
        return `
            <div class="sql-empty-state">
                <strong>Шпаргалка пуста</strong>
                <p>Записи появляются после решённых уроков.</p>
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
    { id: "folder", label: "Папка проекта" },
    { id: "cheat", label: "Шпаргалка" }
];

export function renderAside(progress, { tab = "folder" } = {}) {
    const count = collectFolder(progress).length;

    return `
        <aside class="sql-aside" aria-label="Справка">
            <div class="sql-tabs" role="tablist">
                ${ASIDE_TABS.map(
                    item => `
                    <button type="button" role="tab" class="sql-tab${item.id === tab ? " is-active" : ""}" aria-selected="${item.id === tab}" data-aside-tab="${item.id}">
                        ${item.label}${item.id === "folder" && count ? ` <span class="sql-badge">${count}</span>` : ""}
                    </button>`
                ).join("")}
            </div>
            <div class="sql-aside__body" data-aside-body>
                ${tab === "cheat" ? renderCheatSheet(progress) : renderFolder(progress)}
            </div>
        </aside>
    `;
}
