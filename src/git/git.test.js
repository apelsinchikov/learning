import { describe, expect, it } from "vitest";

import { buildPattern, checkOutput } from "./check.js";
import { fillPlain, fillTokens, keyLabel, renderGitRich, renderKeys, shellEscape, tokenText, TOKENS } from "./markup.js";
import { cleanProfile, emptyProfile, loadProfile, PROFILE_KEY, saveProfile, validators } from "./profile.js";
import { renderBlocks, renderSteps, stepDone, stepsComplete } from "./views/page.js";

const profile = { login: "anna-ivanova", repo: "git-practice", name: "Анна Иванова", email: "anna@example.com", os: "mac", mode: "terminal" };

function fakeStorage(initial = {}) {
    const data = new Map(Object.entries(initial));

    return {
        getItem: key => (data.has(key) ? data.get(key) : null),
        setItem: (key, value) => data.set(key, String(value))
    };
}

describe("профиль «Мой проект»", () => {
    it("логин: буквы, цифры, дефис, не с дефиса", () => {
        expect(validators.login("anna-ivanova")).toBe(true);
        expect(validators.login("a")).toBe(true);
        expect(validators.login("-anna")).toBe(false);
        expect(validators.login("anna-")).toBe(false);
        expect(validators.login("anna ivanova")).toBe(false);
        expect(validators.login("a".repeat(40))).toBe(false);
        expect(validators.login("")).toBe(false);
    });

    it("репозиторий: буквы, цифры, точка, дефис, подчёркивание", () => {
        expect(validators.repo("git-practice")).toBe(true);
        expect(validators.repo("my_repo.v2")).toBe(true);
        expect(validators.repo("my repo")).toBe(false);
        expect(validators.repo("..")).toBe(false);
        expect(validators.repo("a/b")).toBe(false);
    });

    it("имя и почта", () => {
        expect(validators.name("Анна Иванова")).toBe(true);
        expect(validators.name("")).toBe(false);
        expect(validators.name("Anna\nIvanova")).toBe(false);
        expect(validators.email("anna@example.com")).toBe(true);
        expect(validators.email("12345+anna@users.noreply.github.com")).toBe(true);
        expect(validators.email("anna@")).toBe(false);
        expect(validators.email("an'na@example.com")).toBe(false);
    });

    it("неверные значения превращаются в пустые, система и способ — по умолчанию", () => {
        const cleaned = cleanProfile({ login: "-bad", repo: "ok-repo", name: " Анна ", email: "x", os: "linux", mode: "?" }, "windows");

        expect(cleaned).toEqual({ login: "", repo: "ok-repo", name: "Анна", email: "", os: "windows", mode: "terminal" });
    });

    it("сохраняется и читается из хранилища, сломанный JSON не роняет", () => {
        const storage = fakeStorage();

        saveProfile(storage, profile);
        expect(loadProfile(storage)).toEqual(profile);
        expect(loadProfile(fakeStorage({ [PROFILE_KEY]: "{oops" })).login).toBe("");
        expect(loadProfile(null).mode).toBe("terminal");
    });

    it("по умолчанию система определяется по платформе", () => {
        expect(emptyProfile("mac").os).toBe("mac");
    });
});

describe("подстановка значений", () => {
    it("пока значения нет, показывается заготовка и пометка", () => {
        const html = fillTokens("{{login}}", { login: "" });

        expect(html).toContain("&lt;ваш-логин&gt;");
        expect(TOKENS.login).toBe("<ваш-логин>");
        expect(html).toContain("git-val--empty");
        expect(html).toContain('data-token="login"');
    });

    it("значение подставляется на место", () => {
        expect(fillTokens("github.com/{{login}}/{{repo}}", profile)).toContain(">anna-ivanova<");
    });

    it("в командах одинарная кавычка в имени экранируется", () => {
        expect(shellEscape("O'Brien")).toBe("O'\\''Brien");
        expect(tokenText("name", { name: "O'Brien" }, "cmd")).toBe("O'\\''Brien");
        expect(tokenText("name", { name: "O'Brien" }, "text")).toBe("O'Brien");
        expect(fillPlain("git config user.name '{{name}}'", { name: "O'Brien" })).toBe("git config user.name 'O'\\''Brien'");
    });

    it("значение с разметкой не ломает страницу", () => {
        /* такой репозиторий валидатор не пропустит, но разметка всё равно безопасна */
        const html = fillTokens("{{repo}}", { repo: "a<b>" });

        expect(html).not.toContain("<b>");
    });

    it("в тексте урока значения и клавиши превращаются в разметку", () => {
        const html = renderGitRich("Откройте `github.com/{{login}}` и нажмите [[key:mod+shift+p]].", profile);

        expect(html).toContain("anna-ivanova");
        expect(html).toContain("git-key");
        expect(html).not.toContain("[[key");
    });
});

describe("клавиши", () => {
    it("Mac и Windows", () => {
        expect(keyLabel("mod+shift+p", "mac")).toBe("⇧⌘P");
        expect(keyLabel("mod+shift+p", "windows")).toBe("Ctrl+Shift+P");
        expect(keyLabel("ctrl+shift+g", "mac")).toBe("⌃⇧G");
        expect(keyLabel("ctrl+shift+g", "windows")).toBe("Ctrl+Shift+G");
        expect(keyLabel("ctrl+backtick", "mac")).toBe("⌃`");
        expect(keyLabel("ctrl+backtick", "windows")).toBe("Ctrl+`");
        expect(keyLabel("mod+enter", "mac")).toBe("⌘↵");
        expect(keyLabel("mod+enter", "windows")).toBe("Ctrl+Enter");
        expect(keyLabel("mod+s", "mac")).toBe("⌘S");
    });

    it("в разметке оба варианта, лишний прячет CSS", () => {
        const html = renderKeys("mod+s");

        expect(html).toContain("git-os--mac");
        expect(html).toContain("git-os--windows");
        expect(html).toContain("⌘S");
        expect(html).toContain("Ctrl+S");
    });
});

describe("проверка вывода", () => {
    it("пустой ввод не проходит", () => {
        expect(checkOutput("   ", [{ re: "x", hint: "нет x" }], profile).ok).toBe(false);
    });

    it("значения ученика подставляются в шаблон и экранируются", () => {
        const re = buildPattern("user\\.email={{email}}", profile);

        expect(re.test("user.email=anna@example.com")).toBe(true);
        expect(re.test("user.email=annaXexample.com")).toBe(false);
    });

    it("без значения подходит любое", () => {
        expect(buildPattern("account\\s+{{login}}", {}).test("account whoever")).toBe(true);
    });

    it("возвращает подсказки по тому, чего нет", () => {
        const result = checkOutput("hello", [{ re: "hello", hint: "а" }, { re: "world", hint: "нет world" }], profile);

        expect(result).toEqual({ ok: false, missing: ["нет world"] });
    });

    it("регистр не важен, русский и английский вывод подходят", () => {
        const patterns = [{ re: "(On branch|На ветке) develop", hint: "ветка" }];

        expect(checkOutput("on branch DEVELOP", patterns, profile).ok).toBe(true);
        expect(checkOutput("На ветке develop", patterns, profile).ok).toBe(true);
        expect(checkOutput("On branch main", patterns, profile).ok).toBe(false);
    });
});

describe("страница урока", () => {
    const lesson = { task: { items: [{ text: "поле", field: "login" }, { text: "вручную" }, { text: "с проверкой", check: { prompt: "?", patterns: [] } }] } };

    it("шаг-поле выполнен, когда в профиле верное значение", () => {
        const state = { done: new Set(), drafts: {}, messages: {} };

        expect(stepDone(lesson.task.items[0], 0, state, { login: "" })).toBe(false);
        expect(stepDone(lesson.task.items[0], 0, state, profile)).toBe(true);
    });

    it("обычный шаг выполнен, когда отмечен", () => {
        const state = { done: new Set([1]), drafts: {}, messages: {} };

        expect(stepDone(lesson.task.items[1], 1, state, profile)).toBe(true);
        expect(stepDone(lesson.task.items[2], 2, state, profile)).toBe(false);
    });

    it("урок выполнен, когда готовы все шаги", () => {
        expect(stepsComplete(lesson.task, { done: new Set([1]), drafts: {}, messages: {} }, profile)).toBe(false);
        expect(stepsComplete(lesson.task, { done: new Set([1, 2]), drafts: {}, messages: {} }, profile)).toBe(true);
    });

    it("шаги: счётчик, поле, поле для вывода и сообщение об ошибке", () => {
        const state = { done: new Set(), drafts: { 2: "oops" }, messages: { 2: { ok: false, lines: ["Не вижу строку."] } } };
        const html = renderSteps(lesson, state, profile);

        expect(html).toContain("1 из 3");
        expect(html).toContain('data-field="login"');
        expect(html).toContain('data-step-toggle="1"');
        expect(html).toContain('data-step-input="2"');
        expect(html).toContain("oops");
        expect(html).toContain("Не вижу строку.");
    });

    it("вставленный вывод экранируется", () => {
        const state = { done: new Set(), drafts: { 2: "<script>x</script>" }, messages: {} };

        expect(renderSteps(lesson, state, profile)).not.toContain("<script>x");
    });

    it("блоки: команды с подстановкой, варианты для способа работы и системы", () => {
        const html = renderBlocks(
            [
                { type: "cmd", lines: ["git clone https://github.com/{{login}}/{{repo}}.git", "# комментарий"], output: "Cloning into '{{repo}}'..." },
                { type: "how", terminal: [{ type: "text", text: "термин" }], vscode: [{ type: "text", text: "код" }] },
                { type: "os", mac: [{ type: "text", text: "мак" }], windows: [{ type: "text", text: "винда" }] },
                { type: "text", only: "vscode", text: "только код" }
            ],
            profile
        );

        expect(html).toContain("anna-ivanova");
        expect(html).toContain("git-line--comment");
        expect(html).toContain('data-variant="terminal"');
        expect(html).toContain('data-variant="vscode"');
        expect(html).toContain('data-os-variant="mac"');
        expect(html).toContain('data-os-variant="windows"');
        expect(html).toContain("только код");
    });

    it("в командах значения в одинарных кавычках экранируются для командной строки", () => {
        const html = renderBlocks([{ type: "cmd", lines: ["git config user.name '{{name}}'"] }], { ...profile, name: "O'Brien" });

        expect(html).toContain("O&#039;\\&#039;&#039;Brien");
    });
});
