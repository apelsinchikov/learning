export function Validation({ type = "ready", messages = [] } = {}) {
    if (type === "success") {
        return `
            <div class="validation-message validation-message--success">
                <span class="validation-message__icon">✓</span>

                <span>
                    Спецификация выглядит корректно
                </span>
            </div>
        `;
    }

    if (type === "error") {
        return `
            <div class="validation-message validation-message--error">

                <span class="validation-message__icon">!</span>

                <div>
                    ${messages
                        .map(message => `<div>${message}</div>`)
                        .join("")}
                </div>

            </div>
        `;
    }

    return `
        <div class="validation-message">

            <span class="validation-message__icon">✓</span>

            <span>
                Готово к проверке
            </span>

        </div>
    `;
}