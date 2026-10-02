import { App } from "./components/App.js";
import { validateLesson } from "./utils/validator.js";
import { course } from "./data/course.js";
import { parse } from "yaml";
import mermaid from "mermaid";
import { startMockApi } from "./mock/mockApi.js";

import {
    EditorView,
    Decoration,
    ViewPlugin
} from "@codemirror/view";

import { basicSetup } from "codemirror";

import { EditorState } from "@codemirror/state";
import { yaml } from "@codemirror/lang-yaml";
import { indentMore, indentLess } from "@codemirror/commands";

import SwaggerUI from "swagger-ui-dist/swagger-ui-es-bundle.js";


let currentLessonIndex = 0;

const app = document.querySelector("#app");

startMockApi();


/* =========================================================
   Mermaid
   ========================================================= */

mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose"
});


async function renderMermaid() {
    const diagrams =
        document.querySelectorAll(".mermaid");

    if (!diagrams.length) {
        return;
    }

    try {
        await mermaid.run({
            nodes: diagrams
        });
    } catch (error) {
        console.error(
            "Mermaid rendering error:",
            error
        );
    }
}


/* =========================================================
   Selection styling
   ========================================================= */

const selectionStyle =
    document.createElement("style");

selectionStyle.textContent = `
    .cm-line.cm-multi-selection-line {
        background: rgba(100, 116, 139, 0.14);
    }

    .cm-line.cm-multi-selection-active-line {
        background: rgba(100, 116, 139, 0.08);
    }
`;

document.head.appendChild(selectionStyle);


/*
 * Показываем выделение строк:
 *
 *   обычные выбранные строки
 *       -> более тёмный фон
 *
 *   последняя выбранная строка
 *       -> более светлый фон
 *
 * Последней считается строка, на которой находится
 * активный конец selection (head).
 */

const multiLineSelectionPlugin =
    ViewPlugin.fromClass(
        class {
            decorations;

            constructor(view) {
                this.decorations =
                    this.buildDecorations(view);
            }

            update(update) {
                if (
                    update.selectionSet ||
                    update.docChanged ||
                    update.viewportChanged
                ) {
                    this.decorations =
                        this.buildDecorations(
                            update.view
                        );
                }
            }

            buildDecorations(view) {
                const builder = [];

                const mainSelection =
                    view.state.selection.main;

                for (
                    const range of
                    view.state.selection.ranges
                ) {
                    if (
                        range.from ===
                        range.to
                    ) {
                        continue;
                    }

                    const fromLine =
                        view.state.doc.lineAt(
                            range.from
                        );

                    const toLine =
                        view.state.doc.lineAt(
                            range.to
                        );

                    /*
                     * Последней выбранной строкой
                     * считаем строку, на которой
                     * находится head основного выделения.
                     */

                    const activeLine =
                        view.state.doc.lineAt(
                            mainSelection.head
                        ).number;

                    for (
                        let lineNumber =
                            fromLine.number;

                        lineNumber <=
                        toLine.number;

                        lineNumber++
                    ) {
                        const line =
                            view.state.doc.line(
                                lineNumber
                            );

                        if (
                            line.number ===
                            activeLine
                        ) {
                            builder.push(
                                Decoration.line({
                                    attributes: {
                                        class:
                                            "cm-multi-selection-active-line"
                                    }
                                }).range(
                                    line.from
                                )
                            );
                        } else {
                            builder.push(
                                Decoration.line({
                                    attributes: {
                                        class:
                                            "cm-multi-selection-line"
                                    }
                                }).range(
                                    line.from
                                )
                            );
                        }
                    }
                }

                return Decoration.set(
                    builder
                );
            }
        },
        {
            decorations: value =>
                value.decorations
        }
    );


/* =========================================================
   Application rendering
   ========================================================= */

async function renderApp() {
    app.innerHTML =
        App(currentLessonIndex);

    /*
     * Сначала HTML урока должен попасть в DOM.
     * После этого Mermaid находит .mermaid
     * и превращает его содержимое в SVG.
     */

    await renderMermaid();

    initializeLesson();
}


/* =========================================================
   Practice lesson
   ========================================================= */

function initializePracticeLesson(lesson) {
    const checkButton =
        document.querySelector(
            "#check-button"
        );

    const swaggerPreview =
        document.querySelector(
            "#swagger-preview"
        );

    const editorElement =
        document.querySelector(
            "#yaml-editor"
        );

    if (
        !checkButton ||
        !swaggerPreview ||
        !editorElement
    ) {
        return;
    }


    /* =====================================================
       CodeMirror
       ===================================================== */

    const yamlEditor =
        new EditorView({
            state:
                EditorState.create({
                    doc:
                        lesson.initialYaml,

                    extensions: [
                        basicSetup,

                        yaml(),

                        multiLineSelectionPlugin,

                        EditorView.domEventHandlers({
                            keydown(
                                event,
                                view
                            ) {
                                if (
                                    event.key !==
                                    "Tab"
                                ) {
                                    return false;
                                }

                                event.preventDefault();

                                if (
                                    event.shiftKey
                                ) {
                                    indentLess(
                                        view
                                    );
                                } else {
                                    indentMore(
                                        view
                                    );
                                }

                                return true;
                            }
                        })
                    ]
                }),

            parent:
                editorElement
        });


    /* =====================================================
       Swagger preview
       ===================================================== */

    function showSwagger(yamlText) {
        let specification;

        try {
            specification =
                parse(yamlText);
        } catch (error) {
            swaggerPreview.innerHTML = `
                <div class="swagger-error">

                    <div class="swagger-error__icon">
                        !
                    </div>

                    <h3>
                        Ошибка YAML
                    </h3>

                    <div class="swagger-error__messages">
                        <div>
                            ${escapeHtml(
                                error.message
                            )}
                        </div>
                    </div>

                </div>
            `;

            return;
        }


        /*
         * YAML студента остаётся чистым.
         *
         * Студент НЕ должен писать:
         *
         * servers:
         *   - url: /api
         *
         * /api используется только нашим
         * внутренним mock API.
         */

        const swaggerSpecification = {
            ...specification,

            servers: [
                {
                    url: "/api"
                }
            ]
        };


        swaggerPreview.innerHTML = "";


        SwaggerUI({
            domNode:
                swaggerPreview,

            spec:
                swaggerSpecification
        });
    }


    /* =====================================================
       Validation
       ===================================================== */

    checkButton.addEventListener(
        "click",
        async () => {
            const yamlText =
                yamlEditor.state.doc.toString();

            const result =
                await validateLesson(
                    lesson,
                    yamlText
                );

            const hasOpenApiErrors =
                result.openapiErrors.length >
                0;

            const hasTaskErrors =
                result.taskErrors.length >
                0;


            /*
             * Всё корректно.
             */

            if (
                !hasOpenApiErrors &&
                !hasTaskErrors
            ) {
                showSwagger(yamlText);

                return;
            }


            /* =================================================
               Ошибки OpenAPI
               ================================================= */

            const openapiErrorsHtml =
                hasOpenApiErrors
                    ? `
                        <div class="
                            validation-section
                            validation-section--openapi
                        ">

                            <div class="
                                validation-section__title
                            ">
                                Ошибки OpenAPI
                            </div>

                            <div class="
                                swagger-error__messages
                            ">

                                ${result.openapiErrors
                                    .map(
                                        error => `
                                            <div class="
                                                swagger-error__message
                                            ">
                                                ${escapeHtml(
                                                    String(
                                                        error
                                                    )
                                                )}
                                            </div>
                                        `
                                    )
                                    .join("")}

                            </div>

                        </div>
                    `
                    : "";


            /* =================================================
               Ошибки задания
               ================================================= */

            let taskErrorsHtml = "";


            if (hasTaskErrors) {
                taskErrorsHtml = `
                    <div class="
                        validation-section
                        validation-section--task
                    ">

                        <div class="
                            validation-section__title
                        ">
                            Условия задания
                        </div>

                        <div class="
                            swagger-error__messages
                        ">

                            ${result.taskErrors
                                .map(
                                    error => `
                                        <div class="
                                            swagger-error__message
                                        ">
                                            ${escapeHtml(
                                                String(
                                                    error
                                                )
                                            )}
                                        </div>
                                    `
                                )
                                .join("")}

                        </div>

                    </div>
                `;
            } else if (hasOpenApiErrors) {
                taskErrorsHtml = `
                    <div class="
                        validation-section
                        validation-section--task
                    ">

                        <div class="
                            validation-section__title
                        ">
                            Проверка задания
                        </div>

                        <div class="
                            swagger-error__messages
                        ">

                            <div class="
                                swagger-error__message
                            ">
                                Сначала исправь ошибки OpenAPI.
                                После этого будут проверены
                                условия задания.
                            </div>

                        </div>

                    </div>
                `;
            }


            /* =================================================
               Результат проверки
               ================================================= */

            swaggerPreview.innerHTML = `
                <div class="swagger-error">

                    <div class="swagger-error__icon">
                        !
                    </div>

                    <h3>
                        Результат проверки
                    </h3>

                    ${openapiErrorsHtml}

                    ${taskErrorsHtml}

                </div>
            `;
        }
    );
}


/* =========================================================
   Lesson initialization
   ========================================================= */

function initializeLesson() {
    const lesson =
        course[currentLessonIndex];

    if (!lesson) {
        return;
    }

    if (
        lesson.type ===
        "practice"
    ) {
        initializePracticeLesson(
            lesson
        );
    }

    initializeNavigation();
}


/* =========================================================
   Navigation
   ========================================================= */

function initializeNavigation() {
    const nextButton =
        document.querySelector(
            "#next-button"
        );

    const previousButton =
        document.querySelector(
            "#previous-button"
        );


    if (nextButton) {
        nextButton.addEventListener(
            "click",
            () => {
                if (
                    currentLessonIndex >=
                    course.length - 1
                ) {
                    return;
                }

                currentLessonIndex += 1;

                renderApp();
            }
        );
    }


    if (previousButton) {
        previousButton.addEventListener(
            "click",
            () => {
                if (
                    currentLessonIndex <=
                    0
                ) {
                    return;
                }

                currentLessonIndex -= 1;

                renderApp();
            }
        );
    }


    document
        .querySelectorAll(".lesson")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    currentLessonIndex =
                        Number(
                            button.dataset
                                .lessonIndex
                        );

                    renderApp();
                }
            );
        });
}


/* =========================================================
   HTML escaping
   ========================================================= */

function escapeHtml(value) {
    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


/* =========================================================
   Start application
   ========================================================= */

renderApp();

console.log(
    "OpenAPI Course loaded"
);