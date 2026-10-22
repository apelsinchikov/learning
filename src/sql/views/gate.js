import { escapeHtml } from "../../utils/textFormat.js";

/* Экран «курс пока закрыт». Пока доступ по общему паролю, позже — по приглашению. */
export function renderGate({ error = "" } = {}) {
    return `
        <div class="sql-gate">
            <div class="sql-gate__card">
                <div class="sql-gate__lock" aria-hidden="true">🔒</div>
                <h1>Курс SQL пока закрыт</h1>
                <p>
                    Курс уже готов, но открыт только для тех, у кого есть пароль.
                    Остальным откроем позже.
                </p>

                <form class="sql-gate__form" data-gate-form>
                    <label for="sql-gate-password">Пароль доступа</label>
                    <input id="sql-gate-password" type="password" autocomplete="off" data-gate-input>
                    <p class="sql-gate__error" role="alert" data-gate-error${error ? "" : " hidden"}>${escapeHtml(error)}</p>
                    <button type="submit" class="sql-button">Открыть курс</button>
                </form>

                <a class="sql-gate__back" href="#/">← Вернуться к курсу OpenAPI</a>
            </div>
        </div>
    `;
}
