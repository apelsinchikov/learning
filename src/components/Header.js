import { renderAuthControls } from "../auth/authView.js";
import { CourseTabs } from "./CourseTabs.js";
import { ProgressSummary } from "./ProgressSummary.js";

const BRANDS = {
    openapi: { logo: "O", title: "OpenAPI Course", subtitle: "Интерактивный курс по REST API" },
    sql: { logo: "S", title: "SQL: тайна отеля «Перевал»", subtitle: "Детективный курс по Postgres" },
    diagrams: { logo: "D", title: "Диаграммы: проект отеля «Перевал»", subtitle: "ER и sequence на Mermaid" }
};

/*
 * course — какой курс сейчас открыт ("openapi", "sql" или "diagrams").
 * summary — готовый HTML прогресса (у курсов SQL и «Диаграммы» свой), по умолчанию прогресс OpenAPI.
 */
export function Header({ user = null, progress, course = "openapi", summary = null } = {}) {
    const brand = BRANDS[course] || BRANDS.openapi;
    const modifier = course === "openapi" || !BRANDS[course] ? "" : ` header--${course}`;

    return `
        <header class="header${modifier}">
            <div class="header__brand">
                <div class="header__logo">${brand.logo}</div>

                <div>
                    <div class="header__title">${brand.title}</div>

                    <div class="header__subtitle">${brand.subtitle}</div>
                </div>
            </div>

            ${CourseTabs({ active: course })}

            <div class="header__auth">
                ${summary ?? ProgressSummary(progress)}

                ${renderAuthControls(user)}
            </div>
        </header>
    `;
}
