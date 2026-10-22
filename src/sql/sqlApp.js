import { Header } from "../components/Header.js";
import { parseRoute, sqlHash } from "../courses/router.js";
import { compareResults } from "./check.js";
import { createEngine } from "./engine.js";
import { humanizeError } from "./errors.js";
import { checkPassword, isUnlocked, unlock } from "./gate.js";
import { findRowById, peekTable } from "./hotel/peek.js";
import { tablesMentioned } from "./hotel/schema.js";
import { findSqlLesson, sqlLessons } from "./lessons/index.js";
import { createSqlProgress } from "./progress.js";
import { createSqlEditor } from "./sqlEditor.js";
import { renderAside, renderCheatSheet, renderNotebook, renderSchemaPanel } from "./views/aside.js";
import { renderGate } from "./views/gate.js";
import { renderSqlProgress, renderSqlSidebar } from "./views/nav.js";
import { renderErrorBox, renderNotice, renderResultTable } from "./views/resultTable.js";
import { renderHints, renderLessonPage, renderSandboxPage, renderSolved } from "./views/task.js";
import { ORDER_STEP_COUNT } from "./views/theory.js";

const SANDBOX_KEY = "sql-sandbox-query-v1";
const SANDBOX_DEFAULT = "SELECT * FROM guests;";

/*
 * Курс SQL целиком: страница урока, редактор, запуск запросов, проверка,
 * прогресс. Создаётся один раз при первом заходе на #/sql и живёт до закрытия вкладки.
 *
 * main.js только говорит, что показать: render({ lessonId, user, authReady }).
 */
export function createSqlCourseApp({
    root,
    storage = null,
    supabaseClient = null,
    engine = createEngine(),
    createEditor = createSqlEditor,
    progress = createSqlProgress({ storage, supabaseClient })
}) {
    let active = false;
    let user = null;
    let lastArgs = {};
    let editor = null;
    let pageId = null;
    let asideTab = "schema";
    let renderedKey = "";
    let pageToken = 0;
    let gateError = "";

    const hintsShown = new Map();
    const chosen = new Map();
    const verdictChoice = new Map();

    const $ = selector => root.querySelector(selector);

    /* ------------------------------ хранилище ------------------------------ */

    function readStore(key) {
        try {
            return storage ? storage.getItem(key) : null;
        } catch {
            return null;
        }
    }

    function writeStore(key, value) {
        try {
            if (storage) {
                storage.setItem(key, value);
            }
        } catch {
            /* без хранилища запрос просто не запомнится */
        }
    }

    /* ------------------------------ редактор ------------------------------ */

    function destroyEditor() {
        if (editor) {
            editor.destroy();
            editor = null;
        }
    }

    const editorText = () => (editor ? editor.state.doc.toString() : "");

    function setEditorText(text) {
        if (editor) {
            editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: text } });
        }
    }

    function updateMentioned(sql) {
        const names = tablesMentioned(sql);

        root.querySelectorAll("[data-table-card]").forEach(card => {
            card.classList.toggle("is-mentioned", names.includes(card.dataset.tableCard));
        });
    }

    /* ------------------------------ запуск запросов ------------------------------ */

    function setOutput(html) {
        const box = $("[data-output]");

        if (box) {
            box.innerHTML = html;
        }
    }

    async function prepareEngine(target) {
        if (engine.isReady()) {
            return true;
        }

        target(renderNotice("info", "Готовлю базу данных…", "В первый раз это занимает несколько секунд. Потом запросы выполняются мгновенно."));

        try {
            await engine.init();
            return true;
        } catch (error) {
            console.error(error);

            target(
                renderErrorBox({
                    title: "Не удалось запустить базу",
                    text: "Postgres загружается из интернета (jsDelivr). Проверьте соединение и нажмите «Выполнить» ещё раз."
                })
            );

            return false;
        }
    }

    function failure(rawMessage) {
        return renderErrorBox(humanizeError(rawMessage));
    }

    async function runForOutput(sql, { check = false, lesson = null } = {}) {
        const token = pageToken;

        if (!(await prepareEngine(setOutput)) || token !== pageToken) {
            return;
        }

        const result = await engine.run(sql);

        if (token !== pageToken) {
            return;
        }

        if (!result.ok) {
            setOutput(failure(result.error));
            return;
        }

        const table = renderResultTable(result);

        if (!check || !lesson) {
            setOutput(table);
            return;
        }

        const expected = await engine.run(lesson.task.solution);

        if (token !== pageToken) {
            return;
        }

        if (!expected.ok) {
            setOutput(table + renderErrorBox({ title: "Ошибка в курсе", text: "Не удалось получить эталонный ответ. Сообщите автору курса." }));
            return;
        }

        const verdict = compareResults(result, expected, {
            ordered: Boolean(lesson.task.ordered),
            names: Boolean(lesson.task.names)
        });

        if (!verdict.ok) {
            setOutput(table + renderNotice("warning", "Пока не то", verdict.issues.join(" ")));
            return;
        }

        setOutput(table + predictionNote(lesson, expected.rows.length));
        solve(lesson);
    }

    function predictionNote(lesson, actualRows) {
        const input = $("[data-predict]");
        const raw = input ? input.value.trim() : "";

        if (raw === "") {
            return "";
        }

        return Number(raw) === actualRows
            ? renderNotice("success", "Вы угадали число строк!", "")
            : renderNotice("info", `Вы ожидали ${raw}, а в верном ответе ${actualRows}.`, "Разберитесь, почему так вышло: это лучший способ понять запрос.");
    }

    /* ------------------------------ решение ------------------------------ */

    function solve(lesson) {
        progress.markRead(lesson.id);
        progress.markSolved(lesson.id);
        showSolved(lesson);
    }

    function showSolved(lesson) {
        const box = $("[data-feedback]");

        if (box) {
            box.innerHTML = renderSolved(lesson, { verdictChoice: verdictChoice.get(lesson.id) ?? null });
        }
    }

    /* ------------------------------ боковые панели ------------------------------ */

    function solvedKey() {
        return sqlLessons.map(lesson => (progress.getProgress().lessons[lesson.id]?.solved ? "1" : "0")).join("");
    }

    function refreshChrome() {
        if (!active || !$(".sql-nav")) {
            return;
        }

        const key = solvedKey();

        if (key === renderedKey) {
            return;
        }

        renderedKey = key;

        const state = progress.getProgress();

        $(".sql-nav").outerHTML = renderSqlSidebar(pageId, state);

        const summary = $(".header__progress");

        if (summary) {
            summary.outerHTML = renderSqlProgress(state);
        }

        refreshAsideBody();

        const lesson = findSqlLesson(pageId);
        const feedback = $("[data-feedback]");

        if (lesson && feedback && !feedback.innerHTML.trim() && state.lessons[lesson.id]?.solved) {
            showSolved(lesson);
        }
    }

    function refreshAsideBody() {
        const body = $("[data-aside-body]");

        if (!body) {
            return;
        }

        const state = progress.getProgress();

        if (asideTab === "schema") {
            return;
        }

        body.innerHTML = asideTab === "notebook" ? renderNotebook(state) : renderCheatSheet(state);

        const badge = $("[data-aside-tab='notebook']");

        if (badge) {
            const count = sqlLessons.filter(lesson => state.lessons[lesson.id]?.solved).length;

            badge.innerHTML = `Блокнот${count ? ` <span class="sql-badge">${count}</span>` : ""}`;
        }
    }

    function switchAsideTab(tab) {
        asideTab = tab;

        root.querySelectorAll("[data-aside-tab]").forEach(button => {
            const on = button.dataset.asideTab === tab;

            button.classList.toggle("is-active", on);
            button.setAttribute("aria-selected", String(on));
        });

        const body = $("[data-aside-body]");
        const state = progress.getProgress();

        body.innerHTML =
            tab === "notebook"
                ? renderNotebook(state)
                : tab === "cheat"
                  ? renderCheatSheet(state)
                  : renderSchemaPanel(tablesMentioned(editorText()));
    }

    /* ------------------------------ отрисовка ------------------------------ */

    function chrome(content, { sidebar = true } = {}) {
        const state = progress.getProgress();

        return `
            <div class="app sql-app">
                ${Header({ user, course: "sql", summary: renderSqlProgress(state) })}
                ${
                    sidebar
                        ? `<div class="sql-layout">
                            <div class="sql-sidebar">${renderSqlSidebar(pageId, state)}</div>
                            <main class="sql-main">${content}</main>
                            ${renderAside(state, { tab: asideTab })}
                        </div>`
                        : `<main class="sql-main sql-main--wide">${content}</main>`
                }
            </div>
        `;
    }

    function resolvePage(lessonId) {
        if (lessonId === "sandbox") {
            return "sandbox";
        }

        if (lessonId && findSqlLesson(lessonId)) {
            return lessonId;
        }

        const saved = progress.getProgress().currentLesson?.id;

        return saved && findSqlLesson(saved) ? saved : sqlLessons[0].id;
    }

    function mountEditor(lesson) {
        const host = $("[data-editor]");

        if (!host) {
            return;
        }

        const isSandbox = !lesson;
        const draft = isSandbox ? readStore(SANDBOX_KEY) : progress.getProgress().lessons[lesson.id]?.draft;
        const initial = draft ?? (isSandbox ? SANDBOX_DEFAULT : lesson.task.starter);

        editor = createEditor(host, initial, {
            onChange(text) {
                if (isSandbox) {
                    writeStore(SANDBOX_KEY, text);
                } else {
                    progress.saveDraft(lesson.id, text);
                }

                updateMentioned(text);
            },
            onRun() {
                runForOutput(editorText(), { lesson: null });
            }
        });

        updateMentioned(initial);
    }

    function render(args = {}) {
        lastArgs = args;
        active = true;
        user = args.user ?? null;

        pageToken++;
        destroyEditor();

        if (!isUnlocked(storage)) {
            pageId = null;
            root.innerHTML = chrome(renderGate({ error: gateError }), { sidebar: false });
            gateError = "";
            window.scrollTo({ top: 0, left: 0 });
            return;
        }

        const requested = args.lessonId ?? null;

        pageId = resolvePage(requested);

        /* Адрес без урока заменяем адресом найденного урока, не создавая запись в истории. */
        if (requested !== pageId) {
            window.history.replaceState(null, "", sqlHash(pageId));
        }

        const lesson = pageId === "sandbox" ? null : findSqlLesson(pageId);
        const state = progress.getProgress();

        const content = lesson
            ? renderLessonPage(lesson, {
                  solved: Boolean(state.lessons[lesson.id]?.solved),
                  hintsShown: hintsShown.get(lesson.id) ?? 0,
                  chosen: chosen.get(lesson.id) ?? null,
                  verdictChoice: verdictChoice.get(lesson.id) ?? null
              })
            : renderSandboxPage();

        root.innerHTML = chrome(content);
        renderedKey = solvedKey();

        if (lesson && lesson.task.kind !== "choice") {
            mountEditor(lesson);
        } else if (!lesson) {
            mountEditor(null);
        }

        if (lesson) {
            progress.setCurrentLesson(lesson.id);
        }

        window.scrollTo({ top: 0, left: 0 });
    }

    /* ------------------------------ вход ------------------------------ */

    function syncUser(nextUser) {
        user = nextUser ?? null;

        if (user) {
            if (user.id !== progress.getUserId()) {
                return progress.signedIn(user.id);
            }

            return Promise.resolve();
        }

        progress.signedOut();

        return Promise.resolve();
    }

    /* ------------------------------ события ------------------------------ */

    function onExampleRun(button) {
        const example = button.closest(".sql-example");
        const out = example.querySelector("[data-example-result]");
        const sql = example.querySelector("[data-sql-source]").textContent;
        const token = pageToken;

        out.hidden = false;

        (async () => {
            if (!(await prepareEngine(html => (out.innerHTML = html))) || token !== pageToken) {
                return;
            }

            const result = await engine.run(sql);

            if (token === pageToken) {
                out.innerHTML = result.ok ? renderResultTable(result) : failure(result.error);
            }
        })();
    }

    function onFkClick(button) {
        const explorer = button.closest("[data-fk-explorer]");
        const table = button.dataset.fkTable;
        const key = Number(button.dataset.fkKey);

        explorer.querySelectorAll(".is-hit").forEach(el => el.classList.remove("is-hit"));

        const row = explorer.querySelector(`[data-row-table="${table}"][data-row-id="${key}"]`);

        if (!row) {
            return;
        }

        row.classList.add("is-hit");

        const holder = row.closest("[data-fk-scroll]");

        if (holder) {
            holder.scrollTop = Math.max(row.offsetTop - holder.clientHeight / 2, 0);
        }

        const record = findRowById(table, table === "rooms" ? "room_id" : "id", key);
        const answer = explorer.querySelector("[data-fk-answer]");

        if (record && answer) {
            const label = table === "rooms" ? `room_id = ${key}` : `guest_id = ${key}`;
            const name = table === "rooms" ? record.title : record.full_name;

            answer.textContent = `${label} указывает на запись в таблице ${table}: ${name}.`;
        }
    }

    function onOrderNext(button) {
        const box = button.closest("[data-order-steps]");
        const items = [...box.querySelectorAll("li")];
        const current = items.findIndex(item => item.classList.contains("is-active"));
        const next = current + 1 >= ORDER_STEP_COUNT ? -1 : current + 1;

        items.forEach((item, index) => {
            item.classList.toggle("is-active", index === next);
            item.classList.toggle("is-done", next !== -1 && index < next);
        });

        button.textContent = next === ORDER_STEP_COUNT - 1 ? "Начать сначала" : "Дальше";
    }

    function onPeekToggle(button) {
        const name = button.dataset.peekToggle;
        const box = root.querySelector(`[data-peek-box="${name}"]`);

        if (!box.hidden) {
            box.hidden = true;
            button.textContent = "Показать первые строки";
            return;
        }

        box.innerHTML = renderResultTable(peekTable(name, 5), { caption: false });
        box.hidden = false;
        button.textContent = "Скрыть строки";
    }

    function onHint(lesson) {
        const next = Math.min((hintsShown.get(lesson.id) ?? 0) + 1, lesson.task.hints.length);

        hintsShown.set(lesson.id, next);

        $("[data-hints]").innerHTML = renderHints(lesson, next);
    }

    function onChoiceSubmit(lesson) {
        const selected = root.querySelector("input[name='choice']:checked");
        const out = $("[data-output]");

        if (!selected) {
            out.innerHTML = renderNotice("info", "Выберите вариант ответа", "");
            return;
        }

        const index = Number(selected.value);

        chosen.set(lesson.id, index);

        if (index === lesson.task.correct) {
            out.innerHTML = "";
            solve(lesson);
        } else {
            out.innerHTML = renderNotice("warning", "Не совсем", "Подумайте ещё или откройте подсказку.");
        }
    }

    function onVerdictSubmit(lesson) {
        const selected = root.querySelector("input[name='verdict']:checked");

        if (!selected) {
            return;
        }

        verdictChoice.set(lesson.id, Number(selected.value));
        showSolved(lesson);
        $("[data-verdict]")?.scrollIntoView?.({ block: "nearest" });
    }

    async function onGateSubmit(form) {
        const input = form.querySelector("[data-gate-input]");
        const error = form.querySelector("[data-gate-error]");

        let ok = false;

        try {
            ok = await checkPassword(input.value);
        } catch (e) {
            console.error(e);
        }

        if (ok) {
            unlock(storage);
            render(lastArgs);
            return;
        }

        error.textContent = "Пароль не подходит.";
        error.hidden = false;
        input.select();
    }

    function onClick(event) {
        if (!active) {
            return;
        }

        const target = event.target.closest(
            "[data-run],[data-check],[data-reset],[data-hint],[data-choice-submit],[data-verdict-submit],[data-example-run],[data-example-sandbox],[data-fk-table],[data-order-next],[data-aside-tab],[data-peek-toggle]"
        );

        if (!target) {
            return;
        }

        const lesson = findSqlLesson(pageId);
        const data = target.dataset;

        if ("run" in data) {
            runForOutput(editorText());
        } else if ("check" in data && lesson) {
            runForOutput(editorText(), { check: true, lesson });
        } else if ("reset" in data) {
            setEditorText(lesson ? lesson.task.starter : "");
            setOutput("");
        } else if ("hint" in data && lesson) {
            onHint(lesson);
        } else if ("choiceSubmit" in data && lesson) {
            onChoiceSubmit(lesson);
        } else if ("verdictSubmit" in data && lesson) {
            onVerdictSubmit(lesson);
        } else if ("exampleRun" in data) {
            onExampleRun(target);
        } else if ("exampleSandbox" in data) {
            writeStore(SANDBOX_KEY, target.closest(".sql-example").querySelector("[data-sql-source]").textContent);
            window.location.hash = sqlHash("sandbox");
        } else if ("fkTable" in data) {
            onFkClick(target);
        } else if ("orderNext" in data) {
            onOrderNext(target);
        } else if ("asideTab" in data) {
            switchAsideTab(data.asideTab);
        } else if ("peekToggle" in data) {
            onPeekToggle(target);
        }
    }

    function onSubmit(event) {
        if (!active || !event.target.matches("[data-gate-form]")) {
            return;
        }

        event.preventDefault();
        onGateSubmit(event.target);
    }

    function onChange(event) {
        if (!active || !event.target.matches("input[name='choice']")) {
            return;
        }

        root.querySelectorAll(".sql-choice").forEach(label => label.classList.remove("is-chosen"));
        event.target.closest(".sql-choice").classList.add("is-chosen");
    }

    root.addEventListener("click", onClick);
    root.addEventListener("submit", onSubmit);
    root.addEventListener("change", onChange);

    progress.onChange(refreshChrome);

    return {
        render,
        syncUser,
        progress,

        leave() {
            active = false;
            pageToken++;
            destroyEditor();
        },

        flush: () => progress.flush(),

        currentRoute: () => parseRoute(window.location.hash)
    };
}
