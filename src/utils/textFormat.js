/*
 * Функции для превращения текста уроков в безопасный HTML.
 *
 * Главное правило: сначала разбираем СЫРОЙ текст на части
 * (ключи, строки, числа), и только потом экранируем каждую часть.
 * Так спецсимволы (например, апостроф) никогда не ломают разметку.
 */

export function escapeHtml(text = "") {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


export function renderInline(text = "") {
    let result = escapeHtml(text);

    result = result.replace(
        /`([^`]+)`/g,
        '<code class="inline-code">$1</code>'
    );

    result = result.replace(
        /\*\*([^*]+)\*\*/g,
        "<strong>$1</strong>"
    );

    return result;
}


/* =========================================================
   Подсветка кода
   ========================================================= */

function span(className, rawText) {
    return `<span class="${className}">${escapeHtml(rawText)}</span>`;
}


/*
 * Общий помощник: проходит по сырому тексту регулярным выражением,
 * найденные части оформляет через render(), всё остальное
 * просто экранирует.
 */
function tokenize(text, regex, render) {
    let result = "";
    let position = 0;

    for (const match of text.matchAll(regex)) {
        result += escapeHtml(text.slice(position, match.index));
        result += render(match);
        position = match.index + match[0].length;
    }

    return result + escapeHtml(text.slice(position));
}


function highlightJson(text) {
    return tokenize(
        text,
        /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)/g,
        match => {
            const [, string, colon, keyword, number] = match;

            if (string !== undefined) {
                return span(
                    colon ? "code-key" : "code-string",
                    string
                ) + escapeHtml(colon || "");
            }

            if (keyword !== undefined) {
                return span("code-value", keyword);
            }

            return span("code-number", number);
        }
    );
}


const SQL_KEYWORDS =
    "SELECT|FROM|LEFT JOIN|RIGHT JOIN|INNER JOIN|FULL JOIN|JOIN|ON|" +
    "WHERE|AND|OR|GROUP BY|ORDER BY|INSERT INTO|VALUES|UPDATE|SET|" +
    "DELETE FROM";

function highlightSql(text) {
    const regex = new RegExp(
        `('(?:''|[^'])*')|\\b(${SQL_KEYWORDS})\\b|\\b(\\d+)\\b`,
        "gi"
    );

    return tokenize(text, regex, match => {
        const [, string, keyword, number] = match;

        if (string !== undefined) {
            return span("code-string", string);
        }

        if (keyword !== undefined) {
            return span("code-sql-keyword", keyword);
        }

        return span("code-number", number);
    });
}


function highlightYaml(text) {
    return text
        .split("\n")
        .map(line => {
            if (/^\s*#/.test(line)) {
                return span("code-comment", line);
            }

            const match = line.match(/^(\s*)([^:#\n]+)(:)(.*)$/);

            if (!match) {
                return escapeHtml(line);
            }

            const [, indentation, key, colon, value] = match;

            let styledValue = escapeHtml(value);

            if (value.trim().startsWith("#")) {
                styledValue = span("code-comment", value);
            } else if (value.trim() !== "") {
                styledValue = span("code-string", value);
            }

            return (
                escapeHtml(indentation) +
                span("code-key", key) +
                escapeHtml(colon) +
                styledValue
            );
        })
        .join("\n");
}


export function highlightCode(text, language = "yaml") {
    const code = String(text || "");

    if (language === "json") {
        return highlightJson(code);
    }

    if (language === "sql") {
        return highlightSql(code);
    }

    return highlightYaml(code);
}


/* =========================================================
   Обычный текст уроков
   =========================================================

   Тексты в уроках пишутся «как есть», с переносами строк.
   Нужно понять, где обычный абзац, где список, а где пример кода
   или схема, у которых нельзя терять переносы и отступы.
   ========================================================= */

const CYRILLIC = /[А-Яа-яЁё]/;

/* key: value   /   - key: value   /   - key: */
const YAML_KEY = /^(-\s+)?[\w$'"/{}.\-]+:(\s.*)?$/;

/* GET /users, POST /users/{id} */
const HTTP_LINE = /^[A-Z]+\s+\/\S*$/;

/* одно «слово»: users, application/json, '#/components/schemas/User' */
const TOKEN = /^[\w$'"/{}.\-#:?=&]+$/;


function isCodeLine(line) {
    if (CYRILLIC.test(line)) {
        return false;
    }

    return (
        YAML_KEY.test(line) ||
        HTTP_LINE.test(line) ||
        TOKEN.test(line) ||
        /^-\s+\S/.test(line) ||
        line === "..."
    );
}


function isShortTerm(line) {
    return line.length <= 32 && !/[.,;!?]$/.test(line);
}


/*
 * Убирает общий левый отступ, но сохраняет отступы
 * между строками (дерево YAML остаётся деревом).
 */
export function dedentText(text) {
    const lines = String(text || "").split("\n");

    while (lines.length && !lines[0].trim()) {
        lines.shift();
    }

    while (lines.length && !lines[lines.length - 1].trim()) {
        lines.pop();
    }

    if (!lines.length) {
        return "";
    }

    return dedent(lines);
}


function dedent(rawLines) {
    const indents = rawLines
        .filter(line => line.trim())
        .map(line => line.match(/^\s*/)[0].length);

    const common = Math.min(...indents);

    return rawLines
        .map(line => line.slice(common).replace(/\s+$/, ""))
        .join("\n");
}


function renderSnippet(code, plain = false) {
    const language = /^\s*[{[]/.test(code) ? "json" : "yaml";

    return `
        <pre class="theory-snippet"><code>${
            plain
                ? escapeHtml(code)
                : highlightCode(code, language)
        }</code></pre>
    `;
}


function renderList(lines) {
    return `
        <ul class="theory-list">
            ${lines
                .map(line => `
                    <li>
                        ${renderInline(line.replace(/^[-•]\s+/, ""))}
                    </li>
                `)
                .join("")}
        </ul>
    `;
}


export function classifyBlock(rawLines) {
    const lines = rawLines.map(line => line.trim());

    /* список: каждая строка начинается с «- » или «• » */
    if (
        lines.every(
            line =>
                line.startsWith("- ") ||
                line.startsWith("• ")
        )
    ) {
        return "list";
    }

    /* схема со стрелками */
    if (lines.length >= 2 && lines.includes("↓")) {
        return "diagram";
    }

    /* пример кода: все строки похожи на YAML / HTTP / слова */
    if (lines.length >= 2 && lines.every(isCodeLine)) {
        return "code";
    }

    /* перечень коротких терминов, по одному в строке */
    if (lines.length >= 3 && lines.every(isShortTerm)) {
        return "terms";
    }

    /* одна короткая строка без русских слов: путь, ключ, метод */
    if (
        lines.length === 1 &&
        !CYRILLIC.test(lines[0]) &&
        lines[0].length <= 80 &&
        !/^[A-Z][a-z]+:$/.test(lines[0]) &&
        (
            isCodeLine(lines[0]) ||
            lines[0].startsWith("/")
        )
    ) {
        return "code";
    }

    return "paragraph";
}


function renderBlock(rawLines) {
    const kind = classifyBlock(rawLines);
    const lines = rawLines.map(line => line.trim());

    if (kind === "list" || kind === "terms") {
        return renderList(lines);
    }

    if (kind === "diagram") {
        return renderSnippet(dedent(rawLines), true);
    }

    if (kind === "code") {
        return renderSnippet(dedent(rawLines));
    }

    return `
        <p class="theory-paragraph">
            ${renderInline(lines.join(" "))}
        </p>
    `;
}


export function renderText(text) {
    if (!text) {
        return "";
    }

    /*
     * Можно явно выделить код тройными кавычками:
     *
     * ```yaml
     * paths:
     *   /users:
     * ```
     */
    const parts = String(text).split(/^[ \t]*```[a-z]*[ \t]*$/m);

    return parts
        .map((part, index) => {
            if (index % 2 === 1) {
                const lines = part
                    .split("\n")
                    .filter((line, i, all) =>
                        line.trim() || (i > 0 && i < all.length - 1)
                    );

                return renderSnippet(dedent(lines));
            }

            return part
                .trim()
                .split(/\n\s*\n/)
                .map(block =>
                    block
                        .split("\n")
                        .filter(line => line.trim())
                )
                .filter(lines => lines.length > 0)
                .map(renderBlock)
                .join("");
        })
        .join("");
}
