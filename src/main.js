import "./styles/main.css";

import { App } from "./components/App.js";
import { course } from "./data/course.js";
import { validateLesson } from "./utils/validator.js";
import { startMockApi } from "./mock/mockApi.js";

import { createYamlEditor } from "./editor/createEditor.js";
import { renderMermaid } from "./ui/mermaid.js";
import { initCopyGuard } from "./ui/copyGuard.js";
import { bindLessonList, initNavigation } from "./ui/navigation.js";
import { showSwagger, showValidationErrors } from "./ui/swaggerPreview.js";

import { Sidebar } from "./components/Sidebar.js";
import { ProgressSummary } from "./components/ProgressSummary.js";
import { ENABLED_PROVIDERS } from "./auth/config.js";
import { createSupabaseClient } from "./auth/supabaseClient.js";
import { createAuthService } from "./auth/authService.js";
import { initAuth } from "./auth/initAuth.js";
import { createCloudStore } from "./progress/cloudStore.js";
import { createLocalStore } from "./progress/localStore.js";
import { getDraft, isLessonDone } from "./progress/progressModel.js";
import { createProgressService } from "./progress/progressService.js";
import { parseRoute, rememberReturnRoute, takeReturnRoute } from "./courses/router.js";


let currentLessonIndex = 0;
let currentUser = null;

/* Какой курс открыт: "openapi" (по умолчанию) или "sql" (адрес #/sql...). */
let activeCourse = parseRoute(window.location.hash).course;
let sqlApp = null;
let sqlLoading = null;
let authReady = false;

const app = document.querySelector("#app");

startMockApi();
initCopyGuard();


/* =========================================================
   Вход и прогресс
   ========================================================= */

function getStorage() {
    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

/*
 * Вход идёт через Google/Яндекс и возвращает на главную без хеша.
 * Перед уходом запоминаем, где был человек (курс SQL живёт в хеше),
 * а после возврата открываем ту же страницу.
 */
document.addEventListener(
    "click",
    event => {
        if (event.target.closest("[data-provider]")) {
            rememberReturnRoute(getStorage(), window.location.hash);
        }
    },
    true
);

{
    const url = new URL(window.location.href);
    const returnedFromLogin = ["code", "error"].some(name => url.searchParams.has(name));
    const savedRoute = takeReturnRoute(getStorage(), window.location.hash);

    if (savedRoute && returnedFromLogin) {
        window.location.hash = savedRoute;
        activeCourse = parseRoute(savedRoute).course;
    }
}

const supabase = createSupabaseClient();

const progressService = createProgressService({
    localStore: createLocalStore(getStorage()),
    cloudStore: createCloudStore(supabase)
});

const authService = createAuthService(supabase, {
    redirectTo: window.location.origin + import.meta.env.BASE_URL,

    /* после возврата из Google/Яндекса убираем служебные параметры из адреса */
    cleanUrl() {
        const url = new URL(window.location.href);

        for (const name of ["code", "error", "error_code", "error_description"]) {
            url.searchParams.delete(name);
        }

        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    }
});

function goToSavedLesson() {
    const savedId = progressService.getProgress().currentLesson?.id;
    const index = course.findIndex(lesson => lesson.id === savedId);

    if (index >= 0) {
        currentLessonIndex = index;
    }
}

function goToLesson(index) {
    currentLessonIndex = index;
    renderApp({ scrollToTop: true });
}

/* Какие уроки отмечены — по этому ключу видно, нужно ли перерисовать сайдбар. */
function doneKey() {
    const progress = progressService.getProgress();

    return course.map(lesson => (isLessonDone(lesson, progress) ? "1" : "0")).join("");
}

let renderedDoneKey = "";

function refreshSidebarIfNeeded() {
    const sidebar = document.querySelector(".sidebar");
    const key = doneKey();

    if (!sidebar || key === renderedDoneKey) {
        return;
    }

    renderedDoneKey = key;

    sidebar.outerHTML = Sidebar(currentLessonIndex, progressService.getProgress());
    bindLessonList(goToLesson);

    const summary = document.querySelector(".header__progress");

    if (summary) {
        summary.outerHTML = ProgressSummary(progressService.getProgress());
    }
}

function showSyncNotice() {
    if (document.querySelector(".sync-notice")) {
        return;
    }

    const notice = document.createElement("div");

    notice.className = "sync-notice";
    notice.textContent = "Не удалось сохранить прогресс, попробуем позже.";
    document.body.appendChild(notice);

    setTimeout(() => notice.remove(), 5000);
}

progressService.onChange(refreshSidebarIfNeeded);
progressService.onSyncError(showSyncNotice);

window.addEventListener("pagehide", () => {
    progressService.flush();

    if (sqlApp) {
        sqlApp.flush();
    }
});

initAuth({
    authService,
    providers: ENABLED_PROVIDERS,

    async onLogout() {
        try {
            await progressService.flush();
            await authService.signOut();
        } catch (error) {
            console.error(error);
        }
    }
});

authService.onAuthChange(async user => {
    authReady = true;

    /* Курс SQL сам проверяет, тот ли это пользователь, и не дублирует работу. */
    if (sqlApp) {
        sqlApp.syncUser(user);
    }

    if (user && user.id === progressService.getUserId()) {
        return;
    }

    currentUser = user;

    if (user) {
        await progressService.signedIn(user.id);
        goToSavedLesson();
    } else {
        progressService.signedOut();
        currentLessonIndex = 0;
    }

    renderApp({ scrollToTop: true });
});


/* =========================================================
   Практический урок: редактор + проверка
   ========================================================= */

function initializePracticeLesson(lesson) {
    const checkButton = document.querySelector("#check-button");
    const swaggerPreview = document.querySelector("#swagger-preview");
    const editorElement = document.querySelector("#yaml-editor");

    if (!checkButton || !swaggerPreview || !editorElement) {
        return;
    }

    const savedDraft = getDraft(progressService.getProgress(), lesson.id);

    const yamlEditor = createYamlEditor(
        editorElement,
        savedDraft ?? lesson.initialYaml,
        { onChange: text => progressService.saveDraft(lesson.id, text) }
    );

    checkButton.addEventListener("click", async () => {
        const yamlText = yamlEditor.state.doc.toString();

        const result = await validateLesson(lesson, yamlText);

        const hasErrors =
            result.openapiErrors.length > 0 ||
            result.taskErrors.length > 0;

        if (hasErrors) {
            showValidationErrors(swaggerPreview, result);
            return;
        }

        progressService.markSolved(lesson.id);

        showSwagger(swaggerPreview, yamlText, lesson.successMessage);
    });
}


/* =========================================================
   Отрисовка урока
   ========================================================= */

async function renderApp({ scrollToTop = false } = {}) {
    if (activeCourse === "sql") {
        renderSql();
        return;
    }

    app.innerHTML = App(currentLessonIndex, {
        progress: progressService.getProgress(),
        user: currentUser
    });

    renderedDoneKey = doneKey();

    /*
     * Сначала HTML урока должен попасть в DOM.
     * После этого Mermaid находит .mermaid и строит SVG.
     */
    await renderMermaid();

    const lesson = course[currentLessonIndex];

    if (lesson.type === "practice") {
        initializePracticeLesson(lesson);
    }

    progressService.setCurrentLesson(lesson.id);

    initNavigation(currentLessonIndex, goToLesson, {
        onNext() {
            if (lesson.type === "theory") {
                progressService.markRead(lesson.id);
            }
        }
    });

    if (scrollToTop) {
        window.scrollTo({ top: 0, left: 0 });
    }
}


/* =========================================================
   Курс SQL
   =========================================================

   Код курса грузится отдельным куском и только когда его открывают,
   поэтому тем, кто учит OpenAPI, он ничего не стоит.
*/

async function renderSql() {
    activeCourse = "sql";

    try {
        if (!sqlApp) {
            sqlLoading = sqlLoading || import("./sql/sqlApp.js");

            const { createSqlCourseApp } = await sqlLoading;

            if (!sqlApp) {
                sqlApp = createSqlCourseApp({
                    root: app,
                    storage: getStorage(),
                    supabaseClient: supabase
                });

                if (authReady) {
                    sqlApp.syncUser(currentUser);
                }
            }
        }

        /* Пока грузился код, человек мог уйти обратно к OpenAPI. */
        if (activeCourse !== "sql") {
            return;
        }

        sqlApp.render({
            lessonId: parseRoute(window.location.hash).lessonId,
            user: currentUser,
            authReady
        });
    } catch (error) {
        console.error(error);

        sqlLoading = null;

        app.innerHTML = `
            <div class="app">
                <main class="main-content">
                    <h1>Не удалось открыть курс SQL</h1>
                    <p>Обновите страницу и попробуйте ещё раз.</p>
                    <p><a href="#/">Вернуться к курсу OpenAPI</a></p>
                </main>
            </div>
        `;
    }
}

window.addEventListener("hashchange", () => {
    if (parseRoute(window.location.hash).course === "sql") {
        renderSql();
        return;
    }

    if (activeCourse === "sql") {
        activeCourse = "openapi";

        if (sqlApp) {
            sqlApp.leave();
        }

        renderApp({ scrollToTop: true });
    }
});


/* Сначала показываем курс сразу (с локальным прогрессом), потом проверяем вход. */
goToSavedLesson();
renderApp();

(async () => {
    const before = JSON.stringify(progressService.getProgress());
    const indexBefore = currentLessonIndex;

    try {
        currentUser = await authService.getUser();
        await progressService.restoreSession(currentUser ? currentUser.id : null);
    } catch (error) {
        console.error(error);
        return;
    }

    authReady = true;

    if (sqlApp) {
        sqlApp.syncUser(currentUser);
    }

    goToSavedLesson();

    const changed =
        before !== JSON.stringify(progressService.getProgress()) ||
        indexBefore !== currentLessonIndex;

    /* Гостю без изменений перерисовывать нечего: не сбрасываем то, что он уже делает. */
    if (currentUser || changed) {
        renderApp();
    }
})();
