/*
 * Вкладки курсов в шапке. Адреса курсов SQL и «Диаграммы» — в хеше (#/sql, #/diagrams),
 * поэтому это обычные ссылки, а переключение делает слушатель hashchange.
 */
const TABS = [
    { id: "openapi", href: "#/", label: "OpenAPI" },
    { id: "sql", href: "#/sql", label: "SQL" },
    { id: "diagrams", href: "#/diagrams", label: "Диаграммы" }
];

export function CourseTabs({ active = "openapi" } = {}) {
    return `
        <nav class="course-tabs" aria-label="Курсы">
            ${TABS.map(tab => {
                const isActive = active === tab.id;
                const own = tab.id === "openapi" ? "" : ` course-tab--${tab.id}`;

                return `<a class="course-tab${own}${isActive ? " course-tab--active" : ""}" href="${tab.href}"${isActive ? ` aria-current="page"` : ""}>${tab.label}</a>`;
            }).join("")}
        </nav>
    `;
}
