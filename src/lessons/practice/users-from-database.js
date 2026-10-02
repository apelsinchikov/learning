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
                    ├── address[]
                    │
                    └── devices[]
        `,

        task: {
            intro: `
                Спроектируй OpenAPI 3.0.3 спецификацию
                для получения пользователя по его идентификатору.

                Твоя задача — не скопировать таблицы базы данных,
                а создать отдельную API-модель User,
                удобную для клиента.
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

                        Значение id должно иметь тип integer.
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
                                Если пользователь найден,
                                API должно вернуть статус 200.

                                Ответ должен содержать
                                application/json и использовать
                                схему User через $ref.

                                Также добавь example с конкретным
                                JSON-ответом пользователя.

                                Значения внутри example можешь
                                выбрать самостоятельно.
                            `,
                            code: `content:
  application/json:
    schema:
      $ref: '#/components/schemas/User'
    example:
      id: 1
      firstName: Иван
      lastName: Иванов
      phones:
        - phone: "+79990000000"
          type: mobile
      address:
        - city: Москва
          street: Ленина
          house: "10"
          apartment: "25"
      devices:
        - name: MacBook Pro
          operatingSystem: macOS
          inventoryNumber: INV-001`
                        },
                        {
                            status: "404",
                            description: "User not found",
                            text: `
                                Если пользователя с указанным id
                                не существует, API должно вернуть 404.
                            `
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

                        Свойства phones, address и devices
                        должны быть массивами.

                        Каждый элемент массива должен
                        использовать соответствующую схему
                        через $ref.
                    `,
                    properties: [
                        ["id", "integer", true],
                        ["firstName", "string", true],
                        ["lastName", "string", true],
                        ["phones", "array", true],
                        ["address", "array", true],
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

                        Не добавляй сюда поля id, userId
                        и isPrimary из таблицы userPhones.
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
                        через $ref внутри массива address.

                        Не добавляй сюда поля id и userId
                        из таблицы userAddress.
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

                        В API не возвращай Device.id.

                        Вместо технического id используй
                        бизнес-поле inventoryNumber.
                    `,
                    properties: [
                        ["name", "string", true],
                        ["operatingSystem", "string", true],
                        ["inventoryNumber", "string", true]
                    ],
                    ref: "#/components/schemas/UserDevice"
                },

                {
                    title: "9. Связь пользователя с телефонами",
                    type: "code",
                    language: "yaml",
                    code: `phones:
  type: array
  items:
    $ref: '#/components/schemas/UserPhone'`,
                    text: `
                        Связь usersPersonalData → userPhones
                        является связью 1:N.

                        Один пользователь может иметь
                        один или несколько телефонов.

                        Поэтому в API phones должен быть массивом.

                        Каждый элемент массива должен
                        использовать UserPhone через $ref.
                    `
                },

                {
                    title: "10. Связь пользователя с адресами",
                    type: "code",
                    language: "yaml",
                    code: `address:
  type: array
  items:
    $ref: '#/components/schemas/UserAddress'`,
                    text: `
                        Связь usersPersonalData → userAddress
                        также является связью 1:N.

                        Один пользователь может иметь
                        один или несколько адресов.

                        Поэтому address должен быть массивом.

                        Каждый элемент массива должен
                        использовать UserAddress через $ref.
                    `
                },

                {
                    title: "11. Связь пользователя с устройствами",
                    type: "code",
                    language: "yaml",
                    code: `devices:
  type: array
  items:
    $ref: '#/components/schemas/UserDevice'`,
                    text: `
                        Связь usersPersonalData → mapUserDevice
                        позволяет получить устройства пользователя.

                        Один пользователь может быть связан
                        с несколькими устройствами.

                        Таблица mapUserDevice является
                        внутренней таблицей связи и не должна
                        появляться в API-модели.

                        В API мы сразу представляем результат
                        этой связи как массив devices.
                    `
                },

                {
                    title: "12. Чего НЕ должно быть в API",
                    type: "warning",
                    titleText: "Не возвращай внутренние поля базы данных",
                    text: `
                        Не нужно переносить в API все поля,
                        которые существуют в базе данных.

                        В таблице usersPersonalData существуют
                        поля gender, birthDate и email.

                        Они НЕ должны появиться
                        в User API Schema.

                        В таблицах userPhones и userAddress
                        есть технические поля id и userId.

                        В таблице mapUserDevice есть
                        технические поля id, userId и deviceId.

                        Device.id также является техническим
                        идентификатором базы данных.

                        Все эти поля должны остаться
                        внутри базы данных.
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
                    title: "13. Device ID и inventoryNumber",
                    type: "warning",
                    titleText: "Не перепутай два разных значения",
                    text: `
                        Device.id и Device.inventoryNumber —
                        это разные поля.

                        id используется как технический
                        идентификатор записи в базе данных.

                        inventoryNumber — бизнес-значение,
                        которое используется как инвентарный номер.

                        В API не нужно возвращать Device.id.

                        В API нужно вернуть inventoryNumber.
                    `,
                    comparison: [
                        ["Device.id", "5832"],
                        ["Device.inventoryNumber", "IT-LT-004271"]
                    ],
                    conclusion: `
                        В UserDevice используй inventoryNumber,
                        а не технический Device.id.
                    `
                },

                {
                    title: "14. Как данные из БД превращаются в User",
                    type: "table",
                    columns: [
                        "Источник в БД",
                        "API-поле",
                        "Тип"
                    ],
                    rows: [
                        [
                            "usersPersonalData.id",
                            "User.id",
                            "integer"
                        ],
                        [
                            "usersPersonalData.firstName",
                            "User.firstName",
                            "string"
                        ],
                        [
                            "usersPersonalData.lastName",
                            "User.lastName",
                            "string"
                        ],
                        [
                            "userPhones.phone",
                            "User.phones[].phone",
                            "string"
                        ],
                        [
                            "userPhones.phoneType",
                            "User.phones[].type",
                            "string"
                        ],
                        [
                            "userAddress.city",
                            "User.address[].city",
                            "string"
                        ],
                        [
                            "userAddress.street",
                            "User.address[].street",
                            "string"
                        ],
                        [
                            "userAddress.house",
                            "User.address[].house",
                            "string"
                        ],
                        [
                            "userAddress.apartment",
                            "User.address[].apartment",
                            "string"
                        ],
                        [
                            "Device.name",
                            "User.devices[].name",
                            "string"
                        ],
                        [
                            "Device.operatingSystem",
                            "User.devices[].operatingSystem",
                            "string"
                        ],
                        [
                            "Device.inventoryNumber",
                            "User.devices[].inventoryNumber",
                            "string"
                        ]
                    ]
                },

                {
                    title: "15. Что такое example",
                    type: "highlight",
                    text: `
                        Schema описывает форму данных:

                        какие поля существуют,
                        какие у них типы,
                        какие поля обязательные.

                        Example показывает конкретный пример
                        JSON-ответа, который соответствует этой схеме.

                        Example нужен для документации API,
                        чтобы клиент мог сразу увидеть,
                        как реально может выглядеть ответ.

                        В этом задании example обязателен
                        для ответа 200.

                        При этом конкретные значения
                        выбираешь ты сам.
                    `
                },

                {
                    title: "16. Example ответа",
                    type: "code",
                    language: "yaml",
                    code: `content:
  application/json:
    schema:
      $ref: '#/components/schemas/User'

    example:
      id: 1
      firstName: Иван
      lastName: Иванов
      phones:
        - phone: "+79990000000"
          type: mobile
      address:
        - city: Москва
          street: Ленина
          house: "10"
          apartment: "25"
      devices:
        - name: MacBook Pro
          operatingSystem: macOS
          inventoryNumber: INV-001`,
                    text: `
                        Добавь example непосредственно
                        внутрь application/json.

                        Example должен описывать
                        реальный JSON-ответ пользователя.

                        Конкретные значения можешь изменить.

                        Например, вместо MacBook Pro
                        можно указать Lenovo ThinkPad.

                        Важно наличие example,
                        а не конкретные значения внутри него.
                    `
                },

                {
                    title: "17. Итоговая структура ответа",
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
    },
    {
      "phone": "+7 999 765-43-21",
      "type": "mobile"
    }
  ],
  "address": [
    {
      "city": "Москва",
      "street": "Лесная",
      "house": "19",
      "apartment": "42"
    },
    {
      "city": "Москва",
      "street": "Тверская",
      "house": "10",
      "apartment": "15"
    }
  ],
  "devices": [
    {
      "name": "iPhone 16 Pro Max",
      "operatingSystem": "iOS",
      "inventoryNumber": "IT-PH-001542"
    },
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

                        Обрати внимание:

                        один пользователь содержит
                        несколько телефонов;

                        один пользователь содержит
                        несколько адресов;

                        один пользователь может иметь
                        несколько устройств.

                        Внутренние таблицы и технические
                        идентификаторы при этом не видны клиенту.
                    `
                },

                {
                    title: "18. Переиспользование схем через $ref",
                    type: "checklist",
                    items: [
                        "Используй $ref для переиспользуемых схем.",
                        "Не копируй одну и ту же структуру несколько раз.",
                        "UserPhone должен использоваться через $ref внутри phones.",
                        "UserAddress должен использоваться через $ref внутри address.",
                        "UserDevice должен использоваться через $ref внутри devices.",
                        "User должен использоваться через $ref в response."
                    ]
                },

                {
                    title: "19. Главная цель",
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
                        • какие поля нужно намеренно не возвращать;
                        • почему mapUserDevice не должна становиться
                          отдельным объектом в API;
                        • почему Device.id не обязательно
                          должен попадать в API;
                        • зачем response example нужен
                          в документации API.
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

        responses: {
            "200": {
                description: "User found",
                mediaType: "application/json",
                schemaRef: "#/components/schemas/User",

                /*
                 * Само содержимое example validator
                 * не сравнивает.
                 *
                 * Этот объект здесь означает:
                 * example обязателен.
                 */
                example: {
                    id: 1,
                    firstName: "Иван",
                    lastName: "Иванов",
                    phones: [
                        {
                            phone: "+79990000000",
                            type: "mobile"
                        }
                    ],
                    address: [
                        {
                            city: "Москва",
                            street: "Ленина",
                            house: "10",
                            apartment: "25"
                        }
                    ],
                    devices: [
                        {
                            name: "MacBook Pro",
                            operatingSystem: "macOS",
                            inventoryNumber: "INV-001"
                        }
                    ]
                }
            },

            "404": {
                description: "User not found"
            }
        },

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
                        type: "array",
                        itemsRef: "#/components/schemas/UserAddress"
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

        Связи 1:N были представлены массивами:

        phones[]
        address[]
        devices[]

        Повторяющиеся структуры были вынесены
        в отдельные schemas и связаны через $ref.

        Response 200 содержит application/json,
        ссылку на User через $ref и example,
        который показывает клиенту реальную форму ответа.

        Конкретные значения внутри example
        могут быть любыми подходящими данными.

        Внутренние поля базы данных не попали
        в публичный API-контракт.

        Device.id также не попал в API —
        вместо технического идентификатора используется
        бизнес-значение inventoryNumber.

        Это уже гораздо ближе к реальной
        проектной работе с OpenAPI.
    `
};