import { escapeHtml, renderInline } from "../utils/textFormat.js";

/*
 * Текст уроков: абзацы разделены пустой строкой, список — строки с «- ».
 * `код` и **жирный** превращаются в разметку. Всё остальное экранируется.
 */
export function renderRich(text = "") {
    const blocks = String(text)
        .trim()
        .split(/\n\s*\n/)
        .map(block => block.split("\n").map(line => line.trim()).filter(Boolean))
        .filter(lines => lines.length > 0);

    return blocks
        .map(lines => {
            if (lines.every(line => line.startsWith("- "))) {
                return `<ul class="sql-list">${lines
                    .map(line => `<li>${renderInline(line.slice(2))}</li>`)
                    .join("")}</ul>`;
            }

            return `<p>${renderInline(lines.join(" "))}</p>`;
        })
        .join("");
}

export { escapeHtml };
