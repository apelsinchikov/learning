import { Header } from "../components/Header.js";
import { diagramsHash, parseRoute } from "../courses/router.js";
import { checkDiagram, parseDiagram } from "./compare/index.js";
import { createDiagramEditor } from "./diagramEditor.js";
import { humanizeDiagramError } from "./errors.js";
import { diagramLessons, findDiagramLesson, isDiagramTask } from "./lessons/index.js";
import { createMermaidRenderer } from "./mermaidRenderer.js";
import { createDiagramsProgress } from "./progress.js";
import { renderAside, renderCheatSheet, renderFolder } from "./views/aside.js";
import { renderDiagramsProgress, renderDiagramsSidebar, statusKey } from "./views/nav.js";
import {
    SANDBOX_TEMPLATES,
    isOrderCorrect,
    orderOf,
    renderErrorBox,
    renderHints,
    renderLessonPage,
    renderNotice,
    renderQuiz,
    renderSandboxPage,
    renderSolved
} from "./views/task.js";
import { collectFolder } from "./views/aside.js";

const SANDBOX_KEY = "diagrams-sandbox-v1";
const READ_DELAY_MS = 2500;
const PREVIEW_DELAY_MS = 350;

/* Тип диаграммы по первому слову (для песочницы, где тип заранее не известен). */
export function detectKind(text) {
    const first = String(text).split("\n").map(line => line.trim()).find(line => line && !line.startsWith("%%")) || "";

    if (first.startsWith("erDiagram")) {
        return "er";
    }

    return first.startsWith("sequenceDiagram") ? "sequence" : null;
}

/*
 * Курс «Диаграммы» целиком: страница урока, редактор с картинкой, проверка,
 * прогресс, «Папка проекта». Создаётся один раз при первом заходе на #/diagrams
 * и живёт до закрытия вкладки.
 *
 * main.js только говорит, что показать: render({ lessonId, user, authReady }).
 * renderer и createEditor можно подменить (в тестах и при проверке в браузере).
 */
export function createDiagramsCourseApp({
    root,
    storage = null,
    supabaseClient = null,
    renderer = createMermaidRenderer(),
    createEditor = createDiagramEditor,
    progress = createDiagramsProgress({ storage, supabaseClient })
}) {
    let active = false;
    let user = null;
    let pageId = null;
    let asideTab = "folder";
    let renderedKey = "";
    let readObserver = null;
    let readTimer = null;
    let pageToken = 0;

    const hintsShown = new Map();
    const quizStates = new Map();
    const benches = new Map();
    const pictures = new Map();

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
            /* без хранилища текст просто не запомнится */
        }
    }

    /* ------------------------------ картинки ------------------------------ */

    function explain(raw, kind, text) {
        const detected = kind === "any" ? detectKind(text) : kind;
        const parsed = detected ? parseDiagram(detected, text) : null;

        return humanizeDiagramError(raw, { kind: detected || kind, parsed, text });
    }

    function failureBox(result, kind, text) {
        if (result.fatal) {
            return renderErrorBox({
                title: "Не удалось загрузить Mermaid",
                text: "Обновите страницу и попробуйте ещё раз. Если не помогло, проверьте соединение."
            });
        }

        return renderErrorBox(explain(result.error, kind, text));
    }

    /* Рисует картинку в элемент. Одинаковый код не рисуем заново. */
    async function drawInto(element, code, kind) {
        const token = pageToken;

        if (!pictures.has(code)) {
            const result = await renderer.render(code);

            if (token !== pageToken) {
                return;
            }

            if (result.ok) {
                pictures.set(code, result.svg);
            } else {
                element.innerHTML = failureBox(result, kind, code);
                return;
            }
        }

        if (token === pageToken) {
            element.innerHTML = pictures.get(code);
        }
    }

    function hydrateFigures() {
        root.querySelectorAll("[data-diagram-code]").forEach(figure => {
            const target = figure.querySelector("[data-figure-picture]");

            drawInto(target, figure.dataset.diagramCode, figure.dataset.diagramKind);
        });
    }

    function hydrateFolder() {
        root.querySelectorAll("[data-folder-card]").forEach(card => {
            const target = card.querySelector("[data-folder-picture]");
            const code = card.querySelector("[data-folder-code]").dataset.folderCode;

            drawInto(target, code, card.dataset.folderKind);
        });
    }

    /* ------------------------------ редакторы с картинкой ------------------------------ */

    const benchText = bench => (bench.editor ? bench.editor.state.doc.toString() : "");

    function setBenchText(id, text) {
        const bench = benches.get(id);

        if (bench && bench.editor) {
            bench.editor.dispatch({ changes: { from: 0, to: bench.editor.state.doc.length, insert: text } });
        }
    }

    async function drawBench(bench) {
        const token = pageToken;
        const drawToken = ++bench.token;
        const text = benchText(bench);

        if (!text.trim()) {
            bench.preview.innerHTML = `<p class="dg-preview__empty">Здесь появится картинка.</p>`;
            bench.errorBox.hidden = true;
            bench.lastGood = "";
            return;
        }

        const result = await renderer.render(text);

        if (token !== pageToken || drawToken !== bench.token) {
            return;
        }

        if (result.ok) {
            bench.lastGood = result.svg;
            bench.preview.innerHTML = result.svg;
            bench.preview.classList.remove("is-stale");
            bench.errorBox.hidden = true;
            bench.errorBox.innerHTML = "";
            return;
        }

        bench.errorBox.innerHTML = failureBox(result, bench.kind, text);
        bench.errorBox.hidden = false;

        /* Последняя удачная картинка остаётся, но тускнеет: ученик видит, что она старая. */
        if (bench.lastGood) {
            bench.preview.classList.add("is-stale");
        } else {
            bench.preview.innerHTML = `<p class="dg-preview__empty">Картинки пока нет: сначала исправьте ошибку.</p>`;
        }
    }

    function scheduleDraw(bench) {
        clearTimeout(bench.timer);
        bench.timer = setTimeout(() => drawBench(bench), PREVIEW_DELAY_MS);
    }

    function mountBench(id, { kind, initial, onChange = null, onSubmit = null }) {
        const host = root.querySelector(`[data-bench="${id}"]`);

        if (!host) {
            return;
        }

        const bench = {
            id,
            kind,
            host,
            preview: host.querySelector("[data-preview]"),
            errorBox: host.querySelector("[data-bench-error]"),
            editor: null,
            timer: null,
            token: 0,
            lastGood: ""
        };

        bench.editor = createEditor(host.querySelector("[data-editor]"), initial, {
            onChange(text) {
                if (onChange) {
                    onChange(text);
                }

                scheduleDraw(bench);
            },
            onSubmit
        });

        benches.set(id, bench);
        drawBench(bench);
    }

    function destroyBenches() {
        for (const bench of benches.values()) {
            clearTimeout(bench.timer);

            if (bench.editor) {
                bench.editor.destroy();
            }
        }

        benches.clear();
    }

    /* ------------------------------ проверка и решение ------------------------------ */

    function setOutput(html) {
        const box = $("[data-output]");

        if (box) {
            box.innerHTML = html;
        }
    }

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

    async function checkDiagramTask(lesson) {
        const bench = benches.get("task");

        if (!bench) {
            return;
        }

        const token = pageToken;
        const text = benchText(bench);
        const { task } = lesson;

        setOutput(renderNotice("info", "Проверяю…", ""));

        const rendered = await renderer.render(text);

        if (token !== pageToken) {
            return;
        }

        if (!rendered.ok) {
            setOutput(failureBox(rendered, task.diagram, text));
            return;
        }

        const verdict = checkDiagram(task.diagram, text, task.solution, task.check || {});

        if (!verdict.ok) {
            setOutput(renderNotice("warning", "Пока не то", verdict.issues.map(issue => issue.message).join(" ")));
            return;
        }

        setOutput("");
        solve(lesson);
    }

    /* ------------------------------ вопросы ------------------------------ */

    function quizState(lesson) {
        if (!quizStates.has(lesson.id)) {
            quizStates.set(lesson.id, { choices: {}, orders: {}, results: {} });
        }

        return quizStates.get(lesson.id);
    }

    function redrawQuiz(lesson) {
        const box = $("[data-quiz]");

        if (box) {
            box.innerHTML = renderQuiz(lesson, quizState(lesson));
        }
    }

    function onOrderMove(lesson, spec) {
        const [questionIndex, position, direction] = spec.split(":");
        const index = Number(questionIndex);
        const from = Number(position);
        const to = direction === "up" ? from - 1 : from + 1;
        const state = quizState(lesson);
        const order = [...orderOf(lesson.task.questions[index], state, index)];

        if (to < 0 || to >= order.length) {
            return;
        }

        [order[from], order[to]] = [order[to], order[from]];
        state.orders[index] = order;
        delete state.results[index];
        redrawQuiz(lesson);
    }

    function onQuizSubmit(lesson) {
        const state = quizState(lesson);
        const { questions } = lesson.task;
        const unanswered = questions.some((question, index) => question.type === "choice" && state.choices[index] === undefined);

        if (unanswered) {
            setOutput(renderNotice("info", "Ответьте на все вопросы", "У некоторых вопросов не выбран вариант."));
            return;
        }

        setOutput("");

        questions.forEach((question, index) => {
            state.results[index] =
                question.type === "order"
                    ? isOrderCorrect(question, orderOf(question, state, index))
                    : state.choices[index] === question.correct;
        });

        redrawQuiz(lesson);

        if (questions.every((_, index) => state.results[index] === true)) {
            solve(lesson);
        }
    }

    function onChoiceChange(input) {
        const lesson = findDiagramLesson(pageId);

        if (!lesson || lesson.task.kind !== "quiz") {
            return;
        }

        const index = Number(input.name.slice(1));
        const state = quizState(lesson);

        state.choices[index] = Number(input.value);
        delete state.results[index];

        input
            .closest(".sql-choices")
            .querySelectorAll(".sql-choice")
            .forEach(label => label.classList.remove("is-chosen"));
        input.closest(".sql-choice").classList.add("is-chosen");

        const fieldset = input.closest(".dg-question");

        fieldset.classList.remove("is-right", "is-wrong");
        fieldset.querySelector(".sql-notice")?.remove();
    }

    /* ------------------------------ боковые панели ------------------------------ */

    const solvedKey = () => statusKey(progress.getProgress());

    function refreshAsideBody() {
        const body = $("[data-aside-body]");

        if (!body) {
            return;
        }

        const state = progress.getProgress();

        body.innerHTML = asideTab === "cheat" ? renderCheatSheet(state) : renderFolder(state);

        if (asideTab === "folder") {
            hydrateFolder();
        }

        const badge = $("[data-aside-tab='folder']");

        if (badge) {
            const count = collectFolder(state).length;

            badge.innerHTML = `Папка проекта${count ? ` <span class="sql-badge">${count}</span>` : ""}`;
        }
    }

    function refreshChrome() {
        if (!active || !$(".dg-nav")) {
            return;
        }

        const key = solvedKey();

        if (key === renderedKey) {
            return;
        }

        renderedKey = key;

        const state = progress.getProgress();

        $(".dg-nav").outerHTML = renderDiagramsSidebar(pageId, state);

        const summary = $(".header__progress");

        if (summary) {
            summary.outerHTML = renderDiagramsProgress(state);
        }

        refreshAsideBody();

        const lesson = findDiagramLesson(pageId);
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

        const body = $("[data-aside-body]");
        const state = progress.getProgress();

        body.innerHTML = tab === "cheat" ? renderCheatSheet(state) : renderFolder(state);

        if (tab === "folder") {
            hydrateFolder();
        }
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

    /*
     * Урок считается прочитанным, когда читатель дошёл до задачи и побыл на ней
     * пару секунд (а не просто пролистал). Ещё урок отмечается при нажатии
     * «Следующий урок» внизу страницы.
     */
    function watchReading(lesson) {
        stopWatchingReading();

        const task = lesson && $(".sql-task");

        if (!task || progress.getProgress().lessons[lesson.id]?.read || typeof IntersectionObserver === "undefined") {
            return;
        }

        readObserver = new IntersectionObserver(
            entries => {
                const visible = entries.some(entry => entry.isIntersecting);

                clearTimeout(readTimer);

                if (visible) {
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
            <div class="app sql-app dg-app">
                ${Header({ user, course: "diagrams", summary: renderDiagramsProgress(state) })}
                <div class="sql-layout">
                    <div class="sql-sidebar">${renderDiagramsSidebar(pageId, state)}</div>
                    <main class="sql-main">${content}</main>
                    ${renderAside(state, { tab: asideTab })}
                </div>
            </div>
        `;
    }

    function resolvePage(lessonId) {
        if (lessonId === "sandbox") {
            return "sandbox";
        }

        if (lessonId && findDiagramLesson(lessonId)) {
            return lessonId;
        }

        const saved = progress.getProgress().currentLesson?.id;

        return saved && findDiagramLesson(saved) ? saved : diagramLessons[0].id;
    }

    function render(args = {}) {
        active = true;
        user = args.user ?? null;

        pageToken++;
        destroyBenches();
        stopWatchingReading();

        const requested = args.lessonId ?? null;

        pageId = resolvePage(requested);

        /* Адрес без урока заменяем адресом найденного урока, не создавая запись в истории. */
        if (requested !== pageId) {
            window.history.replaceState(null, "", diagramsHash(pageId));
        }

        const lesson = pageId === "sandbox" ? null : findDiagramLesson(pageId);
        const state = progress.getProgress();

        let content;
        let tryits = [];

        if (lesson) {
            const page = renderLessonPage(lesson, {
                solved: Boolean(state.lessons[lesson.id]?.solved),
                hintsShown: hintsShown.get(lesson.id) ?? 0,
                quiz: quizState(lesson)
            });

            content = page.html;
            tryits = page.tryits;
        } else {
            content = renderSandboxPage();
        }

        root.innerHTML = chrome(content);
        renderedKey = solvedKey();

        hydrateFigures();
        hydrateFolder();

        for (const tryit of tryits) {
            mountBench(tryit.id, { kind: tryit.kind, initial: tryit.code });
        }

        if (lesson && isDiagramTask(lesson)) {
            const draft = state.lessons[lesson.id]?.draft;

            mountBench("task", {
                kind: lesson.task.diagram,
                initial: draft ?? lesson.task.starter,
                onChange: text => progress.saveDraft(lesson.id, text),
                onSubmit: () => checkDiagramTask(lesson)
            });
        } else if (!lesson) {
            mountBench("sandbox", {
                kind: "any",
                initial: readStore(SANDBOX_KEY) ?? SANDBOX_TEMPLATES[0].code,
                onChange: text => writeStore(SANDBOX_KEY, text)
            });
        }

        if (lesson) {
            progress.setCurrentLesson(lesson.id);
        }

        watchReading(lesson);

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

    function onHint(lesson) {
        const next = Math.min((hintsShown.get(lesson.id) ?? 0) + 1, lesson.task.hints.length);

        hintsShown.set(lesson.id, next);

        $("[data-hints]").innerHTML = renderHints(lesson, next);
    }

    async function copyCode(lessonId, button) {
        const item = collectFolder(progress.getProgress()).find(entry => entry.lessonId === lessonId);

        if (!item) {
            return;
        }

        try {
            await navigator.clipboard.writeText(item.code);
            button.textContent = "Скопировано";
        } catch {
            button.textContent = "Не удалось скопировать";
        }

        setTimeout(() => {
            button.textContent = "Скопировать код";
        }, 1800);
    }

    function onClick(event) {
        if (!active) {
            return;
        }

        const target = event.target.closest(
            "[data-check],[data-reset],[data-hint],[data-quiz-submit],[data-order-move],[data-diagram-sandbox],[data-template],[data-aside-tab],[data-copy-folder],[data-mark-read]"
        );

        if (!target) {
            return;
        }

        const lesson = findDiagramLesson(pageId);
        const data = target.dataset;

        if ("check" in data && lesson) {
            checkDiagramTask(lesson);
        } else if ("reset" in data) {
            setBenchText(lesson ? "task" : "sandbox", lesson ? lesson.task.starter : "");
            setOutput("");
        } else if ("hint" in data && lesson) {
            onHint(lesson);
        } else if ("quizSubmit" in data && lesson) {
            onQuizSubmit(lesson);
        } else if ("orderMove" in data && lesson) {
            onOrderMove(lesson, data.orderMove);
        } else if ("diagramSandbox" in data) {
            writeStore(SANDBOX_KEY, target.closest("[data-diagram-code]").dataset.diagramCode);
            window.location.hash = diagramsHash("sandbox");
        } else if ("template" in data) {
            const template = SANDBOX_TEMPLATES.find(item => item.id === data.template);

            if (template) {
                setBenchText("sandbox", template.code);
            }
        } else if ("asideTab" in data) {
            switchAsideTab(data.asideTab);
        } else if ("copyFolder" in data) {
            copyCode(data.copyFolder, target);
        } else if ("markRead" in data && lesson) {
            /* ссылка «Следующий урок» работает как обычно, мы только отмечаем прочитанное */
            progress.markRead(lesson.id);
        }
    }

    function onChange(event) {
        if (active && event.target.matches("input[type='radio'][name^='q']")) {
            onChoiceChange(event.target);
        }
    }

    root.addEventListener("click", onClick);
    root.addEventListener("change", onChange);

    progress.onChange(refreshChrome);

    return {
        render,
        syncUser,
        progress,

        leave() {
            active = false;
            pageToken++;
            destroyBenches();
            stopWatchingReading();
        },

        flush: () => progress.flush(),

        currentRoute: () => parseRoute(window.location.hash)
    };
}
