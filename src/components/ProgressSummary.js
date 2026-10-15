import { course } from "../data/course.js";
import { countDone, createEmptyProgress } from "../progress/progressModel.js";

/* Прогресс курса для шапки: «Прогресс 2 / 21» и тонкая полоса. */
export function ProgressSummary(progress = createEmptyProgress()) {
    const doneCount = countDone(course, progress);
    const percent = Math.round((doneCount / course.length) * 100);

    return `
        <div class="header__progress" title="Пройдено уроков">
            <div class="header__progress-text">
                <span>Прогресс</span>
                <strong>${doneCount} / ${course.length}</strong>
            </div>

            <div class="progress-bar">
                <div class="progress-bar__value" style="width: ${percent}%"></div>
            </div>
        </div>
    `;
}
