import { renderAuthControls } from "../auth/authView.js";
import { ProgressSummary } from "./ProgressSummary.js";

export function Header({ user = null, progress } = {}) {
    return `
        <header class="header">
            <div class="header__brand">
                <div class="header__logo">O</div>

                <div>
                    <div class="header__title">OpenAPI Course</div>

                    <div class="header__subtitle">
                        Интерактивный курс по REST API
                    </div>
                </div>
            </div>

            <div class="header__auth">
                ${ProgressSummary(progress)}

                ${renderAuthControls(user)}
            </div>
        </header>
    `;
}
