import { escapeHtml } from "../utils/textFormat.js";

/*
 * Наглядное соединение таблиц: не кружки Венна, а строки.
 * Берём два крошечных списка и показываем, какие строки находят пару.
 */

export const LEFT_SAMPLE = [
    { id: 1, name: "Анна" },
    { id: 2, name: "Борис" },
    { id: 3, name: "Вера" }
];

export const RIGHT_SAMPLE = [
    { guest_id: 2, item: "Кофе" },
    { guest_id: 2, item: "Суп" },
    { guest_id: 4, item: "Чай" }
];

/*
 * Возвращает строки результата: { left, right, state }.
 * state: "match" — пара найдена, "left-only", "right-only" — пары нет.
 */
export function joinRows(kind, left = LEFT_SAMPLE, right = RIGHT_SAMPLE) {
    if (kind === "cross") {
        return left.flatMap(l => right.map(r => ({ left: l, right: r, state: "match" })));
    }

    const rows = [];
    const usedRight = new Set();

    for (const l of left) {
        const partners = right.filter(r => r.guest_id === l.id);

        if (partners.length > 0) {
            partners.forEach(r => {
                usedRight.add(r);
                rows.push({ left: l, right: r, state: "match" });
            });
        } else if (kind === "left" || kind === "full") {
            rows.push({ left: l, right: null, state: "left-only" });
        }
    }

    if (kind === "right" || kind === "full") {
        for (const r of right) {
            if (!usedRight.has(r)) {
                rows.push({ left: null, right: r, state: "right-only" });
            }
        }
    }

    return rows;
}

const CAPTIONS = {
    cross: "CROSS JOIN: каждая строка с каждой. Девять пар, и большинство бессмысленны.",
    inner: "JOIN: остаются только пары. Анна и Вера без заказов исчезли. Заказ «Чай» без гостя тоже.",
    left: "LEFT JOIN: все гости остаются. У кого заказов нет, справа NULL.",
    right: "RIGHT JOIN: все заказы остаются. Если гостя нет, слева NULL.",
    full: "FULL JOIN: остаются все строки с обеих сторон."
};

const cell = value => (value === null ? `<span class="sql-null">NULL</span>` : escapeHtml(value));

export function renderJoinVisual(kind) {
    const rows = joinRows(kind);

    const sideTable = (title, head, items, cols) => `
        <div class="join-visual__side">
            <div class="join-visual__title">${title}</div>
            <table class="join-visual__table">
                <thead><tr>${head.map(h => `<th>${h}</th>`).join("")}</tr></thead>
                <tbody>${items
                    .map(item => `<tr>${cols.map(c => `<td>${escapeHtml(item[c])}</td>`).join("")}</tr>`)
                    .join("")}</tbody>
            </table>
        </div>
    `;

    return `
        <figure class="join-visual join-visual--${kind}" aria-label="Схема соединения">
            <div class="join-visual__inputs">
                ${sideTable("guests", ["id", "name"], LEFT_SAMPLE, ["id", "name"])}
                ${sideTable("orders", ["guest_id", "item"], RIGHT_SAMPLE, ["guest_id", "item"])}
            </div>

            <div class="join-visual__arrow" aria-hidden="true">↓</div>

            <table class="join-visual__table join-visual__result">
                <thead><tr><th>name</th><th>item</th></tr></thead>
                <tbody>${rows
                    .map(
                        row => `
                        <tr class="join-visual__row join-visual__row--${row.state}">
                            <td>${cell(row.left ? row.left.name : null)}</td>
                            <td>${cell(row.right ? row.right.item : null)}</td>
                        </tr>`
                    )
                    .join("")}</tbody>
            </table>

            <figcaption>${CAPTIONS[kind] || ""}</figcaption>
        </figure>
    `;
}
