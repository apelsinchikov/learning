import { checkHeader, meaningfulLines } from "./text.js";

/*
 * Разбор подмножества Mermaid для ER-диаграмм: сущности, атрибуты, ключи, связи.
 *
 * Мы разбираем структуру сами, а не берём её из Mermaid: так проверка не зависит
 * от внутреннего устройства библиотеки. Mermaid отвечает за картинку и за
 * окончательное решение «синтаксис верный или нет».
 *
 * Результат:
 *   errors  — то, что Mermaid точно не примет (с понятным текстом);
 *   warnings — места, которые Mermaid, возможно, не примет (объясняем, если он действительно упал);
 *   unknown — строки, которые мы не умеем разбирать (не ошибка, просто не проверяем);
 *   model   — { entities: { имя: { name, attrs[] } }, relations[] }
 */

const NAME = String.raw`"[^"]+"|[A-Za-z_][\w-]*`;

/* Что значит значок рядом с сущностью: сколько таких сущностей на одну сущность с другого конца. */
export const LEFT_GLYPHS = { "|o": { min: 0, max: 1 }, "||": { min: 1, max: 1 }, "}o": { min: 0, max: "n" }, "}|": { min: 1, max: "n" } };
export const RIGHT_GLYPHS = { "o|": { min: 0, max: 1 }, "||": { min: 1, max: 1 }, "o{": { min: 0, max: "n" }, "|{": { min: 1, max: "n" } };

const RELATION = new RegExp(
    String.raw`^(${NAME})\s*(\|o|\|\||\}o|\}\|)(--|\.\.)(o\||\|\||o\{|\|\{)\s*(${NAME})\s*(?::\s*(.*))?$`
);
const LOOKS_LIKE_RELATION = /(--|\.\.)/;
const ENTITY_OPEN = new RegExp(String.raw`^(${NAME})\s*(?:\[[^\]]*\]\s*)?\{$`);
const IGNORED = /^(direction|classDef|class|style|click|accTitle|accDescr|title)\b/;
const KEYS = ["PK", "FK", "UK"];

const unquote = name => (name.startsWith('"') ? name.slice(1, -1) : name);

export function cardinalityText(card) {
    return `${card.min}..${card.max}`;
}

export function parseEr(text) {
    const lines = meaningfulLines(text);
    const errors = [];
    const warnings = [];
    const unknown = [];
    const model = { entities: {}, relations: [] };
    const header = checkHeader(lines, "erDiagram");

    if (header) {
        return { kind: "er", ok: false, errors: [header], warnings, unknown, model };
    }

    function ensureEntity(rawName) {
        const name = unquote(rawName);
        const key = name.toLowerCase();

        if (!model.entities[key]) {
            model.entities[key] = { name, attrs: [] };
        }

        return model.entities[key];
    }

    let current = null;

    for (const { line, text: row } of lines.slice(1)) {
        if (current) {
            if (row === "}") {
                current = null;
                continue;
            }

            const attr = parseAttribute(row);

            if (attr.error) {
                errors.push({ code: attr.error, line, message: `Строка ${line}: ${attr.message}` });
            } else {
                current.attrs.push(attr);
            }

            continue;
        }

        if (IGNORED.test(row)) {
            continue;
        }

        if (/[^\x00-\x7f]/.test(row.replace(/"[^"]*"/g, "").split(":")[0])) {
            warnings.push({
                code: "non-ascii",
                line,
                message: `Строка ${line}: имена сущностей и атрибутов пишите латиницей. Русский текст допустим в подписях связей, если взять их в кавычки.`
            });
        }

        const open = row.match(ENTITY_OPEN);

        if (open) {
            current = ensureEntity(open[1]);
            continue;
        }

        const relation = row.match(RELATION);

        if (relation) {
            const [, left, leftGlyph, dashes, rightGlyph, right, label] = relation;

            if (label === undefined || label.trim() === "") {
                errors.push({
                    code: "relation-label",
                    line,
                    message: `Строка ${line}: у связи должна быть подпись после двоеточия, например «: "делает"».`
                });
            }

            if (label && !/^"[^"]*"$/.test(label.trim()) && !/^[A-Za-z_][\w-]*$/.test(label.trim())) {
                warnings.push({
                    code: "label-quotes",
                    line,
                    message: `Строка ${line}: подпись из нескольких слов или не латиницей берите в кавычки, например «: "делает"».`
                });
            }

            ensureEntity(left);
            ensureEntity(right);

            model.relations.push({
                a: unquote(left),
                b: unquote(right),
                aCard: LEFT_GLYPHS[leftGlyph],
                bCard: RIGHT_GLYPHS[rightGlyph],
                identifying: dashes === "--",
                label: label === undefined ? "" : label.trim().replace(/^"|"$/g, "")
            });

            continue;
        }

        if (LOOKS_LIKE_RELATION.test(row) || /^\S+\s+[|}o][|o{}]/.test(row)) {
            errors.push({
                code: "bad-relation",
                line,
                message: `Строка ${line}: связь записана неверно. Нужен вид «ИМЯ1 ||--o{ ИМЯ2 : "подпись"»: значок кратности, две черты, значок кратности.`
            });
            continue;
        }

        /* сущность без атрибутов, просто имя на отдельной строке */
        if (new RegExp(`^(${NAME})$`).test(row)) {
            ensureEntity(row);
            continue;
        }

        unknown.push({ line, text: row });
    }

    if (current) {
        errors.push({
            code: "unclosed-entity",
            line: lines[lines.length - 1].line,
            message: `Блок сущности «${current.name}» не закрыт: в конце нужна строка «}».`
        });
    }

    return { kind: "er", ok: errors.length === 0, errors, warnings, unknown, model };
}

function parseAttribute(row) {
    let rest = row;
    let comment = "";
    const commentMatch = rest.match(/\s+"([^"]*)"\s*$/);

    if (commentMatch) {
        comment = commentMatch[1];
        rest = rest.slice(0, commentMatch.index);
    }

    const parts = rest.split(/\s+/);

    if (parts.length < 2) {
        return {
            error: "bad-attribute",
            message: "атрибут пишут как «тип имя», например «int id PK»."
        };
    }

    const [type, name, ...keyParts] = parts;
    const keys = keyParts
        .join(" ")
        .split(",")
        .map(part => part.trim())
        .filter(Boolean);

    for (const key of keys) {
        if (!KEYS.includes(key)) {
            const upper = key.toUpperCase();

            return {
                error: "bad-key",
                message: KEYS.includes(upper)
                    ? `ключ «${key}» пишется заглавными буквами: ${upper}.`
                    : `«${key}» не похоже на ключ. Бывают PK, FK и UK.`
            };
        }
    }

    return { type, name, keys, comment };
}
