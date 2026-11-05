import { Header } from "../components/Header.js";
import { gitHash, parseRoute } from "../courses/router.js";
import { renderNotice } from "../sql/views/resultTable.js";
import { checkOutput } from "./check.js";
import { findGitLesson, gitLessons } from "./lessons/index.js";
import { loadProfile, saveProfile, validators } from "./profile.js";
import { createGitProgress } from "./progress.js";
import { tokenText } from "./markup.js";
import { renderAside, renderAsideBody } from "./views/aside.js";
import { renderProgress, renderSidebar, statusKey } from "./views/nav.js";
import { renderLessonPage, renderQuiz, renderSolved, renderSteps, stepDone, stepsComplete } from "./views/page.js";

const READ_DELAY_MS = 2500;

/*
 * Курс «Git и проект» целиком: страница урока, профиль «Мой проект», проверка вставленного
 * вывода, тесты, прогресс. Команды git курс не запускает: их ученик выполняет у себя.
 *
 * main.js говорит только, что показать: render({ lessonId, user, authReady }).
 */
export function createGitCourseApp({
    root,
    storage = null,
    supabaseClient = null,
    progress = createGitProgress({ storage, supabaseClient })
}) {
    let active = false;
    let user = null;
    let pageId = null;
    let asideTab = "project";
    let renderedKey = "";
    let readObserver = null;
    let readTimer = null;
    let profile = loadProfile(storage);

    const stepStates = new Map();
    const quizAnswers = new Map();
    const quizChecked = new Set();

    const $ = selector => root.querySelector(selector);

    const currentLesson = () => findGitLesson(pageId);

    /* ------------------------------ шаги ------------------------------ */

    function readDone(lesson) {
        try {
            const raw = progress.getProgress().lessons[lesson.id]?.draft;
            const list = raw ? JSON.parse(raw) : [];

            return new Set(Array.isArray(list) ? list.filter(Number.isInteger) : []);
        } catch {
            return new Set();
        }
    }

    /* Состояние шагов: отметки (они запоминаются), вставленный вывод и сообщения проверки (только на странице). */
    function stepState(lesson) {
        if (!stepStates.has(lesson.id)) {
            stepStates.set(lesson.id, { done: readDone(lesson), drafts: {}, messages: {} });
        }

        return stepStates.get(lesson.id);
    }

    function saveDone(lesson) {
        /* В облако уходят только номера отметок, без вставленного вывода: в нём могут быть имя и почта. */
        progress.saveDraft(lesson.id, JSON.stringify([...stepState(lesson).done].sort((a, b) => a - b)));
    }

    function refreshSteps(lesson, focusSelector = null) {
        const box = $("[data-steps]");

        if (!box) {
            return;
        }

        box.outerHTML = renderSteps(lesson, stepState(lesson), profile);

        if (focusSelector) {
            $(focusSelector)?.focus();
        }
    }

    /* Отметки шагов-полей обновляются на месте: страница не перерисовывается, поле не теряет фокус. */
    function updateFieldMarks(lesson) {
        const box = $("[data-steps]");

        if (!box) {
            return;
        }

        const state = stepState(lesson);
        const items = lesson.task.items;
        let doneCount = 0;

        box.querySelectorAll(":scope > ol > li.git-step").forEach((li, index) => {
            const done = stepDone(items[index], index, state, profile);
            const mark = li.querySelector(".git-step__mark");

            doneCount += done ? 1 : 0;
            li.classList.toggle("is-done", done);

            if (mark) {
                mark.textContent = done ? "✓" : String(index + 1);
            }
        });

        const count = box.querySelector(".git-steps__count strong");

        if (count) {
            count.textContent = `${doneCount} из ${items.length}`;
        }
    }

    function checkLessonDone(lesson) {
        if (lesson.task.kind === "steps" && stepsComplete(lesson.task, stepState(lesson), profile)) {
            solve(lesson);
        }
    }

    function onStepToggle(lesson, input) {
        const index = Number(input.dataset.stepToggle);
        const state = stepState(lesson);

        if (input.checked) {
            state.done.add(index);
        } else {
            state.done.delete(index);
        }

        saveDone(lesson);
        refreshSteps(lesson, `[data-step-toggle="${index}"]`);
        checkLessonDone(lesson);
    }

    function onStepCheck(lesson, index) {
        const state = stepState(lesson);
        const item = lesson.task.items[index];
        const text = $(`[data-step-input="${index}"]`)?.value ?? "";
        const verdict = checkOutput(text, item.check.patterns, profile);

        state.drafts[index] = text;
        state.messages[index] = { ok: verdict.ok, lines: verdict.missing };

        if (verdict.ok) {
            state.done.add(index);
            saveDone(lesson);
        }

        refreshSteps(lesson, `[data-step-check="${index}"]`);
        checkLessonDone(lesson);
    }

    /* ------------------------------ тест ------------------------------ */

    function onQuizSubmit(lesson) {
        const answers = lesson.task.questions.map((_, index) => {
            const selected = root.querySelector(`input[name='q${index}']:checked`);

            return selected ? Number(selected.value) : null;
        });

        quizAnswers.set(lesson.id, answers);
        quizChecked.add(lesson.id);
        $("[data-quiz]").outerHTML = renderQuiz(lesson, { answers, checked: true, profile });

        if (answers.every((value, index) => value === lesson.task.questions[index].correct)) {
            solve(lesson);
        }
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
            box.innerHTML = renderSolved(lesson, profile);
        }
    }

    /* ------------------------------ «Мой проект» ------------------------------ */

    /* Значения, переключатели и поля обновляются на месте, страница не перерисовывается. */
    function applyProfile() {
        const app = $(".git-app");

        if (app) {
            app.dataset.os = profile.os;
            app.dataset.mode = profile.mode;
        }

        root.querySelectorAll("[data-token]").forEach(node => {
            const token = node.dataset.token;

            node.textContent = tokenText(token, profile, node.dataset.ctx);
            node.classList.toggle("git-val--empty", !profile[token]);
        });

        root.querySelectorAll("[data-set-os]").forEach(button => {
            const on = button.dataset.setOs === profile.os;

            button.classList.toggle("is-on", on);
            button.setAttribute("aria-pressed", String(on));
        });

        root.querySelectorAll("[data-set-mode]").forEach(button => {
            const on = button.dataset.setMode === profile.mode;

            button.classList.toggle("is-on", on);
            button.setAttribute("aria-pressed", String(on));
        });
    }

    function onFieldInput(input) {
        const key = input.dataset.field;
        const value = input.value.trim();
        const valid = validators[key](value);

        profile = { ...profile, [key]: valid ? value : "" };
        saveProfile(storage, profile);
        input.setAttribute("aria-invalid", String(value !== "" && !valid));

        /* то же поле может стоять и в панели, и в шаге */
        root.querySelectorAll(`[data-field="${key}"]`).forEach(other => {
            if (other !== input) {
                other.value = input.value;
                other.setAttribute("aria-invalid", String(value !== "" && !valid));
            }
        });

        applyProfile();

        const lesson = currentLesson();

        if (lesson?.task.kind === "steps") {
            updateFieldMarks(lesson);
            checkLessonDone(lesson);
        }
    }

    function onSetting(name, value) {
        profile = { ...profile, [name]: value };
        saveProfile(storage, profile);
        applyProfile();
    }

    function openProfile() {
        switchAsideTab("project");

        const aside = $("#git-aside");
        const input = [...root.querySelectorAll("#git-aside [data-field]")].find(field => !field.value) || $("#git-aside [data-field]");

        aside?.scrollIntoView?.({ block: "start", behavior: "smooth" });
        input?.focus({ preventScroll: true });
    }

    async function onCopy(button) {
        const block = button.closest("[data-cmd-block]");
        const empty = block.querySelector(".git-val--empty");

        if (empty) {
            flash(button, "Сначала заполните «Мой проект»");
            openProfile();
            return;
        }

        const text = [...block.querySelectorAll(".git-cmd__code .git-line")].map(line => line.textContent).join("\n");

        try {
            await navigator.clipboard.writeText(text);
            flash(button, "Скопировано");
        } catch {
            flash(button, "Выделите и скопируйте вручную");
        }
    }

    function flash(button, text) {
        const original = button.dataset.label || button.textContent;

        button.dataset.label = original;
        button.textContent = text;
        clearTimeout(button._flash);
        button._flash = setTimeout(() => {
            button.textContent = original;
        }, 2200);
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
            $("[data-aside-body]").innerHTML = renderAsideBody("cheat", state, profile);
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

        const body = $("[data-aside-body]");

        body.innerHTML = renderAsideBody(tab, progress.getProgress(), profile);
        applyProfile();
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
            <div class="app sql-app git-app" data-os="${profile.os}" data-mode="${profile.mode}">
                ${Header({ user, course: "git", summary: renderProgress(state) })}
                <div class="sql-layout">
                    <div class="sql-sidebar">${renderSidebar(pageId, state)}</div>
                    <main class="sql-main">${content}</main>
                    ${renderAside(state, profile, asideTab)}
                </div>
            </div>
        `;
    }

    function resolvePage(lessonId) {
        if (lessonId && findGitLesson(lessonId)) {
            return lessonId;
        }

        const saved = progress.getProgress().currentLesson?.id;

        return saved && findGitLesson(saved) ? saved : gitLessons[0].id;
    }

    function restoreSidebarScroll(previousTop) {
        const sidebar = root.querySelector(".git-app .sql-sidebar");

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
        const previousSidebarTop = root.querySelector(".git-app .sql-sidebar")?.scrollTop ?? null;

        active = true;
        user = args.user ?? null;
        stopWatchingReading();

        const requested = args.lessonId ?? null;

        pageId = resolvePage(requested);

        /* Адрес без урока заменяем адресом найденного урока, не создавая запись в истории. */
        if (requested !== pageId) {
            window.history.replaceState(null, "", gitHash(pageId));
        }

        const lesson = currentLesson();
        const state = progress.getProgress();

        /* Отметки могли прийти из облака после входа: читаем их заново. */
        stepStates.delete(lesson.id);

        const content = renderLessonPage(lesson, {
            solved: Boolean(state.lessons[lesson.id]?.solved),
            answers: quizAnswers.get(lesson.id) ?? [],
            checked: quizChecked.has(lesson.id),
            steps: lesson.task.kind === "steps" ? stepState(lesson) : null,
            profile
        });

        root.innerHTML = chrome(content);
        renderedKey = solvedKey();
        restoreSidebarScroll(previousSidebarTop);

        progress.setCurrentLesson(lesson.id);
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

    function onClick(event) {
        if (!active) {
            return;
        }

        const target = event.target.closest(
            "[data-quiz-submit],[data-aside-tab],[data-mark-read],[data-copy],[data-set-os],[data-set-mode],[data-open-profile],[data-step-check]"
        );

        if (!target) {
            return;
        }

        const lesson = currentLesson();
        const data = target.dataset;

        if ("quizSubmit" in data && lesson) {
            onQuizSubmit(lesson);
        } else if ("asideTab" in data) {
            switchAsideTab(data.asideTab);
        } else if ("copy" in data) {
            onCopy(target);
        } else if ("setOs" in data) {
            onSetting("os", data.setOs);
        } else if ("setMode" in data) {
            onSetting("mode", data.setMode);
        } else if ("openProfile" in data) {
            openProfile();
        } else if ("stepCheck" in data && lesson) {
            onStepCheck(lesson, Number(data.stepCheck));
        } else if ("markRead" in data && lesson) {
            progress.markRead(lesson.id);
        }
    }

    function onChange(event) {
        if (!active) {
            return;
        }

        const lesson = currentLesson();

        if (event.target.matches("input[type='radio']")) {
            const group = event.target.closest("fieldset");

            group?.querySelectorAll(".sql-choice").forEach(label => label.classList.remove("is-chosen"));
            event.target.closest(".sql-choice")?.classList.add("is-chosen");
        } else if (event.target.matches("[data-step-toggle]") && lesson) {
            onStepToggle(lesson, event.target);
        }
    }

    function onInput(event) {
        if (!active) {
            return;
        }

        if (event.target.matches("[data-field]")) {
            onFieldInput(event.target);
        } else if (event.target.matches("[data-step-input]")) {
            const lesson = currentLesson();

            if (lesson) {
                stepState(lesson).drafts[Number(event.target.dataset.stepInput)] = event.target.value;
            }
        }
    }

    root.addEventListener("click", onClick);
    root.addEventListener("change", onChange);
    root.addEventListener("input", onInput);

    progress.onChange(refreshChrome);

    return {
        render,
        syncUser,
        progress,

        leave() {
            active = false;
            stopWatchingReading();
        },

        flush: () => progress.flush(),

        currentRoute: () => parseRoute(window.location.hash)
    };
}
