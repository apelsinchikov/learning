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
import { PROVIDERS } from "./auth/config.js";
import { createSupabaseClient } from "./auth/supabaseClient.js";
import { createAuthService } from "./auth/authService.js";
import { initAuth } from "./auth/initAuth.js";
import { createCloudStore } from "./progress/cloudStore.js";
import { createLocalStore } from "./progress/localStore.js";
import { getDraft, isLessonDone } from "./progress/progressModel.js";
import { createProgressService } from "./progress/progressService.js";


let currentLessonIndex = 0;
let currentUser = null;

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
});

initAuth({
    authService,
    providers: PROVIDERS,

    async onLogout() {
        await progressService.flush();
        await authService.signOut();
    }
});

authService.onAuthChange(async user => {
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

    goToSavedLesson();

    const changed =
        before !== JSON.stringify(progressService.getProgress()) ||
        indexBefore !== currentLessonIndex;

    /* Гостю без изменений перерисовывать нечего: не сбрасываем то, что он уже делает. */
    if (currentUser || changed) {
        renderApp();
    }
})();
