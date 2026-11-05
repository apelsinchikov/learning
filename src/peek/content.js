import { escapeHtml } from "../utils/textFormat.js";
import { renderRich } from "../sql/richText.js";
import { highlightSqlHtml } from "../sql/highlight.js";

/*
 * Содержимое панели «Повторить»: урок другого курса в сжатом виде.
 *
 * Урок любого курса приводится к одной форме (normalizeLesson), а затем
 * рисуется без сюжета, задачи и кнопок «Выполнить»: панель только напоминает теорию.
 *
 *   { course, courseLabel, id, title, where, summary, cheat: [[a, b]], blocks: [...] }
 *   блоки: text | why | trap { text, title? } | code { text, lang, note? } | table { head, rows, caption? }
 */

const TEXT_BLOCKS = new Set(["text", "why", "trap"]);

function normalizeBlock(block) {
    if (TEXT_BLOCKS.has(block.type)) {
        return { type: block.type, text: block.text, title: block.title };
    }

    if (block.type === "example") {
        return { type: "code", lang: "sql", text: block.sql, note: block.note };
    }

    if (block.type === "code") {
        return { type: "code", lang: block.lang || "text", text: block.code ?? block.text, note: block.note };
    }

    if (block.type === "diagram") {
        return { type: "code", lang: "mermaid", text: block.code, note: block.caption };
    }

    if (block.type === "compare") {
        return { type: "table", head: block.head, rows: block.rows, caption: block.caption };
    }

    return null;
}

export function normalizeLesson({ course, courseLabel, lesson, chapter, number }) {
    return {
        course,
        courseLabel,
        id: lesson.id,
        title: lesson.title,
        where: `${chapter ? `Глава ${chapter.id} · ` : ""}Урок ${number}`,
        summary: lesson.summary || "",
        cheat: lesson.cheat || [],
        blocks: (lesson.theory || []).map(normalizeBlock).filter(Boolean)
    };
}

function renderCode(block) {
    const html = block.lang === "sql" ? highlightSqlHtml(block.text) : escapeHtml(block.text);

    return `
        <pre class="peek__code"><code>${html}</code></pre>
        ${block.note ? `<p class="peek__note">${escapeHtml(block.note)}</p>` : ""}
    `;
}

function renderBlock(block) {
    switch (block.type) {
        case "text":
            return `<div class="peek__text">${renderRich(block.text)}</div>`;

        case "why":
            return `<aside class="peek__why"><strong>${escapeHtml(block.title || "Зачем это нужно")}</strong>${renderRich(block.text)}</aside>`;

        case "trap":
            return `<aside class="peek__trap"><strong>Ловушка</strong>${renderRich(block.text)}</aside>`;

        case "code":
            return renderCode(block);

        case "table":
            return `
                <table class="sql-table peek__table">
                    ${block.caption ? `<caption>${escapeHtml(block.caption)}</caption>` : ""}
                    <thead><tr>${block.head.map(cell => `<th>${escapeHtml(cell)}</th>`).join("")}</tr></thead>
                    <tbody>${block.rows.map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody>
                </table>`;

        default:
            return "";
    }
}

/* Краткий вид: суть, шпаргалка и первый пример. */
export function renderQuick(lesson) {
    const why = lesson.blocks.find(block => block.type === "why");
    const firstCode = lesson.blocks.find(block => block.type === "code");

    return `
        <p class="peek__label">Коротко</p>
        <div class="peek__card">
            ${lesson.summary ? `<p>${escapeHtml(lesson.summary)}</p>` : ""}
            ${why ? renderRich(why.text) : ""}
        </div>
        ${
            lesson.cheat.length
                ? `<div class="peek__cheats">${lesson.cheat
                      .map(([code, meaning]) => `<div><code>${escapeHtml(code)}</code><span>${escapeHtml(meaning)}</span></div>`)
                      .join("")}</div>`
                : ""
        }
        ${firstCode ? `<p class="peek__label">Пример</p>${renderCode(firstCode)}` : ""}
    `;
}

/* Полный вид: вся теория урока, без сюжета и без задачи. */
export function renderFull(lesson) {
    return `<p class="peek__label">Теория целиком</p>${lesson.blocks.map(renderBlock).join("")}`;
}

export function renderPanel(lesson, { href, full = false, narrow = false } = {}) {
    return `
        <aside class="peek" data-peek-panel role="${narrow ? "dialog" : "complementary"}"${narrow ? ` aria-modal="true"` : ""} aria-label="Повторить: ${escapeHtml(lesson.title)}">
            <div class="peek__head">
                <div>
                    <div class="peek__from">Из курса «${escapeHtml(lesson.courseLabel)}» · ${escapeHtml(lesson.where)}</div>
                    <h2 class="peek__title">${escapeHtml(lesson.title)}</h2>
                </div>
                <button type="button" class="peek__close" data-peek-close aria-label="Закрыть">×</button>
            </div>
            <div class="peek__body">
                ${renderQuick(lesson)}
                <div class="peek__full" data-peek-full${full ? "" : " hidden"}>${renderFull(lesson)}</div>
            </div>
            <div class="peek__foot">
                <button type="button" class="peek__btn peek__btn--main" data-peek-full-toggle aria-expanded="${full}">${full ? "Скрыть урок целиком ▴" : "Показать урок целиком ▾"}</button>
                <a class="peek__btn" href="${escapeHtml(href)}" target="_blank" rel="noopener">Открыть в новой вкладке ↗</a>
            </div>
        </aside>
        <div class="peek-backdrop" data-peek-backdrop data-peek-close></div>
    `;
}

export function renderError(message) {
    return `
        <aside class="peek" data-peek-panel role="complementary" aria-label="Повторить">
            <div class="peek__head">
                <div><h2 class="peek__title">Не удалось открыть урок</h2></div>
                <button type="button" class="peek__close" data-peek-close aria-label="Закрыть">×</button>
            </div>
            <div class="peek__body"><p>${escapeHtml(message)}</p></div>
        </aside>
        <div class="peek-backdrop" data-peek-backdrop data-peek-close></div>
    `;
}
