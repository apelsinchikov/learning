import { Header } from "../components/Header.js";
import { parseRoute, sqlAdvancedHash } from "../courses/router.js";
import { compareResults } from "../sql/check.js";
import { createSqlEditor } from "../sql/sqlEditor.js";
import { renderErrorBox, renderNotice, renderResultTable } from "../sql/views/resultTable.js";
import { createEngine } from "./engine.js";
import { humanizeRunError } from "./errors.js";
import { findSqaLesson, sqaLessons } from "./lessons/index.js";
import { createSqaProgress } from "./progress.js";
import { SCHEMA_SQL, attachModel, buildSchema, countRowsSql, schemaToEr } from "./schema.js";
import { renderAside, renderAsideBody } from "./views/aside.js";
import { renderProgress, renderSidebar, statusKey } from "./views/nav.js";
import { renderLessonPage, renderQuiz, renderHints, renderSandboxPage, renderSolved } from "./views/page.js";
import { renderSchemaModal } from "./views/schemaPanel.js";

const SANDBOX_KEY = "sql-advanced-sandbox-v1";
const SANDBOX_DEFAULT = "SELECT * FROM bookings LIMIT 10;";
const READ_DELAY_MS = 2500;

const ROLLBACK_NOTE =
    "Изменения выполнены по-настоящему и тут же откатились: база снова такая же, как в начале. Поэтому в каждом запуске вы видите исходные данные урока.";

/*
 * Курс SQL Advanced целиком: страница урока, редактор, запуск запросов (в том числе
 * с записью: всё откатывается), проверка, схема базы справа, прогресс.
 * Создаётся один раз при первом заходе на #/sql-advanced и живёт до закрытия вкладки.
 *
 * main.js только говорит, что показать: render({ lessonId, user, authReady }).
 * engine, createEditor и renderer можно подменить (в тестах и при проверке в браузере).
 */
export function createSqaCourseApp({
    root,
    storage = null,
    supabaseClient = null,
    engine = createEngine(),
    createEditor = createSqlEditor,
    renderer = null,
    progress = createSqaProgress({ storage, supabaseClient })
}) {
    let active = false;
    let user = null;
    let editor = null;
    let pageId = null;
    let asideTab = "schema";
    let renderedKey = "";
    let readObserver = null;
    let readTimer = null;
    let pageToken = 0;
    let schemaState = { status: "loading" };
    let baseSchema = null;
    let mermaidRenderer = renderer;

    const schemaCache = new Map();
    const hintsShown = new Map();
    const quizAnswers = new Map();
    const quizChecked = new Set();

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

    const currentLesson = () => (pageId === "sandbox" ? null : findSqaLesson(pageId));
    const beforeOf = lesson => (lesson && lesson.before) || "";

    /* ------------------------------ схема ------------------------------ */

    function renderSchemaBody() {
        if (!active || asideTab !== "schema") {
            return;
        }

        const body = $("[data-aside-body]");

        if (body) {
            body.innerHTML = renderAsideBody("schema", progress.getProgress(), schemaState);
        }
    }

    /* Схема для стартового состояния урока: таблицы, колонки, ключи и число строк. */
    async function loadSchema(lesson) {
        const before = beforeOf(lesson);
        const token = pageToken;

        schemaState = { status: "loading" };
        baseSchema = null;
        renderSchemaBody();

        if (!schemaCache.has(before)) {
            const raw = await engine.inspect(SCHEMA_SQL, { before });

            if (!raw.ok) {
                if (token === pageToken) {
                    schemaState = { status: "error", error: raw.error };
                    renderSchemaBody();
                }

                return;
            }

            const model = buildSchema(raw.rows[0][0]);
            const counts = await engine.inspect(countRowsSql(model.map(table => table.name)), { before });

            if (counts.ok) {
                const byName = new Map(counts.rows);

                model.forEach(table => {
                    table.rows = byName.get(table.name) ?? null;
                });
            }

            schemaCache.set(before, model);
        }

        if (token !== pageToken) {
            return;
        }

        baseSchema = schemaCache.get(before);
        schemaState = { status: "ready", model: baseSchema };
        renderSchemaBody();
    }

    /* После запроса ученика показываем схему такой, какой она стала. Сама база откатилась. */
    function showSchemaAfter(rawSchema) {
        if (!rawSchema || !baseSchema) {
            return;
        }

        const model = buildSchema(rawSchema);
        const shape = table => JSON.stringify({ ...table, rows: null });
        const baseByName = new Map(baseSchema.map(table => [table.name, shape(table)]));
        const changed = model.filter(table => baseByName.get(table.name) !== shape(table)).map(table => table.name);
        const removed = baseSchema.length !== model.filter(table => baseByName.has(table.name)).length;

        if (changed.length === 0 && !removed) {
            if (schemaState.after) {
                schemaState = { status: "ready", model: baseSchema };
                renderSchemaBody();
            }

            return;
        }

        model.forEach(table => {
            const base = baseSchema.find(item => item.name === table.name);

            table.rows = base && shape(base) === shape(table) ? base.rows : null;
        });

        schemaState = { status: "ready", model, after: true, changed };
        renderSchemaBody();
    }

    function resetSchema() {
        if (baseSchema) {
            schemaState = { status: "ready", model: baseSchema };
            renderSchemaBody();
        }
    }

    async function onPeekToggle(button) {
        const name = button.dataset.peekToggle;
        const box = root.querySelector(`[data-peek-box="${name}"]`);

        if (!box.hidden) {
            box.hidden = true;
            button.textContent = "Показать первые строки";
            return;
        }

        box.hidden = false;
        box.innerHTML = renderNotice("info", "Загружаю…", "");

        const result = await engine.inspect(`SELECT * FROM "${name}" LIMIT 5`, { before: beforeOf(currentLesson()) });

        box.innerHTML = result.ok ? renderResultTable(result, { caption: false }) : renderErrorBox({ title: "Не удалось прочитать таблицу", text: result.error });
        button.textContent = "Скрыть строки";
    }

    function focusTable(name) {
        switchAsideTab("schema");

        const card = root.querySelector(`[data-table-card="${name}"]`);

        if (!card) {
            return;
        }

        root.querySelectorAll(".sql-table-card.is-focus").forEach(item => item.classList.remove("is-focus"));
        card.classList.add("is-focus");
        card.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
    }

    /* ------------------------------ «Схема целиком» ------------------------------ */

    async function openSchemaModal() {
        if (schemaState.status !== "ready" || $("[data-schema-modal]")) {
            return;
        }

        const state = schemaState;

        root.querySelector(".sqa-app").insertAdjacentHTML("beforeend", renderSchemaModal(state));

        const picture = $("[data-er-picture]");

        try {
            if (!mermaidRenderer) {
                const module = await import("../diagrams/mermaidRenderer.js");

                mermaidRenderer = module.createMermaidRenderer();
            }

            const result = await mermaidRenderer.render(schemaToEr(state.model));

            if (picture && $("[data-schema-modal]")) {
                picture.innerHTML = result.ok
                    ? result.svg
                    : `<p class="sqa-muted">Не удалось нарисовать диаграмму. Таблицы и связи есть во вкладке «Схема».</p>`;
            }
        } catch (error) {
            console.error(error);

            if (picture) {
                picture.innerHTML = `<p class="sqa-muted">Не удалось нарисовать диаграмму. Таблицы и связи есть во вкладке «Схема».</p>`;
            }
        }
    }

    function closeSchemaModal() {
        $("[data-schema-modal]")?.remove();
    }

    async function onModalTable(button) {
        const name = button.dataset.modalTable;
        const holder = $("[data-modal-rows]");

        holder.innerHTML = renderNotice("info", "Загружаю…", "");

        const result = await engine.inspect(`SELECT * FROM "${name}" LIMIT 8`, { before: beforeOf(currentLesson()) });

        holder.innerHTML = result.ok
            ? `<h3 class="sqa-modal__sub">${name}: первые строки</h3>${renderResultTable(result, { caption: false })}`
            : renderErrorBox({ title: "Таблицу нельзя прочитать", text: result.error });
    }

    /* ------------------------------ вывод ------------------------------ */

    function setOutput(html) {
        const box = $("[data-output]");

        if (box) {
            box.innerHTML = html;
        }
    }

    function failure(result) {
        if (result.timeout) {
            return renderErrorBox({ title: "Запрос остановлен", text: result.error });
        }

        if (result.startup) {
            return renderErrorBox({
                title: "Не удалось запустить базу",
                text: "Postgres загружается из интернета. Проверьте соединение и нажмите «Выполнить» ещё раз."
            });
        }

        if (result.rejected) {
            return renderNotice("warning", "Эта команда в песочнице не нужна", result.error);
        }

        return renderErrorBox(humanizeRunError(result, baseSchema));
    }

    function showPending() {
        setOutput(
            engine.isReady()
                ? renderNotice("info", "Выполняю…", "")
                : renderNotice("info", "Готовлю базу данных…", "В первый раз это занимает несколько секунд. Потом запросы выполняются мгновенно.")
        );
    }

    function predictionNote(expectedRows) {
        const input = $("[data-predict]");
        const raw = input ? input.value.trim() : "";

        if (raw === "") {
            return "";
        }

        return Number(raw) === expectedRows
            ? renderNotice("success", "Вы угадали число строк!", "")
            : renderNotice("info", `Вы ожидали ${raw}, а в верном ответе ${expectedRows}.`, "Разберитесь, почему так вышло: это лучший способ понять запрос.");
    }

    /* ------------------------------ запуск и проверка ------------------------------ */

    async function runCode({ check = false } = {}) {
        const lesson = currentLesson();
        const token = pageToken;
        const sql = editorText();
        const task = lesson?.task;

        showPending();

        const result = await engine.run({
            before: beforeOf(lesson),
            sql,
            withSchema: true,
            probes: check && task?.probes ? task.probes : []
        });

        if (token !== pageToken) {
            return;
        }

        if (!result.ok) {
            setOutput(failure(result));
            return;
        }

        showSchemaAfter(result.schema);

        const table = result.columns.length
            ? renderResultTable(result)
            : renderNotice("info", "Выполнено", `Затронуто строк: ${result.affected}.`);
        const rollback = result.affected > 0 || result.columns.length === 0 ? renderNotice("info", "Откат", ROLLBACK_NOTE) : "";

        if (!check || !lesson) {
            setOutput(table + rollback);
            return;
        }

        if (task.kind === "query") {
            const expected = await engine.run({ before: beforeOf(lesson), sql: task.solution });

            if (token !== pageToken) {
                return;
            }

            if (!expected.ok) {
                setOutput(table + renderErrorBox({ title: "Ошибка в курсе", text: "Не удалось получить эталонный ответ. Сообщите автору курса." }));
                return;
            }

            const verdict = compareResults(result, expected, { ordered: Boolean(task.ordered), names: Boolean(task.names) });

            if (!verdict.ok) {
                setOutput(table + renderNotice("warning", "Пока не то", verdict.issues.join(" ")));
                return;
            }

            setOutput(table + predictionNote(expected.rows.length));
            solve(lesson);
            return;
        }

        const verdict = task.verify(attachModel(result));

        if (!verdict.ok) {
            setOutput(table + rollback + renderNotice("warning", "Пока не то", verdict.issues.join(" ")));
            return;
        }

        setOutput(table + rollback);
        solve(lesson);
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
            box.innerHTML = renderSolved(lesson);
        }
    }

    function onQuizSubmit(lesson) {
        const answers = lesson.task.questions.map((_, index) => {
            const selected = root.querySelector(`input[name='q${index}']:checked`);

            return selected ? Number(selected.value) : null;
        });

        quizAnswers.set(lesson.id, answers);
        quizChecked.add(lesson.id);
        $("[data-quiz]").outerHTML = renderQuiz(lesson, { answers, checked: true });

        if (answers.every((value, index) => value === lesson.task.questions[index].correct)) {
            solve(lesson);
        }
    }

    /* ------------------------------ боковые панели ------------------------------ */

    const solvedKey = () => statusKey(progress.getProgress());

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

        $(".sql-nav").outerHTML = renderSidebar(pageId, state);

        const summary = $(".header__progress");

        if (summary) {
            summary.outerHTML = renderProgress(state);
        }

        if (asideTab === "cheat") {
            $("[data-aside-body]").innerHTML = renderAsideBody("cheat", state, schemaState);
        }

        const lesson = currentLesson();
        const feedback = $("[data-feedback]");

        if (lesson && feedback && !feedback.innerHTML.trim() && state.lessons[lesson.id]?.solved) {
            showSolved(lesson);
        }
    }

    function switchAsideTab(tab) {
        asideTab = tab;

        root.querySelectorAll("[data-aside-tab]").forEach(button => {
            const on = button.dataset.asideTab === tab;

            button.classList.toggle("is-active", on);
            button.setAttribute("aria-selected", String(on));
        });

        $("[data-aside-body]").innerHTML = renderAsideBody(tab, progress.getProgress(), schemaState);
    }

    /* ------------------------------ «прочитано» ------------------------------ */

    function stopWatchingReading() {
        if (readObserver) {
            readObserver.disconnect();
            readObserver = null;
        }

        clearTimeout(readTimer);
        readTimer = null;
    }

    /* Урок прочитан, когда читатель дошёл до задачи и побыл на ней пару секунд. */
    function watchReading(lesson) {
        stopWatchingReading();

        const task = lesson && $(".sql-task");

        if (!task || progress.getProgress().lessons[lesson.id]?.read || typeof IntersectionObserver === "undefined") {
            return;
        }

        readObserver = new IntersectionObserver(
            entries => {
                clearTimeout(readTimer);

                if (entries.some(entry => entry.isIntersecting)) {
                    readTimer = setTimeout(() => {
                        progress.markRead(lesson.id);
                        stopWatchingReading();
                    }, READ_DELAY_MS);
                }
            },
            { threshold: 0.2 }
        );

        readObserver.observe(task);
    }

    /* ------------------------------ отрисовка ------------------------------ */

    function chrome(content) {
        const state = progress.getProgress();

        return `
            <div class="app sql-app sqa-app">
                ${Header({ user, course: "sql-advanced", summary: renderProgress(state) })}
                <div class="sql-layout">
                    <div class="sql-sidebar">${renderSidebar(pageId, state)}</div>
                    <main class="sql-main">${content}</main>
                    ${renderAside(state, { tab: asideTab, schemaState })}
                </div>
            </div>
        `;
    }

    function resolvePage(lessonId) {
        if (lessonId === "sandbox") {
            return "sandbox";
        }

        if (lessonId && findSqaLesson(lessonId)) {
            return lessonId;
        }

        const saved = progress.getProgress().currentLesson?.id;

        return saved && findSqaLesson(saved) ? saved : sqaLessons[0].id;
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
            },
            onRun() {
                runCode();
            }
        });
    }

    /*
     * Страница перерисовывается целиком, и список уроков вернулся бы к началу.
     * Запоминаем, где он был прокручен, и после отрисовки возвращаем.
     */
    function restoreSidebarScroll(previousTop) {
        const sidebar = root.querySelector(".sql-sidebar");

        if (!sidebar) {
            return;
        }

        if (previousTop !== null) {
            sidebar.scrollTop = previousTop;
        }

        const current = sidebar.querySelector("[aria-current='page']");

        if (!current) {
            return;
        }

        const top = current.getBoundingClientRect().top - sidebar.getBoundingClientRect().top + sidebar.scrollTop;
        const visible = top >= sidebar.scrollTop && top + current.offsetHeight <= sidebar.scrollTop + sidebar.clientHeight;

        if (!visible) {
            sidebar.scrollTop = Math.max(top - sidebar.clientHeight / 2, 0);
        }
    }

    function render(args = {}) {
        const previousSidebarTop = root.querySelector(".sqa-app .sql-sidebar")?.scrollTop ?? null;

        active = true;
        user = args.user ?? null;

        pageToken++;
        destroyEditor();
        stopWatchingReading();

        const requested = args.lessonId ?? null;

        pageId = resolvePage(requested);

        /* Адрес без урока заменяем адресом найденного урока, не создавая запись в истории. */
        if (requested !== pageId) {
            window.history.replaceState(null, "", sqlAdvancedHash(pageId));
        }

        const lesson = currentLesson();
        const state = progress.getProgress();

        schemaState = { status: "loading" };
        baseSchema = null;

        const content = lesson
            ? renderLessonPage(lesson, {
                  solved: Boolean(state.lessons[lesson.id]?.solved),
                  hintsShown: hintsShown.get(lesson.id) ?? 0,
                  answers: quizAnswers.get(lesson.id) ?? [],
                  checked: quizChecked.has(lesson.id)
              })
            : renderSandboxPage();

        root.innerHTML = chrome(content);
        renderedKey = solvedKey();
        restoreSidebarScroll(previousSidebarTop);

        if (!lesson || lesson.task.kind !== "quiz") {
            mountEditor(lesson);
        }

        if (lesson) {
            progress.setCurrentLesson(lesson.id);
        }

        watchReading(lesson);
        loadSchema(lesson);

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
        out.innerHTML = renderNotice("info", engine.isReady() ? "Выполняю…" : "Готовлю базу данных…", "");

        (async () => {
            const result = await engine.run({ before: beforeOf(currentLesson()), sql });

            if (token === pageToken) {
                out.innerHTML = result.ok
                    ? result.columns.length
                        ? renderResultTable(result)
                        : renderNotice("info", "Выполнено", `Затронуто строк: ${result.affected}. Изменения откатились.`)
                    : failure(result);
            }
        })();
    }

    function onHint(lesson) {
        const next = Math.min((hintsShown.get(lesson.id) ?? 0) + 1, lesson.task.hints.length);

        hintsShown.set(lesson.id, next);
        $("[data-hints]").innerHTML = renderHints(lesson, next);
    }

    function onClick(event) {
        if (!active) {
            return;
        }

        const target = event.target.closest(
            "[data-run],[data-check],[data-reset],[data-hint],[data-quiz-submit],[data-example-run],[data-example-sandbox],[data-aside-tab],[data-peek-toggle],[data-mark-read],[data-table-ref],[data-schema-open],[data-schema-close],[data-schema-reset],[data-modal-table]"
        );

        if (!target) {
            return;
        }

        const lesson = currentLesson();
        const data = target.dataset;

        if ("run" in data) {
            runCode();
        } else if ("check" in data && lesson) {
            runCode({ check: true });
        } else if ("reset" in data) {
            setEditorText(lesson ? lesson.task.starter : "");
            setOutput("");
        } else if ("hint" in data && lesson) {
            onHint(lesson);
        } else if ("quizSubmit" in data && lesson) {
            onQuizSubmit(lesson);
        } else if ("exampleRun" in data) {
            onExampleRun(target);
        } else if ("exampleSandbox" in data) {
            writeStore(SANDBOX_KEY, target.closest(".sql-example").querySelector("[data-sql-source]").textContent);
            window.location.hash = sqlAdvancedHash("sandbox");
        } else if ("asideTab" in data) {
            switchAsideTab(data.asideTab);
        } else if ("peekToggle" in data) {
            onPeekToggle(target);
        } else if ("tableRef" in data) {
            focusTable(data.tableRef);
        } else if ("schemaOpen" in data) {
            openSchemaModal();
        } else if ("schemaClose" in data) {
            closeSchemaModal();
        } else if ("schemaReset" in data) {
            resetSchema();
        } else if ("modalTable" in data) {
            onModalTable(target);
        } else if ("markRead" in data && lesson) {
            /* ссылка «Следующий урок» работает как обычно, мы только отмечаем прочитанное */
            progress.markRead(lesson.id);
        }
    }

    function onChange(event) {
        if (!active || !event.target.matches("input[type='radio']")) {
            return;
        }

        const group = event.target.closest("fieldset");

        group?.querySelectorAll(".sql-choice").forEach(label => label.classList.remove("is-chosen"));
        event.target.closest(".sql-choice")?.classList.add("is-chosen");
    }

    function onKey(event) {
        if (active && event.key === "Escape") {
            closeSchemaModal();
        }
    }

    root.addEventListener("click", onClick);
    root.addEventListener("change", onChange);
    document.addEventListener("keydown", onKey);

    progress.onChange(refreshChrome);

    return {
        render,
        syncUser,
        progress,

        leave() {
            active = false;
            pageToken++;
            destroyEditor();
            stopWatchingReading();
            closeSchemaModal();
        },

        flush: () => progress.flush(),

        currentRoute: () => parseRoute(window.location.hash)
    };
}
