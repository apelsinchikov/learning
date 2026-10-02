import { parse } from "yaml";
import { validate } from "@scalar/openapi-parser";

export async function validateLesson(lesson, yamlText) {
    const result = {
        openapiErrors: [],
        taskErrors: []
    };

    let specification;

    // 1. Проверяем синтаксис YAML
    try {
        specification = parse(yamlText);
    } catch (error) {
        result.openapiErrors.push(
            `Ошибка YAML: ${error.message}`
        );

        return result;
    }

    // 2. Проверяем, что YAML содержит объект
    if (
        !specification ||
        typeof specification !== "object" ||
        Array.isArray(specification)
    ) {
        result.openapiErrors.push(
            "OpenAPI-спецификация должна быть YAML-объектом."
        );

        return result;
    }

    // 3. Проверяем OpenAPI через Scalar
    try {
        const scalarResult = await validate(specification);

        if (!scalarResult.valid) {
            result.openapiErrors.push(
                ...(scalarResult.errors || []).map(
                    error =>
                        `Ошибка OpenAPI: ${
                            error.message || error
                        }`
                )
            );
        }
    } catch (error) {
        result.openapiErrors.push(
            `Ошибка OpenAPI: ${error.message}`
        );
    }

    /*
     * Если сама OpenAPI-спецификация некорректна,
     * условия конкретного задания пока не проверяем.
     */
    if (result.openapiErrors.length > 0) {
        return result;
    }

    // 4. Проверяем условия конкретного урока
    if (lesson.validation) {
        validatePracticeLesson(
            specification,
            lesson.validation,
            result.taskErrors
        );
    }

    return result;
}


function validatePracticeLesson(
    specification,
    validation,
    errors
) {
    const path =
        specification.paths?.[
            validation.requiredPath
        ];

    if (!path) {
        errors.push(
            `Добавь endpoint ${validation.method.toUpperCase()} ${validation.requiredPath}.`
        );

        return;
    }

    const operation =
        path[validation.method];

    if (!operation) {
        errors.push(
            `Добавь метод ${validation.method.toUpperCase()} для ${validation.requiredPath}.`
        );

        return;
    }

    // summary
    if (validation.summary) {
        if (
            operation.summary !==
            validation.summary
        ) {
            errors.push(
                `Для операции укажи summary: ${validation.summary}`
            );
        }
    }

    // operationId
    if (validation.operationId) {
        if (
            operation.operationId !==
            validation.operationId
        ) {
            errors.push(
                `Для операции укажи operationId: ${validation.operationId}`
            );
        }
    }

    // responses
    if (validation.responses) {
        validateResponses(
            operation,
            validation.responses,
            errors
        );
    } else if (validation.response) {
        /*
         * Поддержка старого формата validation.
         */
        validateResponse(
            operation,
            validation,
            errors
        );
    }

    // parameter
    if (validation.requiredParameter) {
        validateParameter(
            operation,
            validation.requiredParameter,
            errors
        );
    }

    // schemas
    if (validation.schemas) {
        validateSchemas(
            specification,
            validation.schemas,
            errors
        );
    }
}


function validateResponses(
    operation,
    responsesValidation,
    errors
) {
    const responses =
        operation.responses || {};

    for (
        const [
            status,
            validation
        ] of Object.entries(responsesValidation)
    ) {
        const response =
            responses[status];

        // response отсутствует
        if (!response) {
            errors.push(
                `Добавь ответ с кодом ${status}.`
            );

            continue;
        }

        // description
        if (validation.description) {
            if (
                response.description !==
                validation.description
            ) {
                errors.push(
                    `Для ответа ${status} укажи description: ${validation.description}`
                );
            }
        }

        // content / mediaType
        if (validation.mediaType) {
            const content =
                response.content || {};

            const mediaType =
                content[validation.mediaType];

            if (!mediaType) {
                errors.push(
                    `Ответ ${status} должен содержать ${validation.mediaType}.`
                );

                continue;
            }

            // $ref
            if (validation.schemaRef) {
                const actualRef =
                    mediaType.schema?.$ref;

                if (
                    actualRef !==
                    validation.schemaRef
                ) {
                    errors.push(
                        `Схема ответа ${status} должна использовать $ref: ${validation.schemaRef}.`
                    );
                }
            }

            /*
             * Example
             *
             * Проверяем только наличие example.
             *
             * Само значение example намеренно
             * не сравниваем с эталоном.
             *
             * Поэтому:
             *
             * MacBook Pro → OK
             * Lenovo ThinkPad → OK
             * Иван → OK
             * Петр → OK
             *
             * Главное — чтобы example существовал.
             */
            if (validation.example) {
                if (mediaType.example === undefined) {
                    errors.push(
                        `Ответ ${status} должен содержать example.`
                    );
                }
            }
        }
    }
}


function validateResponse(
    operation,
    validation,
    errors
) {
    const response =
        operation.responses?.[
            validation.response
        ];

    if (!response) {
        errors.push(
            `Добавь ответ с кодом ${validation.response}.`
        );

        return;
    }

    if (validation.responseDescription) {
        if (
            response.description !==
            validation.responseDescription
        ) {
            errors.push(
                `Для ответа ${validation.response} укажи description: ${validation.responseDescription}`
            );
        }
    }
}


function validateParameter(
    operation,
    requiredParameter,
    errors
) {
    const parameters =
        operation.parameters || [];

    const parameter =
        parameters.find(
            item =>
                item.name ===
                    requiredParameter.name &&
                item.in ===
                    requiredParameter.in
        );

    if (!parameter) {
        errors.push(
            `Добавь параметр ${requiredParameter.name} с in: ${requiredParameter.in}.`
        );

        return;
    }

    if (
        requiredParameter.required &&
        parameter.required !== true
    ) {
        errors.push(
            `Параметр ${requiredParameter.name} должен иметь required: true.`
        );
    }

    const actualType =
        parameter.schema?.type;

    if (
        requiredParameter.type &&
        actualType !== requiredParameter.type
    ) {
        errors.push(
            `Параметр ${requiredParameter.name} должен иметь type: ${requiredParameter.type}.`
        );
    }
}


function validateSchemas(
    specification,
    schemasValidation,
    errors
) {
    const schemas =
        specification.components?.schemas;

    if (!schemas) {
        errors.push(
            "Добавь components.schemas с необходимыми схемами."
        );

        return;
    }

    for (
        const [
            schemaName,
            validation
        ] of Object.entries(schemasValidation)
    ) {
        const schema =
            schemas[schemaName];

        if (!schema) {
            errors.push(
                `Добавь схему components.schemas.${schemaName}.`
            );

            continue;
        }

        validateSchema(
            schemaName,
            schema,
            validation,
            errors
        );
    }
}


function validateSchema(
    schemaName,
    schema,
    validation,
    errors
) {
    // type
    if (
        validation.type &&
        schema.type !== validation.type
    ) {
        errors.push(
            `Схема ${schemaName} должна иметь type: ${validation.type}.`
        );
    }

    // required
    if (validation.required) {
        const actualRequired =
            schema.required || [];

        for (
            const property
            of validation.required
        ) {
            if (
                !actualRequired.includes(
                    property
                )
            ) {
                errors.push(
                    `В схеме ${schemaName} добавь required: ${property}.`
                );
            }
        }
    }

    const properties =
        schema.properties || {};

    // properties
    if (validation.properties) {
        for (
            const [
                propertyName,
                propertyValidation
            ] of Object.entries(
                validation.properties
            )
        ) {
            const property =
                properties[propertyName];

            if (!property) {
                errors.push(
                    `В схеме ${schemaName} добавь свойство ${propertyName}.`
                );

                continue;
            }

            validateProperty(
                schemaName,
                propertyName,
                property,
                propertyValidation,
                errors
            );
        }
    }

    // forbidden properties
    if (validation.forbiddenProperties) {
        for (
            const propertyName
            of validation.forbiddenProperties
        ) {
            if (
                properties[propertyName]
            ) {
                errors.push(
                    `В схеме ${schemaName} не должно быть свойства ${propertyName}.`
                );
            }
        }
    }
}


function validateProperty(
    schemaName,
    propertyName,
    property,
    validation,
    errors
) {
    // обычный type
    if (
        validation.type &&
        property.type !== validation.type
    ) {
        errors.push(
            `Свойство ${schemaName}.${propertyName} должно иметь type: ${validation.type}.`
        );
    }

    // $ref
    if (validation.ref) {
        if (
            property.$ref !==
            validation.ref
        ) {
            errors.push(
                `Свойство ${schemaName}.${propertyName} должно использовать $ref: ${validation.ref}.`
            );
        }
    }

    // array
    if (validation.type === "array") {
        if (!property.items) {
            errors.push(
                `Свойство ${schemaName}.${propertyName} должно иметь items.`
            );

            return;
        }

        if (validation.itemsRef) {
            if (
                property.items.$ref !==
                validation.itemsRef
            ) {
                errors.push(
                    `Элементы массива ${schemaName}.${propertyName} должны использовать $ref: ${validation.itemsRef}.`
                );
            }
        }
    }
}