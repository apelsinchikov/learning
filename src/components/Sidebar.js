import { course } from "../data/course.js";
import {
    countDone,
    createEmptyProgress,
    isLessonDone
} from "../progress/progressModel.js";

export function Sidebar(currentLessonIndex = 0, progress = createEmptyProgress()) {
    const doneCount = countDone(course, progress);
    const percent = Math.round((doneCount / course.length) * 100);

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

            <div class="sidebar__progress">
                <div class="progress-header">
                    <span>Прогресс</span>
                    <strong>${doneCount} / ${course.length}</strong>
                </div>

                <div class="progress-bar">
                    <div class="progress-bar__value" style="width: ${percent}%"></div>
                </div>
            </div>
        </aside>
    `;
}