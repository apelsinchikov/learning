import { escapeHtml } from "../utils/textFormat.js";

/* Кнопка «Войти» для гостя или имя и «Выйти» для вошедшего. */
export function renderAuthControls(user) {
    if (!user) {
        return `
            <button class="auth-button" data-action="open-login">
                Войти
            </button>
        `;
    }

    return `
        <span class="auth-user">${escapeHtml(user.name)}</span>

        <button class="auth-button auth-button--ghost" data-action="logout">
            Выйти
        </button>
    `;
}

/* Окно выбора способа входа: по кнопке на каждого провайдера. */
export function renderLoginModal(providers) {
    return `
        <div class="auth-modal" role="dialog" aria-modal="true" aria-label="Вход">
            <div class="auth-modal__backdrop" data-action="close-login"></div>

            <div class="auth-modal__card">
                <button
                    class="auth-modal__close"
                    data-action="close-login"
                    aria-label="Закрыть"
                >×</button>

                <h2>Вход</h2>

                <p>
                    Войди, чтобы сохранить прогресс и продолжить
                    с другого устройства. Курс доступен и без входа.
                </p>

                <p class="auth-modal__error" role="alert" hidden></p>

                <div class="auth-modal__providers">
                    ${providers.map(provider => `
                        <button
                            class="auth-provider"
                            data-provider="${escapeHtml(provider.id)}"
                        >
                            Войти через ${escapeHtml(provider.label)}
                        </button>
                    `).join("")}
                </div>
            </div>
        </div>
    `;
}
