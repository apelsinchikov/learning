/*
 * Вкладки курсов в шапке. Адрес курса SQL — в хеше (#/sql),
 * поэтому это обычные ссылки, а переключение делает слушатель hashchange.
 */
export function CourseTabs({ active = "openapi" } = {}) {
    return `
        <nav class="course-tabs" aria-label="Курсы">
            <a class="course-tab${active === "openapi" ? " course-tab--active" : ""}" href="#/"${active === "openapi" ? ` aria-current="page"` : ""}>OpenAPI</a>
            <a class="course-tab course-tab--sql${active === "sql" ? " course-tab--active" : ""}" href="#/sql"${active === "sql" ? ` aria-current="page"` : ""}>SQL</a>
        </nav>
    `;
}
