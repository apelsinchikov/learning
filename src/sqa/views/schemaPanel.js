import { escapeHtml } from "../../utils/textFormat.js";
import { TABLE_INFO } from "../db/seed.js";
import { keyTitle } from "../schema.js";

const TITLES = Object.fromEntries(TABLE_INFO.map(item => [item.name, item.title]));
const KIND_NOTE = { view: "представление", matview: "материализованное представление" };

function renderColumn(column) {
    const badges = column.keys
        .map(key => `<span class="sql-key sql-key--${key.toLowerCase()}" title="${escapeHtml(keyTitle(column))}">${key}</span>`)
        .join("");
    const extra = [column.nullable ? "может быть NULL" : null, column.identity ? "identity" : null, column.default && !column.identity ? `по умолчанию ${column.default}` : null]
        .filter(Boolean)
        .join(", ");

    return `
        <li>
            <span class="sql-col__name">${escapeHtml(column.name)}</span>
            <span class="sql-col__type">${escapeHtml(column.type)}${extra ? `, ${escapeHtml(extra)}` : ""}</span>
            ${badges}
            ${column.ref ? `<span class="sql-col__ref">→ ${escapeHtml(column.ref)}</span>` : ""}
        </li>
    `;
}

export function renderTableCard(table, { mentioned = false, peek = false } = {}) {
    const composite = table.primaryKey.length > 1 ? ` Составной ключ: ${table.primaryKey.join(" + ")}.` : "";

    return `
        <section class="sql-table-card${mentioned ? " is-mentioned" : ""}" data-table-card="${escapeHtml(table.name)}">
            <header>
                <strong>${escapeHtml(table.name)}</strong>
                <span>${table.rows === null ? "" : `${table.rows} строк`}</span>
            </header>
            <p class="sql-table-card__title">${escapeHtml(KIND_NOTE[table.kind] || TITLES[table.name] || "Таблица")}${escapeHtml(composite)}</p>
            <ul class="sql-cols">${table.columns.map(renderColumn).join("")}</ul>
            ${
                table.indexes.length
                    ? `<p class="sqa-indexes">Индексы: ${table.indexes.map(index => `<code>${escapeHtml(index.name)}</code>`).join(", ")}</p>`
                    : ""
            }
            ${peek ? `<button type="button" class="sql-link-button" data-peek-toggle="${escapeHtml(table.name)}">Показать первые строки</button>
            <div class="sql-table-card__peek" data-peek-box="${escapeHtml(table.name)}" hidden></div>` : ""}
        </section>
    `;
}

/*
 * state: { status: "loading" | "ready" | "error", model, after, changed, error }
 *   after   — показано состояние после запроса ученика (изменения отката не имеют)
 *   changed — имена таблиц, которых не было в исходном состоянии урока
 */
export function renderSchemaPanel(state, { mentioned = [] } = {}) {
    if (state.status === "loading") {
        return `<div class="sql-empty-state"><strong>Готовлю схему…</strong><p>В первый раз это занимает несколько секунд: загружается Postgres.</p></div>`;
    }

    if (state.status === "error") {
        return `<div class="sql-empty-state"><strong>Схему не удалось загрузить</strong><p>${escapeHtml(state.error || "Проверьте соединение и обновите страницу.")}</p></div>`;
    }

    const { model } = state;
    const order = TABLE_INFO.map(item => item.name);
    const sorted = [...model].sort((a, b) => {
        const ai = order.indexOf(a.name);
        const bi = order.indexOf(b.name);

        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || a.name.localeCompare(b.name);
    });
    const changed = new Set(state.changed || []);

    return `
        <div class="sqa-schema" data-schema-state="${state.after ? "after" : "base"}">
            <div class="sqa-schema__bar">
                <button type="button" class="sql-button sql-button--small" data-schema-open>Схема целиком</button>
                <span class="sqa-schema__hint">${model.length} ${model.length === 1 ? "таблица" : "таблиц"}</span>
            </div>
            ${
                state.after
                    ? `<div class="sqa-schema__after" role="status">Показано состояние <strong>после вашего запроса</strong>. Сама база откатилась. <button type="button" class="sql-link-button" data-schema-reset>Показать исходную</button></div>`
                    : ""
            }
            ${sorted
                .map(table => {
                    const card = renderTableCard(table, { mentioned: mentioned.includes(table.name), peek: !state.after });

                    return changed.has(table.name) ? card.replace('class="sql-table-card', 'class="sql-table-card is-new') : card;
                })
                .join("")}
        </div>
    `;
}

/* Окно «Схема целиком»: ER-диаграмма и список таблиц. */
export function renderSchemaModal(state) {
    return `
        <div class="sqa-modal" data-schema-modal role="dialog" aria-modal="true" aria-label="Схема базы целиком">
            <div class="sqa-modal__backdrop" data-schema-close></div>
            <div class="sqa-modal__window">
                <header class="sqa-modal__header">
                    <h2>Схема базы${state.after ? " после вашего запроса" : ""}</h2>
                    <button type="button" class="sql-button sql-button--ghost sql-button--small" data-schema-close>Закрыть</button>
                </header>
                <div class="sqa-modal__body">
                    <div class="sqa-modal__er" data-er-picture><p class="sqa-muted">Рисую диаграмму…</p></div>
                    <div class="sqa-modal__side">
                        <p class="sqa-muted">Нажмите на таблицу, чтобы увидеть первые строки.</p>
                        <ul class="sqa-modal__tables">
                            ${state.model
                                .map(
                                    table => `<li><button type="button" class="sqa-table-ref" data-modal-table="${escapeHtml(table.name)}">${escapeHtml(table.name)}</button> <span class="sqa-muted">${table.rows === null ? "" : `${table.rows} строк`}</span></li>`
                                )
                                .join("")}
                        </ul>
                        <div data-modal-rows></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
