import { escapeHtml } from "../../utils/textFormat.js";
import { rowsWord } from "../check.js";

const MAX_ROWS = 200;

function cell(value) {
    if (value === null || value === undefined) {
        return `<td class="sql-null">NULL</td>`;
    }

    const text = typeof value === "object" ? JSON.stringify(value) : String(value);
    const numeric = typeof value === "number" || typeof value === "bigint";

    return `<td${numeric ? ` class="sql-num"` : ""}>${escapeHtml(text)}</td>`;
}

/* result: { columns: [{name}], rows: [[...]] } */
export function renderResultTable(result, { caption = true } = {}) {
    const rows = result.rows.slice(0, MAX_ROWS);
    const more = result.rows.length - rows.length;

    return `
        <div class="sql-result">
            ${caption ? `<div class="sql-result__caption">Найдено: ${rowsWord(result.rows.length)}</div>` : ""}
            <div class="sql-result__scroll">
                <table class="sql-table">
                    <thead>
                        <tr>${result.columns.map(c => `<th>${escapeHtml(c.name)}</th>`).join("")}</tr>
                    </thead>
                    <tbody>
                        ${
                            rows.length
                                ? rows.map(row => `<tr>${row.map(cell).join("")}</tr>`).join("")
                                : `<tr><td class="sql-empty" colspan="${Math.max(result.columns.length, 1)}">Ничего не найдено</td></tr>`
                        }
                    </tbody>
                </table>
            </div>
            ${more > 0 ? `<div class="sql-result__more">Показаны первые ${MAX_ROWS}, ещё ${more}.</div>` : ""}
        </div>
    `;
}

export function renderErrorBox({ title, text }) {
    return `
        <div class="sql-error" role="alert">
            <strong>${escapeHtml(title)}</strong>
            <p>${escapeHtml(text)}</p>
        </div>
    `;
}

export function renderNotice(kind, title, text) {
    return `
        <div class="sql-notice sql-notice--${kind}" role="status">
            <strong>${escapeHtml(title)}</strong>
            ${text ? `<p>${escapeHtml(text)}</p>` : ""}
        </div>
    `;
}
