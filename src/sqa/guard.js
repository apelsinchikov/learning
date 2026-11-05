/*
 * Защита песочницы. Каждый запуск выполняется внутри транзакции, которая всегда
 * откатывается, поэтому ученику нельзя завершать или открывать транзакции самому
 * и нельзя менять устройство сервера. Проверяем первое слово каждой команды
 * (текст в кавычках и комментарии при этом не учитываются).
 */

/* Разбирает текст на команды по «;», не заглядывая в строки, идентификаторы и комментарии. */
export function splitStatements(sql) {
    const text = String(sql || "");
    const statements = [];
    let current = "";
    let i = 0;

    const push = () => {
        statements.push(current);
        current = "";
    };

    while (i < text.length) {
        const char = text[i];
        const next = text[i + 1];

        if (char === "-" && next === "-") {
            const end = text.indexOf("\n", i);

            i = end === -1 ? text.length : end;
            current += " ";
        } else if (char === "/" && next === "*") {
            let depth = 1;

            i += 2;

            while (i < text.length && depth > 0) {
                if (text[i] === "/" && text[i + 1] === "*") {
                    depth++;
                    i += 2;
                } else if (text[i] === "*" && text[i + 1] === "/") {
                    depth--;
                    i += 2;
                } else {
                    i++;
                }
            }

            current += " ";
        } else if (char === "'" || char === '"') {
            const escapes = char === "'" && /[eE]$/.test(current) && !/[A-Za-z0-9_]/.test(current.slice(-2, -1) || " ");
            let j = i + 1;

            while (j < text.length) {
                if (escapes && text[j] === "\\") {
                    j += 2;
                } else if (text[j] === char && text[j + 1] === char) {
                    j += 2;
                } else if (text[j] === char) {
                    break;
                } else {
                    j++;
                }
            }

            current += "?";
            i = j + 1;
        } else if (char === "$") {
            const tag = /^\$[A-Za-z_]*\$/.exec(text.slice(i));

            if (tag) {
                const end = text.indexOf(tag[0], i + tag[0].length);

                current += "?";
                i = end === -1 ? text.length : end + tag[0].length;
            } else {
                current += char;
                i++;
            }
        } else if (char === ";") {
            push();
            i++;
        } else {
            current += char;
            i++;
        }
    }

    push();

    return statements.map(statement => statement.trim()).filter(Boolean);
}

const TRANSACTION = new Set(["begin", "start", "commit", "end", "rollback", "abort", "savepoint", "release"]);
const FORBIDDEN_FIRST = new Set([
    "copy",
    "set",
    "reset",
    "discard",
    "listen",
    "notify",
    "unlisten",
    "load",
    "vacuum",
    "checkpoint",
    "grant",
    "revoke",
    "do",
    "security"
]);
const FORBIDDEN_OBJECT = new Set(["extension", "role", "user", "group", "database", "tablespace", "system", "server", "language"]);

export const TRANSACTION_MESSAGE =
    "В песочнице транзакции не нужны: после каждого запуска все изменения откатываются сами. Уберите BEGIN, COMMIT и ROLLBACK.";
export const FORBIDDEN_MESSAGE = "Эта команда в песочнице отключена. Она меняет настройки базы, а не данные.";
export const EMPTY_MESSAGE = "Запрос пустой. Напишите команду и нажмите «Выполнить».";

export function checkSql(sql) {
    const statements = splitStatements(sql);

    if (statements.length === 0) {
        return { ok: false, error: EMPTY_MESSAGE };
    }

    for (const statement of statements) {
        const words = statement.toLowerCase().match(/[a-z_]+/g) || [];
        const [first = "", second = ""] = words;

        if (TRANSACTION.has(first)) {
            return { ok: false, error: TRANSACTION_MESSAGE, kind: "transaction" };
        }

        if (FORBIDDEN_FIRST.has(first)) {
            return { ok: false, error: FORBIDDEN_MESSAGE, kind: "forbidden" };
        }

        if (["create", "alter", "drop"].includes(first) && FORBIDDEN_OBJECT.has(second)) {
            return { ok: false, error: FORBIDDEN_MESSAGE, kind: "forbidden" };
        }
    }

    return { ok: true };
}
