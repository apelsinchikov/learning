import { escapeHtml } from "../../utils/textFormat.js";
import { CHAPTERS, diagramLessons } from "../lessons/index.js";
import { diagramsHash } from "../../courses/router.js";

/*
 * Состояние урока: "solved" — задача решена, "read" — только прочитан
 * (дошли до задачи или нажали «дальше»), null — ещё не открывали.
 */
export function lessonStatus(progress, lessonId) {
    const entry = progress.lessons?.[lessonId];

    if (entry?.solved) {
        return "solved";
    }

    return entry?.read ? "read" : null;
}

export function countSolved(progress) {
    return diagramLessons.filter(lesson => lessonStatus(progress, lesson.id) === "solved").length;
}

/* Пройденные уроки: прочитанные и решённые. Их показывает счётчик в шапке. */
export function countDone(progress) {
    return diagramLessons.filter(lesson => lessonStatus(progress, lesson.id) !== null).length;
}

/* По этой строке видно, изменились ли отметки и нужно ли перерисовать панели. */
export function statusKey(progress) {
    return diagramLessons
        .map(lesson => ({ solved: "2", read: "1" })[lessonStatus(progress, lesson.id)] || "0")
        .join("");
}

/* Прогресс для шапки. Классы те же, что у остальных курсов. */
export function renderDiagramsProgress(progress) {
    const done = countDone(progress);
    const percent = Math.round((done / diagramLessons.length) * 100);

    return `
        <div class="header__progress" title="Пройдено уроков">
            <div class="header__progress-text">
                <span>Прогресс</span>
                <strong>${done} / ${diagramLessons.length}</strong>
            </div>
            <div class="progress-bar">
                <div class="progress-bar__value" style="width: ${percent}%"></div>
            </div>
        </div>
    `;
}

export function renderDiagramsSidebar(currentId, progress) {
    let number = 0;

    return `
        <nav class="sql-nav dg-nav" aria-label="Уроки">
            ${CHAPTERS.map(chapter => {
                const items = chapter.lessons
                    .map(lesson => {
                        number++;
                        const status = lessonStatus(progress, lesson.id);
                        const active = lesson.id === currentId;

                        return `
                        <a class="sql-lesson${active ? " is-active" : ""}${status === "solved" ? " is-done" : ""}${status === "read" ? " is-read" : ""}" href="${diagramsHash(lesson.id)}"${active ? ` aria-current="page"` : ""}>
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
                <a class="sql-lesson${currentId === "sandbox" ? " is-active" : ""}" href="${diagramsHash("sandbox")}">
                    <span class="sql-lesson__num">∞</span>
                    <span class="sql-lesson__text">
                        <strong>Песочница</strong>
                        <small>Любая диаграмма Mermaid без проверки</small>
                    </span>
                </a>
            </section>
        </nav>
    `;
}

export function neighbours(lessonId) {
    const index = diagramLessons.findIndex(lesson => lesson.id === lessonId);

    return {
        previous: index > 0 ? diagramLessons[index - 1] : null,
        next: index >= 0 && index < diagramLessons.length - 1 ? diagramLessons[index + 1] : null
    };
}
