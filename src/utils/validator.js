
import { parse } from "yaml";
import { validate } from "@scalar/openapi-parser";

export async function validateLesson(
    lesson,
    yamlText
) {
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
        const scalarResult =
            await validate(specification);

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
    /*
     * Новый формат финального задания:
     *
     * validation: {
     *     paths: {
     *         "/users": {
     *             get: { ... },
     *             post: { ... }
     *         },
     *
     *         "/users/{id}": {
     *             get: { ... },
     *             put: { ... },
     *             delete: { ... }
     *         }
     *     },
     *
     *     schemas: { ... }
     * }
     */
    if (validation.paths) {
        validatePaths(
            specification,
            validation.paths,
            errors
        );

        if (validation.schemas) {
            validateSchemas(
                specification,
                validation.schemas,
                errors
            );
        }

        return;
    }

    /*
     * Формат для уроков, где один endpoint
     * содержит несколько операций:
     *
     * validation: {
     *     requiredPath: "/users/{id}",
     *
     *     operations: {
     *         put: { ... },
     *         delete: { ... }
     *     }
     * }
     */
    if (validation.operations) {
        const path =
            specification.paths?.[
                validation.requiredPath
            ];

        if (!path) {
            const methods =
                Object.keys(
                    validation.operations
                )
                    .map(method =>
                        method.toUpperCase()
                    )
                    .join(" / ");

            errors.push(
                `Добавь endpoint ${methods} ${validation.requiredPath}.`
            );

            return;
        }

        for (
            const [
                method,
                operationValidation
            ] of Object.entries(
                validation.operations
            )
        ) {
            validateOperation(
                path,
                validation.requiredPath,
                method,
                operationValidation,
                errors
            );
        }

        if (validation.schemas) {
            validateSchemas(
                specification,
                validation.schemas,
                errors
            );
        }

        return;
    }

    /*
     * Старый формат:
     *
     * validation: {
     *     requiredPath: "/users",
     *     method: "post",
     *     ...
     * }
     *
     * Оставляем для предыдущих уроков.
     */
    if (validation.requiredPath) {
        const path =
            specification.paths?.[
                validation.requiredPath
            ];

        if (!path) {
            errors.push(
                `Добавь endpoint ${validation.method?.toUpperCase() || ""} ${validation.requiredPath}.`
            );

            return;
        }

        if (validation.method) {
            validateOperation(
                path,
                validation.requiredPath,
                validation.method,
                validation,
                errors
            );
        }

        if (validation.schemas) {
            validateSchemas(
                specification,
                validation.schemas,
                errors
            );
        }
    }
}


function validatePaths(
    specification,
    pathsValidation,
    errors
) {
    for (
        const [
            pathName,
            pathValidation
        ] of Object.entries(
            pathsValidation
        )
    ) {
        const path =
            specification.paths?.[
                pathName
            ];

        if (!path) {
            const methods =
                Object.keys(
                    pathValidation
                )
                    .map(method =>
                        method.toUpperCase()
                    )
                    .join(" / ");

            errors.push(
                `Добавь endpoint ${methods} ${pathName}.`
            );

            continue;
        }

        for (
            const [
                method,
                operationValidation
            ] of Object.entries(
                pathValidation
            )
        ) {
            validateOperation(
                path,
                pathName,
                method,
                operationValidation,
                errors
            );
        }
    }
}


function validateOperation(
    path,
    pathName,
    method,
    validation,
    errors
) {
    const operation =
        path[method];

    if (!operation) {
        errors.push(
            `Добавь метод ${method.toUpperCase()} для ${pathName}.`
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
                `Для ${method.toUpperCase()} ${pathName} укажи summary: ${validation.summary}`
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
                `Для ${method.toUpperCase()} ${pathName} укажи operationId: ${validation.operationId}`
            );
        }
    }

    // parameters
    if (validation.parameters) {
        validateParameters(
            operation,
            validation.parameters,
            errors
        );
    }

    // required parameter
    if (validation.requiredParameter) {
        validateParameter(
            operation,
            validation.requiredParameter,
            errors
        );
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

    // requestBody
    if (validation.requestBody) {
        validateRequestBody(
            operation,
            validation.requestBody,
            errors
        );
    }
}


function validateParameters(
    operation,
    parametersValidation,
    errors
) {
    for (
        const [
            parameterName,
            validation
        ] of Object.entries(
            parametersValidation
        )
    ) {
        validateParameter(
            operation,
            {
                name: parameterName,
                ...validation
            },
            errors
        );
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

    // required
    if (
        requiredParameter.required !==
        undefined
    ) {
        if (
            parameter.required !==
            requiredParameter.required
        ) {
            errors.push(
                `Параметр ${requiredParameter.name} должен иметь required: ${requiredParameter.required}.`
            );
        }
    }

    const schema =
        parameter.schema || {};

    // type
    if (
        requiredParameter.type &&
        schema.type !==
            requiredParameter.type
    ) {
        errors.push(
            `Параметр ${requiredParameter.name} должен иметь type: ${requiredParameter.type}.`
        );
    }

    // format
    if (
        requiredParameter.format &&
        schema.format !==
            requiredParameter.format
    ) {
        errors.push(
            `Параметр ${requiredParameter.name} должен иметь format: ${requiredParameter.format}.`
        );
    }

    // minimum
    if (
        requiredParameter.minimum !==
        undefined
    ) {
        if (
            schema.minimum !==
            requiredParameter.minimum
        ) {
            errors.push(
                `Параметр ${requiredParameter.name} должен иметь minimum: ${requiredParameter.minimum}.`
            );
        }
    }

    // maximum
    if (
        requiredParameter.maximum !==
        undefined
    ) {
        if (
            schema.maximum !==
            requiredParameter.maximum
        ) {
            errors.push(
                `Параметр ${requiredParameter.name} должен иметь maximum: ${requiredParameter.maximum}.`
            );
        }
    }

    // minLength
    if (
        requiredParameter.minLength !==
        undefined
    ) {
        if (
            schema.minLength !==
            requiredParameter.minLength
        ) {
            errors.push(
                `Параметр ${requiredParameter.name} должен иметь minLength: ${requiredParameter.minLength}.`
            );
        }
    }

    // maxLength
    if (
        requiredParameter.maxLength !==
        undefined
    ) {
        if (
            schema.maxLength !==
            requiredParameter.maxLength
        ) {
            errors.push(
                `Параметр ${requiredParameter.name} должен иметь maxLength: ${requiredParameter.maxLength}.`
            );
        }
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
        ] of Object.entries(
            responsesValidation
        )
    ) {
        const response =
            responses[status];

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

        /*
         * Если response должен содержать
         * application/json.
         */
        if (validation.mediaType) {
            const content =
                response.content || {};

            const mediaType =
                content[
                    validation.mediaType
                ];

            if (!mediaType) {
                errors.push(
                    `Ответ ${status} должен содержать ${validation.mediaType}.`
                );

                continue;
            }

            // schemaRef
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

            // arrayItemsRef
            if (validation.arrayItemsRef) {
                const schema =
                    mediaType.schema || {};

                if (
                    schema.type !==
                    "array"
                ) {
                    errors.push(
                        `Ответ ${status} должен содержать JSON-массив.`
                    );
                } else if (
                    schema.items?.$ref !==
                    validation.arrayItemsRef
                ) {
                    errors.push(
                        `Элементы массива ответа ${status} должны использовать $ref: ${validation.arrayItemsRef}.`
                    );
                }
            }

            /*
             * Example
             *
             * Проверяем только наличие example.
             */
            if (validation.example) {
                if (
                    mediaType.example ===
                    undefined
                ) {
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


function validateRequestBody(
    operation,
    validation,
    errors
) {
    const requestBody =
        operation.requestBody;

    if (!requestBody) {
        errors.push(
            "Добавь requestBody."
        );

        return;
    }

    // required
    if (
        validation.required &&
        requestBody.required !== true
    ) {
        errors.push(
            "requestBody должен иметь required: true."
        );
    }

    const content =
        requestBody.content || {};

    // mediaType
    if (validation.mediaType) {
        const mediaType =
            content[
                validation.mediaType
            ];

        if (!mediaType) {
            errors.push(
                `requestBody должен содержать ${validation.mediaType}.`
            );

            return;
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
                    `Схема requestBody должна использовать $ref: ${validation.schemaRef}.`
                );
            }
        }

        /*
         * Example
         *
         * Проверяем только наличие example.
         */
        if (validation.example) {
            if (
                mediaType.example ===
                undefined
            ) {
                errors.push(
                    "requestBody должен содержать example."
                );
            }
        }
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
        ] of Object.entries(
            schemasValidation
        )
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
        schema.type !==
            validation.type
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
    // type
    if (
        validation.type &&
        property.type !==
            validation.type
    ) {
        errors.push(
            `Свойство ${schemaName}.${propertyName} должно иметь type: ${validation.type}.`
        );
    }

    // format
    if (
        validation.format &&
        property.format !==
            validation.format
    ) {
        errors.push(
            `Свойство ${schemaName}.${propertyName} должно иметь format: ${validation.format}.`
        );
    }

    // minimum
    if (
        validation.minimum !==
        undefined
    ) {
        if (
            property.minimum !==
            validation.minimum
        ) {
            errors.push(
                `Свойство ${schemaName}.${propertyName} должно иметь minimum: ${validation.minimum}.`
            );
        }
    }

    // maximum
    if (
        validation.maximum !==
        undefined
    ) {
        if (
            property.maximum !==
            validation.maximum
        ) {
            errors.push(
                `Свойство ${schemaName}.${propertyName} должно иметь maximum: ${validation.maximum}.`
            );
        }
    }

    // minLength
    if (
        validation.minLength !==
        undefined
    ) {
        if (
            property.minLength !==
            validation.minLength
        ) {
            errors.push(
                `Свойство ${schemaName}.${propertyName} должно иметь minLength: ${validation.minLength}.`
            );
        }
    }

    // maxLength
    if (
        validation.maxLength !==
        undefined
    ) {
        if (
            property.maxLength !==
            validation.maxLength
        ) {
            errors.push(
                `Свойство ${schemaName}.${propertyName} должно иметь maxLength: ${validation.maxLength}.`
            );
        }
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
