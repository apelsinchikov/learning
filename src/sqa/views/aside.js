import { escapeHtml } from "../../utils/textFormat.js";
import { sqaLessons } from "../lessons/index.js";
import { renderSchemaPanel } from "./schemaPanel.js";

/* Шпаргалка пополняется из решённых уроков. */
export function collectCheats(progress) {
    return sqaLessons
        .map((lesson, index) => ({ lesson, number: index + 1 }))
        .filter(({ lesson }) => progress.lessons?.[lesson.id]?.solved && lesson.cheat?.length)
        .map(({ lesson, number }) => ({ lessonId: lesson.id, number, title: lesson.title, items: lesson.cheat }));
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
                        ${group.items.map(([code, meaning]) => `<dt><code>${escapeHtml(code)}</code></dt><dd>${escapeHtml(meaning)}</dd>`).join("")}
                    </dl>
                </section>`
                )
                .join("")}
        </div>
    `;
}

export const ASIDE_TABS = [
    { id: "schema", label: "Схема" },
    { id: "cheat", label: "Шпаргалка" }
];

export function renderAsideBody(tab, progress, schemaState, mentioned = []) {
    return tab === "cheat" ? renderCheatSheet(progress) : renderSchemaPanel(schemaState, { mentioned });
}

export function renderAside(progress, { tab = "schema", schemaState, mentioned = [] } = {}) {
    return `
        <aside class="sql-aside" aria-label="Справка">
            <div class="sql-tabs" role="tablist">
                ${ASIDE_TABS.map(
                    item => `
                    <button type="button" role="tab" class="sql-tab${item.id === tab ? " is-active" : ""}" aria-selected="${item.id === tab}" data-aside-tab="${item.id}">${item.label}</button>`
                ).join("")}
            </div>
            <div class="sql-aside__body" data-aside-body>${renderAsideBody(tab, progress, schemaState, mentioned)}</div>
        </aside>
    `;
}
