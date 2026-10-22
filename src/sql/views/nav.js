import { escapeHtml } from "../../utils/textFormat.js";
import { CHAPTERS, sqlLessons } from "../lessons/index.js";

export function countSolved(progress) {
    return sqlLessons.filter(lesson => progress.lessons?.[lesson.id]?.solved).length;
}

/* Прогресс для шапки. Классы те же, что у курса OpenAPI. */
export function renderSqlProgress(progress) {
    const done = countSolved(progress);
    const percent = Math.round((done / sqlLessons.length) * 100);

    return `
        <div class="header__progress" title="Решено задач">
            <div class="header__progress-text">
                <span>Прогресс</span>
                <strong>${done} / ${sqlLessons.length}</strong>
            </div>
            <div class="progress-bar">
                <div class="progress-bar__value" style="width: ${percent}%"></div>
            </div>
        </div>
    `;
}

export function renderSqlSidebar(currentId, progress) {
    let number = 0;

    return `
        <nav class="sql-nav" aria-label="Уроки">
            ${CHAPTERS.map(chapter => {
                const items = chapter.lessons
                    .map(lesson => {
                        number++;
                        const done = progress.lessons?.[lesson.id]?.solved;
                        const active = lesson.id === currentId;

                        return `
                        <a class="sql-lesson${active ? " is-active" : ""}${done ? " is-done" : ""}" href="#/sql/${encodeURIComponent(lesson.id)}"${active ? ` aria-current="page"` : ""}>
                            <span class="sql-lesson__num">${done ? "✓" : number}</span>
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
                <a class="sql-lesson${currentId === "sandbox" ? " is-active" : ""}" href="#/sql/sandbox">
                    <span class="sql-lesson__num">∞</span>
                    <span class="sql-lesson__text">
                        <strong>Песочница</strong>
                        <small>Свободные запросы к базе отеля</small>
                    </span>
                </a>
            </section>
        </nav>
    `;
}

export function neighbours(lessonId) {
    const index = sqlLessons.findIndex(lesson => lesson.id === lessonId);

    return {
        previous: index > 0 ? sqlLessons[index - 1] : null,
        next: index >= 0 && index < sqlLessons.length - 1 ? sqlLessons[index + 1] : null
    };
}
