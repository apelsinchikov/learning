import { renderAuthControls } from "../auth/authView.js";

export function Header({ user = null } = {}) {
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
                ${renderAuthControls(user)}
            </div>
        </header>
    `;
}
