import { escapeHtml, renderInline } from "../../utils/textFormat.js";
import { renderRich } from "../../sql/richText.js";
import { highlightDiagramHtml } from "../highlight.js";
import { highlightSqlHtml } from "../../sql/highlight.js";

export function renderStory(lesson) {
    return `
        <section class="sql-story" aria-label="Сюжет">
            <div class="sql-story__label">Из проекта</div>
            ${renderRich(lesson.story)}
        </section>
    `;
}

/* Подсветка по языку: Mermaid, PlantUML, SQL или простой текст. */
export function highlightCode(code, lang = "mermaid") {
    if (lang === "sql") {
        return highlightSqlHtml(code);
    }

    if (lang === "mermaid" || lang === "plantuml") {
        return highlightDiagramHtml(code, { lang });
    }

    return escapeHtml(code);
}

/*
 * Место для рисунка и редактора. Один и тот же вид у «попробуйте сами»,
 * у задачи и у песочницы: слева текст, справа картинка.
 */
export function renderBench({ id, kind, label = "Текст диаграммы" }) {
    return `
        <div class="dg-bench" data-bench="${escapeHtml(id)}" data-kind="${escapeHtml(kind)}">
            <div class="dg-bench__side">
                <div class="dg-bench__label">${escapeHtml(label)}</div>
                <div class="sql-editor dg-editor" data-editor></div>
            </div>
            <div class="dg-bench__side">
                <div class="dg-bench__label">Картинка</div>
                <div class="dg-preview" data-preview aria-live="polite"><p class="dg-preview__empty">Рисую…</p></div>
                <div class="dg-bench__error" data-bench-error hidden role="alert"></div>
            </div>
        </div>
    `;
}

function renderFigure(block) {
    return `
        <figure class="dg-figure" data-diagram-code="${escapeHtml(block.code)}" data-diagram-kind="${escapeHtml(block.kind)}">
            ${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ""}
            <div class="dg-figure__body">
                <pre class="sql-code dg-code"><code>${highlightDiagramHtml(block.code)}</code></pre>
                <div class="dg-figure__picture" data-figure-picture><p class="dg-preview__empty">Рисую…</p></div>
            </div>
            <div class="dg-figure__actions">
                <button type="button" class="sql-button sql-button--ghost sql-button--small" data-diagram-sandbox>Открыть в песочнице</button>
            </div>
        </figure>
    `;
}

function renderCodeBlock(block) {
    return `
        <figure class="dg-codeblock">
            ${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ""}
            <pre class="sql-code dg-code"><code>${highlightCode(block.code, block.lang)}</code></pre>
        </figure>
    `;
}

function renderSplit(block) {
    const side = item => `
        <div class="dg-split__side">
            <div class="dg-split__title">${escapeHtml(item.title)}</div>
            <pre class="sql-code dg-code"><code>${highlightCode(item.code, item.lang)}</code></pre>
        </div>`;

    return `<div class="dg-split">${side(block.left)}${side(block.right)}</div>`;
}

export function renderCompare(block) {
    return `
        <div class="dg-table-wrap">
            <table class="dg-table">
                ${block.caption ? `<caption>${escapeHtml(block.caption)}</caption>` : ""}
                <thead><tr>${block.head.map(cell => `<th>${renderInline(cell)}</th>`).join("")}</tr></thead>
                <tbody>
                    ${block.rows
                        .map(row => `<tr>${row.map((cell, index) => (index === 0 ? `<th scope="row">${renderInline(cell)}</th>` : `<td>${renderInline(cell)}</td>`)).join("")}</tr>`)
                        .join("")}
                </tbody>
            </table>
        </div>
    `;
}

function renderSteps(block) {
    return `
        <div class="dg-steps">
            ${block.title ? `<div class="dg-steps__title">${escapeHtml(block.title)}</div>` : ""}
            <ol>
                ${block.items
                    .map(
                        item => `
                    <li>
                        <strong>${escapeHtml(item.title)}</strong>
                        <p>${renderInline(item.text)}</p>
                    </li>`
                    )
                    .join("")}
            </ol>
        </div>
    `;
}

/* Нотация Чена: прямоугольник, ромб, прямоугольник, овал. Рисунок статичный. */
export function renderChen() {
    return `
        <figure class="dg-chen">
            <figcaption>Та же связь в нотации Чена</figcaption>
            <svg viewBox="0 0 600 170" role="img" aria-label="Схема в нотации Чена: гость, связь «делает», бронь; у гостя 1, у брони N; у гостя атрибут «имя»">
                <ellipse class="dg-chen__oval" cx="90" cy="30" rx="55" ry="20"></ellipse>
                <text x="90" y="35" text-anchor="middle">full_name</text>
                <line class="dg-chen__line" x1="90" y1="50" x2="90" y2="88"></line>

                <rect class="dg-chen__box" x="30" y="88" width="120" height="50" rx="4"></rect>
                <text x="90" y="118" text-anchor="middle">GUEST</text>

                <line class="dg-chen__line" x1="150" y1="113" x2="235" y2="113"></line>
                <text x="190" y="104" text-anchor="middle" class="dg-chen__card">1</text>

                <polygon class="dg-chen__diamond" points="300,68 365,113 300,158 235,113"></polygon>
                <text x="300" y="118" text-anchor="middle">делает</text>

                <line class="dg-chen__line" x1="365" y1="113" x2="450" y2="113"></line>
                <text x="410" y="104" text-anchor="middle" class="dg-chen__card">N</text>

                <rect class="dg-chen__box" x="450" y="88" width="120" height="50" rx="4"></rect>
                <text x="510" y="118" text-anchor="middle">BOOKING</text>
            </svg>
        </figure>
    `;
}

function renderBlock(block, index, context) {
    switch (block.type) {
        case "text":
            return `<div class="sql-text">${renderRich(block.text)}</div>`;

        case "why":
            return `
                <aside class="sql-why">
                    <div class="sql-why__title">${escapeHtml(block.title ? `Зачем: ${block.title}` : "Зачем это нужно")}</div>
                    ${renderRich(block.text)}
                </aside>`;

        case "trap":
            return `
                <aside class="sql-trap">
                    <div class="sql-trap__title">${escapeHtml(block.title ? `Ловушка: ${block.title}` : "Ловушка")}</div>
                    ${renderRich(block.text)}
                </aside>`;

        case "diagram":
            return renderFigure(block);

        case "tryit":
            context.tryits.push({ id: `tryit-${index}`, kind: block.kind, code: block.code });
            return renderBench({ id: `tryit-${index}`, kind: block.kind, label: "Измените текст" });

        case "code":
            return renderCodeBlock(block);

        case "split":
            return renderSplit(block);

        case "compare":
            return renderCompare(block);

        case "steps":
            return renderSteps(block);

        case "chen":
            return renderChen();

        default:
            return "";
    }
}

export function renderTheory(lesson) {
    const context = { tryits: [] };
    const html = lesson.theory.map((block, index) => renderBlock(block, index, context)).join("");

    return {
        html: `<section class="sql-theory" aria-label="Теория">${html}</section>`,
        tryits: context.tryits
    };
}
