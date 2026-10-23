import { checkHeader, meaningfulLines } from "./text.js";

/*
 * Разбор подмножества Mermaid для sequence-диаграмм: участники, сообщения,
 * блоки alt/opt/loop/par/critical/break, заметки, активации.
 *
 * Результат (как и у ER): errors, warnings, unknown, model.
 * model = { participants: [{ id, label, actor }], events: [...] }, где событие —
 *   { type: "message", from, to, arrow, kind, text, activate, deactivate, line }
 *   { type: "block", kind, label, branches: [{ label, events }], line }
 *   { type: "note", position, targets, text, line }
 *   { type: "activation", on: true | false, target, line }
 */

/* Вид стрелки: что она значит для читателя диаграммы. */
export const ARROWS = {
    "->>": "sync",
    "-->>": "reply",
    "-)": "async",
    "--)": "async-reply",
    "-x": "lost",
    "--x": "lost-reply",
    "->": "line",
    "-->": "dotted-line"
};

const ARROW_LIST = ["-->>", "->>", "--x", "-x", "--)", "-)", "-->", "->"];
const MESSAGE = /^(.+?)\s*(-->>|->>|--x|-x|--\)|-\)|-->|->)\s*([+-])?\s*([^:]+?)\s*(?::\s*(.*))?$/;
const PARTICIPANT = /^(participant|actor)\s+(.+?)(?:\s*@\{.*\})?(?:\s+as\s+(.+))?$/;
const BLOCK_START = /^(alt|opt|loop|par|critical|break|rect)\b\s*(.*)$/;
const BRANCH_WORD = { alt: "else", par: "and", critical: "option" };
const NOTE = /^note\s+(right of|left of|over)\s+([^:]+?)\s*:\s*(.*)$/i;
const ACTIVATION = /^(activate|deactivate)\s+(.+)$/;
const IGNORED = /^(autonumber|title|accTitle|accDescr|box|links?|properties|details|create|destroy|end box)\b/;

export function parseSequence(text) {
    const lines = meaningfulLines(text);
    const errors = [];
    const warnings = [];
    const unknown = [];
    const model = { participants: [], events: [] };
    const header = checkHeader(lines, "sequenceDiagram");

    if (header) {
        return { kind: "sequence", ok: false, errors: [header], warnings, unknown, model };
    }

    const byId = new Map();

    function participant(rawId, label = null, actor = false) {
        const id = rawId.trim();
        let found = byId.get(id.toLowerCase());

        if (!found) {
            found = { id, label: id, actor: false };
            byId.set(id.toLowerCase(), found);
            model.participants.push(found);
        }

        if (label) {
            found.label = label.trim();
        }

        if (actor) {
            found.actor = true;
        }

        return found;
    }

    /* стек открытых блоков; в корне лежит «ветка» верхнего уровня */
    const stack = [{ kind: "root", branches: [{ label: "", events: model.events }], block: null }];
    const top = () => stack[stack.length - 1];
    const emit = event => top().branches[top().branches.length - 1].events.push(event);

    for (const { line, text: row } of lines.slice(1)) {
        const declared = row.match(PARTICIPANT);

        if (declared) {
            participant(declared[2], declared[3] || null, declared[1] === "actor");
            continue;
        }

        const blockStart = row.match(BLOCK_START);

        if (blockStart) {
            const block = { type: "block", kind: blockStart[1], label: blockStart[2].trim(), branches: [{ label: blockStart[2].trim(), events: [] }], line };

            if (blockStart[1] !== "rect") {
                emit(block);
            }

            stack.push({ kind: blockStart[1], branches: block.branches, block });
            continue;
        }

        const branchWord = BRANCH_WORD[top().kind];
        const branchMatch = row.match(/^(else|and|option)\b\s*(.*)$/);

        if (branchMatch) {
            if (!branchWord || branchMatch[1] !== branchWord) {
                errors.push({
                    code: "bad-branch",
                    line,
                    message: top().kind === "root"
                        ? `Строка ${line}: «${branchMatch[1]}» стоит вне блока. Ветка бывает только внутри alt, par или critical.`
                        : `Строка ${line}: в блоке «${top().kind}» разделитель называется «${branchWord || "—"}», а не «${branchMatch[1]}».`
                });
                continue;
            }

            top().branches.push({ label: branchMatch[2].trim(), events: [] });
            continue;
        }

        if (row === "end") {
            if (stack.length === 1) {
                errors.push({ code: "stray-end", line, message: `Строка ${line}: «end» закрывает блок, а открытых блоков нет.` });
            } else {
                stack.pop();
            }

            continue;
        }

        const note = row.match(NOTE);

        if (note) {
            const targets = note[2].split(",").map(item => participant(item).id);

            emit({ type: "note", position: note[1].toLowerCase(), targets, text: note[3].trim(), line });
            continue;
        }

        const activation = row.match(ACTIVATION);

        if (activation) {
            emit({ type: "activation", on: activation[1] === "activate", target: participant(activation[2]).id, line });
            continue;
        }

        if (IGNORED.test(row)) {
            continue;
        }

        const message = row.match(MESSAGE);

        if (message) {
            const [, from, arrow, sign, to, body] = message;

            if (body === undefined) {
                errors.push({
                    code: "message-text",
                    line,
                    message: `Строка ${line}: у сообщения должен быть текст после двоеточия, например «Гость->>Сайт: Хочу номер».`
                });
            }

            emit({
                type: "message",
                from: participant(from).id,
                to: participant(to).id,
                arrow,
                kind: ARROWS[arrow],
                text: (body || "").trim(),
                activate: sign === "+",
                deactivate: sign === "-",
                line
            });
            continue;
        }

        if (ARROW_LIST.some(arrow => row.includes(arrow)) || /[-=]{1,2}[>)x]/.test(row)) {
            errors.push({
                code: "bad-arrow",
                line,
                message: `Строка ${line}: стрелка записана неверно. Бывают ->> (запрос), -->> (ответ), -) (асинхронно).`
            });
            continue;
        }

        unknown.push({ line, text: row });
    }

    if (stack.length > 1) {
        const open = top();

        errors.push({
            code: "unclosed-block",
            line: open.block.line,
            message: `Блок «${open.kind}» (строка ${open.block.line}) не закрыт: в конце нужна строка «end».`
        });
    }

    if (/[^\x00-\x7f]/.test(model.participants.map(item => item.id).join(""))) {
        warnings.push({
            code: "non-ascii-id",
            line: 0,
            message: "Идентификаторы участников пишите латиницей, а русское название — после «as»: «participant G as Гость»."
        });
    }

    return { kind: "sequence", ok: errors.length === 0, errors, warnings, unknown, model };
}
