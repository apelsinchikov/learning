import { renderRich } from "../sql/richText.js";
import { escapeHtml } from "../utils/textFormat.js";

/*
 * Разметка уроков курса «Git и проект».
 *
 *   {{login}} {{repo}} {{name}} {{email}} — значения из «Мой проект». Пока значения нет,
 *       показывается заготовка. Элемент помечен data-token, поэтому при вводе значения
 *       страница не перерисовывается: меняется только текст.
 *   [[key:mod+shift+p]] — сочетание клавиш для Mac и для Windows. Показываются оба
 *       варианта, лишний прячет CSS по data-os.
 *
 * В командах значения name и email берутся в одинарные кавычки: автор пишет кавычки сам
 * ('{{name}}'), а курс экранирует одинарную кавычку внутри значения.
 */

export const TOKENS = {
    login: "<ваш-логин>",
    repo: "<имя-репозитория>",
    name: "<Ваше Имя>",
    email: "<ваша-почта>"
};

const TOKEN_RE = /\{\{(login|repo|name|email)\}\}/g;

/* Значение для вставки в командную строку внутри одинарных кавычек. */
export function shellEscape(value) {
    return String(value).replace(/'/g, "'\\''");
}

export function tokenText(token, profile, context = "text") {
    const value = profile?.[token] ?? "";

    if (!value) {
        return TOKENS[token];
    }

    return context === "cmd" && (token === "name" || token === "email") ? shellEscape(value) : value;
}

function tokenHtml(token, profile, context) {
    const filled = Boolean(profile?.[token]);

    return `<span class="git-val${filled ? "" : " git-val--empty"}" data-token="${token}" data-ctx="${context}">${escapeHtml(tokenText(token, profile, context))}</span>`;
}

/* Подстановка в уже безопасный HTML. */
export function fillTokens(html, profile, context = "text") {
    return html.replace(TOKEN_RE, (_, token) => tokenHtml(token, profile, context));
}

/* Для проверки и копирования: чистый текст без разметки. */
export function fillPlain(text, profile, context = "cmd") {
    return String(text).replace(TOKEN_RE, (_, token) => tokenText(token, profile, context));
}

/* ---------------- клавиши ---------------- */

const MAC_KEYS = { ctrl: "⌃", alt: "⌥", shift: "⇧", mod: "⌘", enter: "↵", tab: "⇥", esc: "⎋", space: "Space", backtick: "`" };
const WIN_KEYS = { ctrl: "Ctrl", alt: "Alt", shift: "Shift", mod: "Ctrl", enter: "Enter", tab: "Tab", esc: "Esc", space: "Space", backtick: "`" };
const MAC_ORDER = ["ctrl", "alt", "shift", "mod"];

export function keyLabel(spec, os) {
    const parts = String(spec).toLowerCase().split("+").filter(Boolean);
    const key = parts.filter(part => !MAC_ORDER.includes(part));
    const modifiers = parts.filter(part => MAC_ORDER.includes(part));
    const upper = value => (value.length === 1 ? value.toUpperCase() : (os === "mac" ? MAC_KEYS : WIN_KEYS)[value] || value.toUpperCase());

    if (os === "mac") {
        const ordered = MAC_ORDER.filter(item => modifiers.includes(item)).map(item => MAC_KEYS[item]);

        return ordered.join("") + key.map(upper).join("");
    }

    return [...modifiers.map(item => WIN_KEYS[item]), ...key.map(upper)].join("+");
}

export function renderKeys(spec) {
    return `<kbd class="git-key"><span class="git-os git-os--mac">${escapeHtml(keyLabel(spec, "mac"))}</span><span class="git-os git-os--windows">${escapeHtml(keyLabel(spec, "windows"))}</span></kbd>`;
}

/* Обычный текст урока: разметка курсов + значения + клавиши. */
export function renderGitRich(text = "", profile = {}) {
    return fillTokens(renderRich(text), profile, "text").replace(/\[\[key:([a-z+]+)\]\]/g, (_, spec) => renderKeys(spec));
}

/* Одна строка без абзацев (заголовки, подписи). */
export function renderGitInline(text = "", profile = {}) {
    return renderGitRich(text, profile).replace(/^<p>|<\/p>$/g, "");
}
