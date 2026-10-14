import { Header } from "./Header.js";
import { Sidebar } from "./Sidebar.js";
import { Theory } from "./Theory.js";
import { Editor } from "./Editor.js";
import { SwaggerPreview } from "./SwaggerPreview.js";
import { course } from "../data/course.js";
import { escapeHtml } from "../utils/textFormat.js";

export function App(currentLessonIndex = 0) {
    const currentLesson = course[currentLessonIndex];
    const hasPreviousLesson = currentLessonIndex > 0;
    const hasNextLesson = currentLessonIndex < course.length - 1;
    const isPractice = currentLesson.type === "practice";

    return `
        <div class="app">
            ${Header()}

            <div class="app-layout">
                ${Sidebar(currentLessonIndex)}

                <main class="main-content">
                    <div class="page-header">
                        <div>
                            <div class="page-header__label">
                                ${currentLesson.icon}
                                ${currentLesson.type === "theory" ? "ТЕОРИЯ" : "ПРАКТИКА"}
                                · УРОК ${currentLessonIndex + 1}
                            </div>

                            <h1>${escapeHtml(currentLesson.title)}</h1>

                            <p>${escapeHtml(currentLesson.subtitle)}</p>
                        </div>
                    </div>

                    <div class="workspace">
                        ${Theory(currentLesson)}

                        ${
                            isPractice
                                ? `${Editor()}${SwaggerPreview()}`
                                : ""
                        }
                    </div>

                    ${
                        hasPreviousLesson || hasNextLesson
                            ? `
                                <nav class="lesson-navigation">
                                    ${
                                        hasPreviousLesson
                                            ? `<button class="nav-button nav-button--previous" id="previous-button">← Предыдущий урок</button>`
                                            : "<span></span>"
                                    }

                                    ${
                                        hasNextLesson
                                            ? `<button class="nav-button nav-button--next" id="next-button">Следующий урок →</button>`
                                            : ""
                                    }
                                </nav>
                            `
                            : ""
                    }
                </main>
            </div>
        </div>
    `;
}