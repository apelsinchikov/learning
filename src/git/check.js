import { fillPlain } from "./markup.js";

/*
 * Проверка вставленного вывода команды.
 *
 * Шаблон — регулярное выражение (без учёта регистра). Git пишет на языке системы, поэтому
 * в шаблонах стоят оба варианта: «On branch|На ветке». В шаблоне можно написать
 * {{login}} или {{repo}}: подставится значение ученика. Если значения нет, подойдёт любое.
 */

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function buildPattern(source, profile = {}) {
    const text = source.replace(/\{\{(login|repo|name|email)\}\}/g, (_, token) => {
        const value = profile[token];

        return value ? escapeRegex(value) : token === "email" ? "\\S+@\\S+" : "[\\w.-]+";
    });

    return new RegExp(text, "i");
}

/*
 * patterns: [{ re, hint }]. Возвращает { ok, missing: [hint, ...] }.
 * Пустой ввод никогда не проходит.
 */
export function checkOutput(output, patterns = [], profile = {}) {
    const text = String(output || "").trim();

    if (!text) {
        return { ok: false, missing: ["Вставьте вывод команды в поле."] };
    }

    const missing = patterns.filter(pattern => !buildPattern(pattern.re, profile).test(text)).map(pattern => pattern.hint);

    return { ok: missing.length === 0, missing };
}

export { fillPlain };
