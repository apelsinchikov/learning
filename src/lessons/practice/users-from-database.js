export const usersFromDatabase = {
    id: "practice-9",
    type: "practice",
    icon: "🛠️",
    title: "Users API из базы данных",
    subtitle: "Спроектируем API-ответ на основе данных из нескольких связанных таблиц.",
    sidebarDescription: "API поверх БД",

    theoryLinks: [
        "theory-1",
        "theory-3",
        "theory-4",
        "theory-5",
        "theory-6",
        "theory-7",
        "theory-9"
    ],

    theory: {
        title: "Проектируем API поверх реальной БД",

        text: `
            До этого момента мы создавали OpenAPI-спецификацию
            на основе заранее известных структур.

            Теперь задача становится ближе к реальной разработке.

            У нас есть база данных, состоящая из нескольких
            связанных таблиц.

            Нужно самостоятельно спроектировать API,
            которое объединит данные из этих таблиц
            в удобный для клиента JSON-ответ.

            Важно:

            структура API не должна просто копировать
            структуру базы данных.

            Нужно спроектировать отдельный API DTO.
        `,

        idea: `
            База данных:

            usersPersonalData
            userPhones
            userAddress
            mapUserDevice
            Device

                    ↓

              API DTO User

                    ↓

              JSON Response
        `,

        structure: `
            GET /users/{id}

                    │
                    ├── id
                    ├── firstName
                    ├── lastName
                    │
                    ├── phones[]
                    │
                    ├── address
                    │
                    └── devices[]
        `,

        task: {
            intro: `
                Спроектируй OpenAPI 3.0.3 спецификацию
                для получения пользователя по его идентификатору.
            `,

            sections: [
                {
                    title: "1. Базовая OpenAPI-спецификация",
                    type: "code",
                    language: "yaml",
                    code: `openapi: 3.0.3
info:
  title: Users API
  version: 1.0.0`
                },

                {
                    title: "2. Endpoint",
                    type: "endpoint",
                    method: "GET",
                    path: "/users/{id}",
                    fields: [
                        ["summary", "Get user"],
                        ["operationId", "getUser"]
                    ],
                    text: `
                        Создай endpoint GET /users/{id}.

                        Укажи summary: Get user
                        и operationId: getUser.
                    `
                },

                {
                    title: "3. Path parameter",
                    type: "code",
                    language: "yaml",
                    code: `name: id
in: path
required: true
schema:
  type: integer`,
                    text: `
                        Добавь обязательный path parameter id.
                    `
                },

                {
                    title: "4. Responses",
                    type: "responses",
                    responses: [
                        {
                            status: "200",
                            description: "User found",
                            text: `
                                Ответ должен содержать
                                application/json и возвращать
                                User через $ref.
                            `,
                            code: `content:
  application/json:
    schema:
      $ref: '#/components/schemas/User'`
                        },
                        {
                            status: "404",
                            description: "User not found"
                        }
                    ]
                },

                {
                    title: "5. Схема User",
                    type: "schema-table",
                    schemaName: "User",
                    text: `
                        Создай схему User.
                        Она должна иметь type: object.

                        Все перечисленные свойства должны
                        быть обязательными.
                    `,
                    properties: [
                        ["id", "integer", true],
                        ["firstName", "string", true],
                        ["lastName", "string", true],
                        ["phones", "array", true],
                        ["address", "object", true],
                        ["devices", "array", true]
                    ]
                },

                {
                    title: "6. Схема UserPhone",
                    type: "schema-table",
                    schemaName: "UserPhone",
                    text: `
                        Создай отдельную схему UserPhone.

                        Оба свойства обязательные.

                        User должен использовать UserPhone
                        через $ref внутри массива phones.
                    `,
                    properties: [
                        ["phone", "string", true],
                        ["type", "string", true]
                    ],
                    ref: "#/components/schemas/UserPhone"
                },

                {
                    title: "7. Схема UserAddress",
                    type: "schema-table",
                    schemaName: "UserAddress",
                    text: `
                        Создай отдельную схему UserAddress.

                        Все четыре свойства обязательные.

                        User должен использовать UserAddress
                        через $ref.
                    `,
                    properties: [
                        ["city", "string", true],
                        ["street", "string", true],
                        ["house", "string", true],
                        ["apartment", "string", true]
                    ],
                    ref: "#/components/schemas/UserAddress"
                },

                {
                    title: "8. Схема UserDevice",
                    type: "schema-table",
                    schemaName: "UserDevice",
                    text: `
                        Создай отдельную схему UserDevice.

                        Все три свойства обязательные.

                        User должен использовать UserDevice
                        через $ref внутри массива devices.
                    `,
                    properties: [
                        ["name", "string", true],
                        ["operatingSystem", "string", true],
                        ["inventoryNumber", "string", true]
                    ],
                    ref: "#/components/schemas/UserDevice"
                },

                {
                    title: "9. Чего НЕ должно быть в API",
                    type: "warning",
                    titleText: "Не возвращай внутренние поля базы данных",
                    text: `
                        В таблице usersPersonalData существуют
                        поля gender, birthDate и email.

                        Но они НЕ должны появиться
                        в User API Schema.

                        Также не нужно возвращать технические
                        поля связующих таблиц.
                    `,
                    groups: [
                        {
                            name: "usersPersonalData",
                            fields: [
                                "gender",
                                "birthDate",
                                "email"
                            ]
                        },
                        {
                            name: "userPhones",
                            fields: [
                                "id",
                                "userId",
                                "isPrimary"
                            ]
                        },
                        {
                            name: "userAddress",
                            fields: [
                                "id",
                                "userId"
                            ]
                        },
                        {
                            name: "mapUserDevice",
                            fields: [
                                "id",
                                "userId",
                                "deviceId"
                            ]
                        },
                        {
                            name: "Device",
                            fields: [
                                "id"
                            ]
                        }
                    ]
                },

                {
                    title: "10. Device ID и inventoryNumber",
                    type: "warning",
                    titleText: "Не перепутай два разных значения",
                    text: `
                        Device.id и Device.inventoryNumber —
                        это разные поля.

                        id используется как технический
                        идентификатор записи в базе данных.

                        inventoryNumber — бизнес-значение,
                        которое используется как инвентарный номер.
                    `,
                    comparison: [
                        ["Device.id", "5832"],
                        ["Device.inventoryNumber", "IT-LT-004271"]
                    ],
                    conclusion: `
                        В API нужно вернуть именно inventoryNumber.
                    `
                },

                {
                    title: "11. Итоговая структура ответа",
                    type: "code",
                    language: "json",
                    code: `{
  "id": 42,
  "firstName": "Иван",
  "lastName": "Иванов",
  "phones": [
    {
      "phone": "+7 999 123-45-67",
      "type": "mobile"
    }
  ],
  "address": {
    "city": "Moscow",
    "street": "Tverskaya",
    "house": "10",
    "apartment": "42"
  },
  "devices": [
    {
      "name": "MacBook Air",
      "operatingSystem": "macOS",
      "inventoryNumber": "IT-LT-004271"
    }
  ]
}`,
                    text: `
                        Успешный GET /users/{id} должен
                        возвращать JSON примерно такого вида.
                    `
                },

                {
                    title: "12. Переиспользование схем через $ref",
                    type: "checklist",
                    items: [
                        "Используй $ref для переиспользуемых схем.",
                        "Не копируй одну и ту же структуру несколько раз.",
                        "UserPhone должен использоваться через $ref.",
                        "UserAddress должен использоваться через $ref.",
                        "UserDevice должен использоваться через $ref.",
                        "User должен использоваться через $ref в response."
                    ]
                },

                {
                    title: "13. Главная цель",
                    type: "goal",
                    text: `
                        Не просто написать YAML,
                        который проходит валидатор.

                        Нужно спроектировать API-модель,
                        которая правильно преобразует
                        данные базы данных в контракт API.

                        Подумай:

                        • какие данные нужны клиенту;
                        • какие данные являются внутренними;
                        • какие связи 1:N превращаются в массивы;
                        • какие структуры стоит вынести в отдельные schemas;
                        • какие поля нужно намеренно не возвращать.
                    `
                }
            ]
        }
    },

    initialYaml: `openapi: 3.0.3
info:
  title: Users API
  version: 1.0.0

paths: {}

components:
  schemas: {}`,

    validation: {
        requiredPath: "/users/{id}",
        method: "get",
        summary: "Get user",
        operationId: "getUser",

        response: "200",
        responseDescription: "User found",

        requiredParameter: {
            name: "id",
            in: "path",
            required: true,
            type: "integer"
        },

        schemas: {
            User: {
                type: "object",

                required: [
                    "id",
                    "firstName",
                    "lastName",
                    "phones",
                    "address",
                    "devices"
                ],

                properties: {
                    id: {
                        type: "integer"
                    },

                    firstName: {
                        type: "string"
                    },

                    lastName: {
                        type: "string"
                    },

                    phones: {
                        type: "array",
                        itemsRef: "#/components/schemas/UserPhone"
                    },

                    address: {
                        ref: "#/components/schemas/UserAddress"
                    },

                    devices: {
                        type: "array",
                        itemsRef: "#/components/schemas/UserDevice"
                    }
                },

                forbiddenProperties: [
                    "gender",
                    "birthDate",
                    "email"
                ]
            },

            UserPhone: {
                type: "object",

                required: [
                    "phone",
                    "type"
                ],

                properties: {
                    phone: {
                        type: "string"
                    },

                    type: {
                        type: "string"
                    }
                },

                forbiddenProperties: [
                    "id",
                    "userId",
                    "isPrimary"
                ]
            },

            UserAddress: {
                type: "object",

                required: [
                    "city",
                    "street",
                    "house",
                    "apartment"
                ],

                properties: {
                    city: {
                        type: "string"
                    },

                    street: {
                        type: "string"
                    },

                    house: {
                        type: "string"
                    },

                    apartment: {
                        type: "string"
                    }
                },

                forbiddenProperties: [
                    "id",
                    "userId"
                ]
            },

            UserDevice: {
                type: "object",

                required: [
                    "name",
                    "operatingSystem",
                    "inventoryNumber"
                ],

                properties: {
                    name: {
                        type: "string"
                    },

                    operatingSystem: {
                        type: "string"
                    },

                    inventoryNumber: {
                        type: "string"
                    }
                },

                forbiddenProperties: [
                    "id"
                ]
            }
        }
    },

    successMessage: `
        Отлично!

        Ты спроектировал API поверх реальной
        структуры базы данных.

        Здесь важно было не просто описать таблицы,
        а создать отдельную API-модель пользователя.

        Данные из нескольких таблиц были объединены
        в единый User DTO.

        Связи 1:N были представлены массивами,
        повторяющиеся структуры вынесены в отдельные schemas,
        а внутренние поля базы данных не попали
        в публичный API-контракт.

        Это уже гораздо ближе к реальной
        проектной работе с OpenAPI.
    `
};