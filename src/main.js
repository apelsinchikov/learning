import { App } from "./components/App.js";
import { validateLesson1 } from "./utils/validator.js";

const app = document.querySelector("#app");

app.innerHTML = App();

const checkButton = document.querySelector("#check-button");
const yamlEditor = document.querySelector("#yaml-editor");
const swaggerPreview = document.querySelector("#swagger-preview");

checkButton.addEventListener("click", () => {
    const yaml = yamlEditor.value;

    const errors = validateLesson1(yaml);

    if (errors.length > 0) {
        swaggerPreview.innerHTML = `
            <div class="swagger-error">

                <div class="swagger-error__icon">
                    !
                </div>

                <h3>
                    Ошибка OpenAPI
                </h3>

                <div class="swagger-error__messages">
                    ${errors
                        .map(error => `<div>${error}</div>`)
                        .join("")}
                </div>

            </div>
        `;

        return;
    }

    swaggerPreview.innerHTML = `
        <div class="swagger-result">

            <div class="swagger-result__header">
                <div class="swagger-result__method">
                    GET
                </div>

                <div class="swagger-result__path">
                    /hello
                </div>
            </div>

            <h3>
                My API
            </h3>

            <p>
                Версия API: 1.0.0
            </p>

            <div class="swagger-result__operation">

                <div class="swagger-result__operation-title">
                    GET /hello
                </div>

                <p>
                    Endpoint из твоей OpenAPI спецификации.
                </p>

            </div>

        </div>
    `;
});

console.log("OpenAPI Course loaded");