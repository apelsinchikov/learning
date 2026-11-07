import { parse } from "yaml";
import SwaggerUI from "swagger-ui-dist/swagger-ui-es-bundle.js";
import "swagger-ui-dist/swagger-ui.css";

import { escapeHtml, renderText } from "../utils/textFormat.js";


function errorBox(title, bodyHtml) {
    return `
        <div class="swagger-error">
            <div class="swagger-error__icon">!</div>

            <h3>${escapeHtml(title)}</h3>

            ${bodyHtml}
        </div>
    `;
}


function messagesBlock(messages) {
    return `
        <div class="swagger-error__messages">
            ${messages
                .map(message => `
                    <div class="swagger-error__message">
                        ${escapeHtml(message)}
                    </div>
                `)
                .join("")}
        </div>
    `;
}


function validationSection(title, modifier, messages) {
    return `
        <div class="validation-section validation-section--${modifier}">
            <div class="validation-section__title">
                ${escapeHtml(title)}
            </div>

            ${messagesBlock(messages)}
        </div>
    `;
}


/*
 * Показывает результат проверки, если в нём есть ошибки.
 */
export function showValidationErrors(container, result) {
    const hasOpenApiErrors = result.openapiErrors.length > 0;
    const hasTaskErrors = result.taskErrors.length > 0;

    let html = "";

    if (hasOpenApiErrors) {
        html += validationSection(
            "Ошибки OpenAPI",
            "openapi",
            result.openapiErrors
        );
    }

    if (hasTaskErrors) {
        html += validationSection(
            "Условия задания",
            "task",
            result.taskErrors
        );
    } else {
        html += validationSection(
            "Проверка задания",
            "task",
            [
                "Сначала исправь ошибки OpenAPI. " +
                "После этого будут проверены условия задания."
            ]
        );
    }

    container.innerHTML = errorBox("Результат проверки", html);
}


/*
 * Показывает Swagger UI для спецификации студента.
 * Над Swagger есть отдельное место для баннера результата проверки задания
 * (см. showTaskResult): баннер можно менять, не перерисовывая сам Swagger.
 */
export function showSwagger(container, yamlText) {
    let specification;

    try {
        specification = parse(yamlText);
    } catch (error) {
        container.innerHTML = errorBox(
            "Ошибка YAML",
            messagesBlock([error.message])
        );

        return;
    }

    /*
     * YAML студента остаётся чистым: servers писать не нужно.
     * /api используется только внутренним mock API.
     */
    const swaggerSpecification = {
        ...specification,
        servers: [{ url: "/api" }]
    };

    container.innerHTML = `
        <div class="task-result"></div>

        <div class="swagger-mount"></div>
    `;

    SwaggerUI({
        domNode: container.querySelector(".swagger-mount"),
        spec: swaggerSpecification
    });
}


/*
 * Баннер результата проверки задания над Swagger.
 * { ok: true, successMessage } — задание выполнено;
 * { ok: false, errors } — список невыполненных условий.
 * Swagger под баннером не трогаем.
 */
export function showTaskResult(container, { ok, errors = [], successMessage = "" }) {
    const slot = container.querySelector(".task-result");

    if (!slot) {
        return;
    }

    slot.innerHTML = ok
        ? `
            <div class="success-banner">
                <div class="success-banner__icon">✓</div>
                <div class="success-banner__text">
                    ${renderText(successMessage || "Задание выполнено!")}
                </div>
            </div>
        `
        : validationSection("Условия задания", "task", errors);

    /* Показываем баннер: прокручиваем только панель Swagger, не всю страницу. */
    container.closest(".panel-body")?.scrollTo?.({ top: 0, behavior: "smooth" });
}


/* Убирает баннер результата (например, когда ученик снова правит текст). */
export function clearTaskResult(container) {
    const slot = container.querySelector(".task-result");

    if (slot) {
        slot.innerHTML = "";
    }
}
