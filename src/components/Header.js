import { renderAuthControls } from "../auth/authView.js";
import { CourseTabs } from "./CourseTabs.js";
import { ProgressSummary } from "./ProgressSummary.js";

/*
 * course — какой курс сейчас открыт ("openapi" или "sql").
 * summary — готовый HTML прогресса (для курса SQL свой), по умолчанию прогресс OpenAPI.
 */
export function Header({ user = null, progress, course = "openapi", summary = null } = {}) {
    const isSql = course === "sql";

    return `
        <header class="header${isSql ? " header--sql" : ""}">
            <div class="header__brand">
                <div class="header__logo">${isSql ? "S" : "O"}</div>

                <div>
                    <div class="header__title">${isSql ? "SQL: тайна отеля «Перевал»" : "OpenAPI Course"}</div>

                    <div class="header__subtitle">
                        ${isSql ? "Детективный курс по Postgres" : "Интерактивный курс по REST API"}
                    </div>
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
