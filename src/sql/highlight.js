import { escapeHtml } from "../utils/textFormat.js";

/*
 * Подсветка SQL. Один список слов служит и для HTML-примеров в теории,
 * и для редактора CodeMirror (через StreamLanguage).
 */

export const KEYWORDS = new Set(
    (
        "select from where and or not in between like ilike is null as distinct limit offset " +
        "order by group having join inner left right full outer cross on using union all " +
        "case when then else end asc desc exists true false with"
    ).split(" ")
);

export const FUNCTIONS = new Set(
    "count sum avg min max coalesce round length lower upper extract date_trunc cast now".split(" ")
);

const TOKEN =
    /(--[^\n]*)|('(?:''|[^'])*')|(\b\d+(?:\.\d+)?\b)|([A-Za-zА-Яа-яЁё_][\w]*)|(\s+)|([\s\S])/g;

/* Разбирает запрос на части: { type, text }. Склеив text, получим исходный запрос. */
export function tokenizeSql(sql) {
    const tokens = [];

    for (const match of String(sql || "").matchAll(TOKEN)) {
        const [text, comment, string, number, word, space] = match;

        if (comment) {
            tokens.push({ type: "comment", text });
        } else if (string) {
            tokens.push({ type: "string", text });
        } else if (number) {
            tokens.push({ type: "number", text });
        } else if (word) {
            const lower = word.toLowerCase();

            if (KEYWORDS.has(lower)) {
                tokens.push({ type: "keyword", text });
            } else if (FUNCTIONS.has(lower)) {
                tokens.push({ type: "function", text });
            } else {
                tokens.push({ type: "name", text });
            }
        } else if (space) {
            tokens.push({ type: "space", text });
        } else {
            tokens.push({ type: "punct", text });
        }
    }

    return tokens;
}

const CLASS = {
    comment: "sql-tok-comment",
    string: "sql-tok-string",
    number: "sql-tok-number",
    keyword: "sql-tok-keyword",
    function: "sql-tok-function"
};

export function highlightSqlHtml(sql) {
    return tokenizeSql(sql)
        .map(token =>
            CLASS[token.type]
                ? `<span class="${CLASS[token.type]}">${escapeHtml(token.text)}</span>`
                : escapeHtml(token.text)
        )
        .join("");
}

/*
 * Разбор для CodeMirror: StreamLanguage вызывает token(stream) по одному куску.
 * Возвращаем стандартные имена, которые понимает подсветка по умолчанию.
 */
export const sqlStreamParser = {
    name: "sql",

    token(stream) {
        if (stream.eatSpace()) {
            return null;
        }

        if (stream.match("--")) {
            stream.skipToEnd();
            return "comment";
        }

        if (stream.peek() === "'") {
            stream.next();

            while (!stream.eol()) {
                if (stream.next() === "'") {
                    if (stream.peek() === "'") {
                        stream.next();
                    } else {
                        break;
                    }
                }
            }

            return "string";
        }

        if (stream.match(/^\d+(\.\d+)?/)) {
            return "number";
        }

        if (stream.match(/^[A-Za-zА-Яа-яЁё_][\w]*/)) {
            const word = stream.current().toLowerCase();

            if (KEYWORDS.has(word)) {
                return "keyword";
            }

            return FUNCTIONS.has(word) ? "variableName.function" : null;
        }

        stream.next();
        return "operator";
    }
};
