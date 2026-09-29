import { course } from "../data/course.js";

export function Sidebar(currentLessonIndex = 0) {
    return `
        <aside class="sidebar">
            <div class="sidebar__section-title">Курс</div>

            <nav class="lesson-list">
                ${course.map((lesson, index) => {
                    const isActive = index === currentLessonIndex;

                    return `
                        <button
                            class="lesson${isActive ? " lesson--active" : ""}"
                            data-lesson-index="${index}"
                        >
                            <span class="lesson__number">
                                ${lesson.icon}
                            </span>

                            <span class="lesson__content">
                                <strong>${lesson.title}</strong>
                                <small>${lesson.sidebarDescription}</small>
                            </span>
                        </button>
                    `;
                }).join("")}
            </nav>

            <div class="sidebar__progress">
                <div class="progress-header">
                    <span>Прогресс</span>
                    <strong>0 / ${course.length}</strong>
                </div>

                <div class="progress-bar">
                    <div class="progress-bar__value"></div>
                </div>
            </div>
        </aside>
    `;
}