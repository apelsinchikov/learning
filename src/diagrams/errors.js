import { closestWord } from "./parse/text.js";

/*
 * Ошибки Mermaid по-человечески. Mermaid пишет на английском и указывает место
 * через «line N». Мы берём номер строки, ищем свою подсказку к этому месту и,
 * если своей нет, объясняем общими словами.
 */

const KEYWORDS = {
    er: ["erDiagram"],
    sequence: ["sequenceDiagram", "participant", "actor", "alt", "else", "opt", "loop", "par", "and", "end", "Note", "activate", "deactivate", "autonumber"]
};

export function lineFromError(raw = "") {
    const match = String(raw).match(/line\s+(\d+)/i);

    return match ? Number(match[1]) : null;
}

function firstLines(raw) {
    return String(raw).split("\n").slice(0, 3).join(" ").trim();
}

/*
 * parsed — результат нашего разбора (errors и warnings с номерами строк),
 * text — текст ученика, kind — "er" или "sequence".
 */
export function humanizeDiagramError(raw, { kind, parsed = null, text = "" } = {}) {
    const message = String(raw || "");
    const line = lineFromError(message);

    /* Своя точная подсказка про это место (или про весь текст) надёжнее общих слов. */
    const own = parsed
        ? [...parsed.errors, ...parsed.warnings].find(item => item.line === line) ||
          parsed.errors[0] ||
          parsed.warnings[0] ||
          null
        : null;

    if (own) {
        return { title: "Mermaid не смог нарисовать диаграмму", text: own.message, line: own.line || line };
    }

    if (/no diagram type detected|UnknownDiagramError/i.test(message)) {
        return {
            title: "Не понял тип диаграммы",
            text:
                kind === "any"
                    ? "Первая строка должна называть тип диаграммы: erDiagram, sequenceDiagram, flowchart и так далее."
                    : `Первая строка должна быть «${kind === "sequence" ? "sequenceDiagram" : "erDiagram"}».`,
            line: 1
        };
    }

    if (line) {
        const row = String(text).replace(/\r\n?/g, "\n").split("\n")[line - 1] || "";
        const word = row.trim().split(/\s+/)[0] || "";
        const typo = word ? closestWord(word, KEYWORDS[kind] || []) : null;

        return {
            title: `Ошибка в строке ${line}`,
            text: typo && typo !== word
                ? `Mermaid не понял строку ${line}: «${row.trim()}». Возможно, «${word}» — опечатка в слове «${typo}».`
                : `Mermaid не понял строку ${line}: «${row.trim()}». Сверьте её с примером из теории: чаще всего не хватает двоеточия, кавычек или закрывающего «end» и «}».`,
            line
        };
    }

    return {
        title: "Mermaid не смог нарисовать диаграмму",
        text: "Проверьте, что нигде нет опечаток, все блоки закрыты и у связей и сообщений есть подпись после двоеточия.",
        line: null,
        details: firstLines(message)
    };
}
