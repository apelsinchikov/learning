import { escapeHtml } from "../utils/textFormat.js";

/*
 * Подсветка текста диаграмм (Mermaid, а в уроке-мосте ещё и PlantUML).
 * Один разбор служит и для кусков кода в теории, и для редактора CodeMirror.
 */

const KEYWORDS = new Set(
    (
        "erdiagram sequencediagram participant actor as alt else opt loop par and end critical option " +
        "break rect note over of left right activate deactivate autonumber title flowchart graph direction " +
        "@startuml @enduml entity entity skinparam"
    ).split(" ")
);

const KEYS = new Set(["PK", "FK", "UK"]);

const OPERATOR = /^(?:[|}o]{1,2}(?:--|\.\.)[|o{]{1,2}|-{1,2}>{1,2}|-{1,2}[)x]|<-{1,2}|\.\.>|\|\|)/;

const TOKEN =
    /(%%[^\n]*)|("[^"\n]*"?)|(@?[A-Za-z_][\w@]*)|(\s+)|([\s\S])/g;

/* Разбирает текст на части: { type, text }. Склеив text, получим исходный текст. */
export function tokenizeDiagram(text, { lang = "mermaid" } = {}) {
    const source = String(text || "");
    const tokens = [];
    let position = 0;

    while (position < source.length) {
        const rest = source.slice(position);
        const operator = rest.match(OPERATOR);

        if (operator) {
            tokens.push({ type: "operator", text: operator[0] });
            position += operator[0].length;
            continue;
        }

        if (lang === "plantuml" && /^'[^\n]*/.test(rest) && (position === 0 || source[position - 1] === "\n")) {
            const comment = rest.match(/^'[^\n]*/)[0];

            tokens.push({ type: "comment", text: comment });
            position += comment.length;
            continue;
        }

        TOKEN.lastIndex = 0;

        const match = TOKEN.exec(rest);
        const [piece, comment, string, word, space] = match;

        if (comment && lang === "mermaid") {
            tokens.push({ type: "comment", text: piece });
        } else if (string) {
            tokens.push({ type: "string", text: piece });
        } else if (word) {
            if (KEYS.has(word)) {
                tokens.push({ type: "key", text: piece });
            } else if (KEYWORDS.has(word.toLowerCase())) {
                tokens.push({ type: "keyword", text: piece });
            } else {
                tokens.push({ type: "name", text: piece });
            }
        } else if (space) {
            tokens.push({ type: "space", text: piece });
        } else {
            tokens.push({ type: "punct", text: piece });
        }

        position += piece.length;
    }

    return tokens;
}

const CLASS = {
    comment: "sql-tok-comment",
    string: "sql-tok-string",
    keyword: "sql-tok-keyword",
    key: "dg-tok-key",
    operator: "dg-tok-operator"
};

export function highlightDiagramHtml(text, options) {
    return tokenizeDiagram(text, options)
        .map(token =>
            CLASS[token.type]
                ? `<span class="${CLASS[token.type]}">${escapeHtml(token.text)}</span>`
                : escapeHtml(token.text)
        )
        .join("");
}

/* Разбор для CodeMirror (StreamLanguage вызывает token(stream) по одному куску). */
export const diagramStreamParser = {
    name: "mermaid",

    token(stream) {
        if (stream.eatSpace()) {
            return null;
        }

        if (stream.match("%%")) {
            stream.skipToEnd();
            return "comment";
        }

        if (stream.peek() === '"') {
            stream.next();

            while (!stream.eol()) {
                if (stream.next() === '"') {
                    break;
                }
            }

            return "string";
        }

        if (stream.match(OPERATOR)) {
            return "operator";
        }

        if (stream.match(/^@?[A-Za-z_][\w@]*/)) {
            const word = stream.current();

            if (KEYS.has(word)) {
                return "variableName.special";
            }

            return KEYWORDS.has(word.toLowerCase()) ? "keyword" : null;
        }

        stream.next();
        return null;
    }
};
