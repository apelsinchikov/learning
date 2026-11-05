import { escapeHtml } from "../../utils/textFormat.js";
import { CHAPTERS, sqaLessons } from "../lessons/index.js";

export const HASH = "#/sql-advanced";

/*
 * Состояние урока: "solved" — задача решена, "read" — только прочитан,
 * null — ещё не открывали.
 */
export function lessonStatus(progress, lessonId) {
    const entry = progress.lessons?.[lessonId];

    if (entry?.solved) {
        return "solved";
    }

    return entry?.read ? "read" : null;
}

export const countDone = progress => sqaLessons.filter(lesson => lessonStatus(progress, lesson.id) !== null).length;

/* По этой строке видно, изменились ли отметки и нужно ли перерисовать панели. */
export function statusKey(progress) {
    return sqaLessons.map(lesson => ({ solved: "2", read: "1" })[lessonStatus(progress, lesson.id)] || "0").join("");
}

export function renderProgress(progress) {
    const done = countDone(progress);
    const percent = Math.round((done / sqaLessons.length) * 100);

    return `
        <div class="header__progress" title="Пройдено уроков">
            <div class="header__progress-text">
                <span>Прогресс</span>
                <strong>${done} / ${sqaLessons.length}</strong>
            </div>
            <div class="progress-bar">
                <div class="progress-bar__value" style="width: ${percent}%"></div>
            </div>
        </div>
    `;
}

export function renderSidebar(currentId, progress) {
    let number = 0;

    return `
        <nav class="sql-nav" aria-label="Уроки">
            ${CHAPTERS.map(chapter => {
                const items = chapter.lessons
                    .map(lesson => {
                        number++;
                        const status = lessonStatus(progress, lesson.id);
                        const active = lesson.id === currentId;

                        return `
                        <a class="sql-lesson${active ? " is-active" : ""}${status === "solved" ? " is-done" : ""}${status === "read" ? " is-read" : ""}" href="${HASH}/${encodeURIComponent(lesson.id)}"${active ? ` aria-current="page"` : ""}>
                            <span class="sql-lesson__num"${status ? ` title="${status === "solved" ? "Задача решена" : "Прочитано"}"` : ""}>${status ? "✓" : number}</span>
                            <span class="sql-lesson__text">
                                <strong>${escapeHtml(lesson.title)}</strong>
                                <small>${escapeHtml(lesson.summary)}</small>
                            </span>
                        </a>`;
                    })
                    .join("");

                return `
                    <section class="sql-chapter">
                        <h3>Глава ${chapter.id}. ${escapeHtml(chapter.title)}</h3>
                        ${items}
                    </section>`;
            }).join("")}

            <section class="sql-chapter">
                <h3>После занятий</h3>
                <a class="sql-lesson${currentId === "sandbox" ? " is-active" : ""}" href="${HASH}/sandbox"${currentId === "sandbox" ? ` aria-current="page"` : ""}>
                    <span class="sql-lesson__num">∞</span>
                    <span class="sql-lesson__text">
                        <strong>Песочница</strong>
                        <small>Свободные запросы и CREATE TABLE</small>
                    </span>
                </a>
            </section>
        </nav>
    `;
}

export function neighbours(lessonId) {
    const index = sqaLessons.findIndex(lesson => lesson.id === lessonId);

    return {
        previous: index > 0 ? sqaLessons[index - 1] : null,
        next: index >= 0 && index < sqaLessons.length - 1 ? sqaLessons[index + 1] : null
    };
}
