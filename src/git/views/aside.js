import { escapeHtml } from "../../utils/textFormat.js";
import { gitLessons } from "../lessons/index.js";
import { MODES, OS_LIST, validators } from "../profile.js";

export const ASIDE_TABS = [
    { id: "project", label: "Мой проект" },
    { id: "cheat", label: "Шпаргалка" }
];

const FIELDS = [
    { key: "login", label: "Логин GitHub", placeholder: "например, anna-ivanova", hint: "Буквы, цифры и дефис. Тот, что после github.com/." },
    { key: "repo", label: "Имя репозитория", placeholder: "например, git-practice", hint: "Буквы, цифры, точка, дефис, подчёркивание." },
    { key: "name", label: "Ваше имя для коммитов", placeholder: "например, Анна Иванова", hint: "Так вас будут видеть в истории." },
    { key: "email", label: "Почта для коммитов", placeholder: "например, anna@example.com", hint: "Можно адрес вида 12345+логин@users.noreply.github.com, он есть в Settings → Emails." }
];

const OS_LABEL = { mac: "Mac", windows: "Windows" };
const MODE_LABEL = { terminal: "Терминал", vscode: "VS Code" };

/* Переключатели системы и способа работы. Их несколько на странице, поэтому состояние рисуется по data-атрибутам. */
export function renderToggles(profile, { compact = false } = {}) {
    const group = (name, label, list, labels) => `
        <div class="git-toggle" role="group" aria-label="${label}">
            <span class="git-toggle__label">${label}</span>
            ${list
                .map(
                    value => `
                <button type="button" class="git-toggle__btn${profile[name] === value ? " is-on" : ""}" data-set-${name}="${value}" aria-pressed="${profile[name] === value}">${labels[value]}</button>`
                )
                .join("")}
        </div>`;

    return `
        <div class="git-toggles${compact ? " git-toggles--compact" : ""}">
            ${group("os", "Система", OS_LIST, OS_LABEL)}
            ${group("mode", "Работаю через", MODES, MODE_LABEL)}
        </div>`;
}

export function renderField(field, profile, { inline = false } = {}) {
    const value = profile[field.key] || "";

    return `
        <label class="git-field${inline ? " git-field--inline" : ""}">
            <span class="git-field__label">${escapeHtml(field.label)}</span>
            <input type="text" class="git-field__input" data-field="${field.key}" value="${escapeHtml(value)}" placeholder="${escapeHtml(field.placeholder)}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-describedby="hint-${field.key}">
            <small id="hint-${field.key}" class="git-field__hint">${escapeHtml(field.hint)}</small>
        </label>`;
}

export const fieldByKey = key => FIELDS.find(field => field.key === key);

export function renderProfilePanel(profile) {
    return `
        <div class="git-profile">
            <p class="git-profile__lead">Введите свои значения один раз: курс подставит их в команды. Данные хранятся только в этом браузере.</p>
            ${FIELDS.map(field => renderField(field, profile)).join("")}
            ${renderToggles(profile)}
        </div>`;
}

export function collectCheats(progress) {
    return gitLessons
        .map((lesson, index) => ({ lesson, number: index + 1 }))
        .filter(({ lesson }) => progress.lessons?.[lesson.id]?.solved && lesson.cheat?.length)
        .map(({ lesson, number }) => ({ number, title: lesson.title, items: lesson.cheat }));
}

export function renderCheatSheet(progress) {
    const groups = collectCheats(progress);

    if (groups.length === 0) {
        return `
            <div class="sql-empty-state">
                <strong>Шпаргалка пуста</strong>
                <p>Команды появляются после выполненных уроков.</p>
            </div>`;
    }

    return `
        <div class="sql-cheats">
            ${groups
                .map(
                    group => `
                <section>
                    <h4>${group.number}. ${escapeHtml(group.title)}</h4>
                    <dl>
                        ${group.items.map(([code, meaning]) => `<dt><code>${escapeHtml(code)}</code></dt><dd>${escapeHtml(meaning)}</dd>`).join("")}
                    </dl>
                </section>`
                )
                .join("")}
        </div>`;
}

export function renderAsideBody(tab, progress, profile) {
    return tab === "cheat" ? renderCheatSheet(progress) : renderProfilePanel(profile);
}

export function renderAside(progress, profile, tab = "project") {
    return `
        <aside class="sql-aside" aria-label="Справка" id="git-aside">
            <div class="sql-tabs" role="tablist">
                ${ASIDE_TABS.map(
                    item => `
                    <button type="button" role="tab" class="sql-tab${item.id === tab ? " is-active" : ""}" aria-selected="${item.id === tab}" data-aside-tab="${item.id}">${item.label}</button>`
                ).join("")}
            </div>
            <div class="sql-aside__body" data-aside-body>${renderAsideBody(tab, progress, profile)}</div>
        </aside>`;
}

export { validators };
