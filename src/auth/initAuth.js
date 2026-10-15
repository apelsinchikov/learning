import { renderLoginModal } from "./authView.js";

const ERROR_TEXT = "Не удалось войти. Попробуйте ещё раз.";

/*
 * Обработчики входа/выхода. Вешаются один раз на документ (делегирование),
 * поэтому переживают перерисовку шапки.
 */
export function initAuth({ authService, providers, onLogout }) {
    let modal = null;

    function closeModal() {
        if (modal) {
            modal.remove();
            modal = null;
        }
    }

    function openModal() {
        if (modal) {
            return;
        }

        modal = document.createElement("div");
        modal.innerHTML = renderLoginModal(providers);
        document.body.appendChild(modal);
    }

    async function startSignIn(providerId) {
        const errorElement = modal && modal.querySelector(".auth-modal__error");

        try {
            await authService.signIn(providerId);
        } catch (error) {
            console.error(error);

            if (errorElement) {
                errorElement.textContent = ERROR_TEXT;
                errorElement.hidden = false;
            }
        }
    }

    document.addEventListener("click", event => {
        const provider = event.target.closest("[data-provider]");

        if (provider) {
            startSignIn(provider.dataset.provider);
            return;
        }

        const action = event.target.closest("[data-action]");

        if (!action) {
            return;
        }

        if (action.dataset.action === "open-login") {
            openModal();
        } else if (action.dataset.action === "close-login") {
            closeModal();
        } else if (action.dataset.action === "logout") {
            onLogout();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeModal();
        }
    });
}
