import "./styles/main.css";

import { App } from "./components/App.js";
import { course } from "./data/course.js";
import { validateLesson } from "./utils/validator.js";
import { startMockApi } from "./mock/mockApi.js";

import { createYamlEditor } from "./editor/createEditor.js";
import { renderMermaid } from "./ui/mermaid.js";
import { initCopyGuard } from "./ui/copyGuard.js";
import { initNavigation } from "./ui/navigation.js";
import { showSwagger, showValidationErrors } from "./ui/swaggerPreview.js";


let currentLessonIndex = 0;

const app = document.querySelector("#app");

startMockApi();
initCopyGuard();


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

    const yamlEditor = createYamlEditor(
        editorElement,
        lesson.initialYaml
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

        showSwagger(swaggerPreview, yamlText, lesson.successMessage);
    });
}


/* =========================================================
   Отрисовка урока
   ========================================================= */

async function renderApp({ scrollToTop = false } = {}) {
    app.innerHTML = App(currentLessonIndex);

    /*
     * Сначала HTML урока должен попасть в DOM.
     * После этого Mermaid находит .mermaid и строит SVG.
     */
    await renderMermaid();

    const lesson = course[currentLessonIndex];

    if (lesson.type === "practice") {
        initializePracticeLesson(lesson);
    }

    initNavigation(currentLessonIndex, index => {
        currentLessonIndex = index;
        renderApp({ scrollToTop: true });
    });

    if (scrollToTop) {
        window.scrollTo({ top: 0, left: 0 });
    }
}


renderApp();
