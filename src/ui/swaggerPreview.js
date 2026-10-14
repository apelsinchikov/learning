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
 * Если передан successMessage — выводит его над документацией.
 */
export function showSwagger(container, yamlText, successMessage = "") {
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
        ${
            successMessage
                ? `
                    <div class="success-banner">
                        <div class="success-banner__icon">✓</div>
                        <div class="success-banner__text">
                            ${renderText(successMessage)}
                        </div>
                    </div>
                `
                : ""
        }

        <div class="swagger-mount"></div>
    `;

    SwaggerUI({
        domNode: container.querySelector(".swagger-mount"),
        spec: swaggerSpecification
    });
}
