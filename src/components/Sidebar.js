import { course } from "../data/course.js";
import {
    createEmptyProgress,
    isLessonDone
} from "../progress/progressModel.js";

export function Sidebar(currentLessonIndex = 0, progress = createEmptyProgress()) {
    return `
        <aside class="sidebar">
            <div class="sidebar__section-title">Курс</div>

            <nav class="lesson-list">
                ${course.map((lesson, index) => {
                    const isActive = index === currentLessonIndex;
                    const isDone = isLessonDone(lesson, progress);

                    return `
                        <button
                            class="lesson${isActive ? " lesson--active" : ""}${isDone ? " lesson--done" : ""}"
                            data-lesson-index="${index}"
                        >
                            <span class="lesson__number">
                                ${lesson.icon}
                            </span>

                            <span class="lesson__content">
                                <strong>${lesson.title}</strong>
                                <small>${lesson.sidebarDescription}</small>
                            </span>

                            ${isDone ? `<span class="lesson__check" title="Пройдено">✓</span>` : ""}
                        </button>
                    `;
                }).join("")}
            </nav>
        </aside>
    `;
}