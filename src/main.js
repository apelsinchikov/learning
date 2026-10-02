
import { App } from "./components/App.js";
import { validateLesson } from "./utils/validator.js";
import { course } from "./data/course.js";
import { parse } from "yaml";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { yaml } from "@codemirror/lang-yaml";
import { indentMore, indentLess } from "@codemirror/commands";
import SwaggerUI from "swagger-ui-dist/swagger-ui-es-bundle.js";

let currentLessonIndex = 0;

const app = document.querySelector("#app");

function renderApp() {
    app.innerHTML = App(currentLessonIndex);
    initializeLesson();
}

function initializePracticeLesson(lesson) {
    const checkButton = document.querySelector("#check-button");
    const swaggerPreview = document.querySelector("#swagger-preview");
    const editorElement = document.querySelector("#yaml-editor");

    if (!checkButton || !swaggerPreview || !editorElement) return;

    const yamlEditor = new EditorView({
        state: EditorState.create({
            doc: lesson.initialYaml,
            extensions: [
                basicSetup,
                yaml(),

                EditorView.domEventHandlers({
                    keydown(event, view) {
                        if (event.key === "Tab") {
                            event.preventDefault();

                            if (event.shiftKey) {
                                indentLess(view);
                            } else {
                                indentMore(view);
                            }

                            return true;
                        }

                        return false;
                    }
                })
            ]
        }),
        parent: editorElement
    });

    function showSwagger(yamlText) {
        let specification;

        try {
            specification = parse(yamlText);
        } catch (error) {
            swaggerPreview.innerHTML = `
                <div class="swagger-error">
                    <div class="swagger-error__icon">!</div>

                    <h3>Ошибка YAML</h3>

                    <div class="swagger-error__messages">
                        <div>${error.message}</div>
                    </div>
                </div>
            `;

            return;
        }

        swaggerPreview.innerHTML = "";

        SwaggerUI({
            domNode: swaggerPreview,
            spec: specification
        });
    }

    checkButton.addEventListener("click", async () => {
        const yamlText = yamlEditor.state.doc.toString();

        const errors = await validateLesson(lesson, yamlText);

        if (errors.length > 0) {
            swaggerPreview.innerHTML = `
                <div class="swagger-error">
                    <div class="swagger-error__icon">!</div>

                    <h3>Ошибка OpenAPI</h3>

                    <div class="swagger-error__messages">
                        ${errors
                            .map(error => `<div>${error}</div>`)
                            .join("")}
                    </div>
                </div>
            `;

            return;
        }

        showSwagger(yamlText);
    });
}

function initializeLesson() {
    const lesson = course[currentLessonIndex];

    if (lesson.type === "practice") {
        initializePracticeLesson(lesson);
    }

    initializeNavigation();
}

function initializeNavigation() {
    const nextButton = document.querySelector("#next-button");
    const previousButton = document.querySelector("#previous-button");

    if (nextButton) {
        nextButton.addEventListener("click", () => {
            currentLessonIndex += 1;
            renderApp();
        });
    }

    if (previousButton) {
        previousButton.addEventListener("click", () => {
            currentLessonIndex -= 1;
            renderApp();
        });
    }

    document.querySelectorAll(".lesson").forEach(button => {
        button.addEventListener("click", () => {
            currentLessonIndex = Number(button.dataset.lessonIndex);
            renderApp();
        });
    });
}

renderApp();

console.log("OpenAPI Course loaded");
