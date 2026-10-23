import { course } from "../data/course.js";
import { COURSE_SECTIONS } from "../data/courseSections.js";
import { createEmptyProgress, isLessonDone } from "../progress/progressModel.js";
import { escapeHtml } from "../utils/textFormat.js";

/*
 * Список уроков. Тот же вид, что у курсов SQL и «Диаграммы»: блоки с заголовками,
 * номер в круглой отметке, у пройденного урока вместо номера галочка.
 * Прочитанная теория отмечается светлой галочкой, решённая практика зелёной.
 */
export function Sidebar(currentLessonIndex = 0, progress = createEmptyProgress()) {
    const indexById = new Map(course.map((lesson, index) => [lesson.id, index]));

    return `
        <aside class="sidebar">
            <nav class="lesson-list" aria-label="Уроки">
                ${COURSE_SECTIONS.map((section, sectionIndex) => {
                    const items = section.lessons
                        .map(id => {
                            const index = indexById.get(id);
                            const lesson = course[index];
                            const isActive = index === currentLessonIndex;
                            const isDone = isLessonDone(lesson, progress);
                            const status = !isDone ? "" : lesson.type === "practice" ? " lesson--done" : " lesson--read";

                            return `
                        <button
                            type="button"
                            class="lesson${isActive ? " lesson--active" : ""}${status}"
                            data-lesson-index="${index}"${isActive ? ` aria-current="page"` : ""}
                        >
                            <span class="lesson__number"${isDone ? ` title="${lesson.type === "practice" ? "Задача решена" : "Прочитано"}"` : ""}>${isDone ? "✓" : index + 1}</span>
                            <span class="lesson__content">
                                <strong>${escapeHtml(lesson.title)}</strong>
                                <small>${escapeHtml(lesson.sidebarDescription)}</small>
                            </span>
                        </button>`;
                        })
                        .join("");

                    return `
                    <section class="lesson-section">
                        <h3>Блок ${sectionIndex + 1}. ${escapeHtml(section.title)}</h3>
                        ${items}
                    </section>`;
                }).join("")}
            </nav>
        </aside>
    `;
}
