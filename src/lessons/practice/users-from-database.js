export const usersFromDatabase = {
    id: "practice-9",
    type: "practice",
    icon: "🛠️",
    title: "Users API из базы данных",
    subtitle: "Спроектируем API-ответ на основе данных из нескольких связанных таблиц.",
    sidebarDescription: "API поверх БД",

    theoryLinks: [
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
            Это самая приближённая к работе практика.

            В реальных проектах аналитик получает техническое задание (ТЗ)
            и структуру базы данных, а не готовые подсказки.
            Здесь так же: ниже — ТЗ и таблицы базы, а описание API
            в формате OpenAPI ты пишешь сам.

            Сначала прочитай абстрактный пример про интернет-магазин:
            в нём показан весь путь от таблиц до OpenAPI на другой теме.
            Потом сделай то же самое для пользователей.
        `,

        idea: `
            Таблицы в базе данных
                    ↓
            Решаем, что нужно клиенту
                    ↓
            API-модель (схемы)
                    ↓
            Описание endpoint в OpenAPI
        `,

        task: {
            intro: `
                Опиши в OpenAPI получение пользователя по номеру:
                GET /users/{id}.

                Ответ должен собирать данные из нескольких таблиц базы
                в один понятный JSON. Не копируй таблицы целиком —
                отдавай клиенту только то, что ему нужно.
            `,

            sections: [
                {
                    title: "1. Структура базы данных",
                    type: "table",
                    columns: [
                        "Таблица",
                        "Поля",
                        "Что хранит"
                    ],
                    rows: [
                        [
                            "usersPersonalData",
                            "id, firstName, lastName, gender, birthDate, email",
                            "Основные данные пользователя"
                        ],
                        [
                            "userPhones",
                            "id, userId, phone, phoneType, isPrimary",
                            "Телефоны пользователя"
                        ],
                        [
                            "userAddress",
                            "id, userId, city, street, house, apartment",
                            "Адреса пользователя"
                        ],
                        [
                            "mapUserDevice",
                            "id, userId, deviceId",
                            "Связь пользователей и устройств"
                        ],
                        [
                            "Device",
                            "id, name, operatingSystem, inventoryNumber",
                            "Устройства компании"
                        ]
                    ]
                },
                {
                    title: "2. Связи между таблицами",
                    type: "table",
                    columns: [
                        "Связь",
                        "Как читать"
                    ],
                    rows: [
                        [
                            "userPhones.userId → usersPersonalData.id",
                            "У одного пользователя может быть несколько телефонов"
                        ],
                        [
                            "userAddress.userId → usersPersonalData.id",
                            "У одного пользователя может быть несколько адресов"
                        ],
                        [
                            "mapUserDevice.userId → usersPersonalData.id",
                            "Пользователь может быть связан с несколькими устройствами"
                        ],
                        [
                            "mapUserDevice.deviceId → Device.id",
                            "Одно устройство описано один раз в таблице Device"
                        ]
                    ]
                },
                {
                    title: "3. Пример на другой теме: заказ в интернет-магазине",
                    type: "text",
                    text: `
                        Задача примера: описать GET /orders/{id} — получить заказ.
                        В базе две таблицы: orders (заказы) и orderItems (позиции заказа).
                        В одном заказе может быть несколько позиций.
                    `
                },
                {
                    title: "3.1. Таблицы примера",
                    type: "table",
                    columns: [
                        "Таблица",
                        "Поля"
                    ],
                    rows: [
                        [
                            "orders",
                            "id, customerName, status, createdAt, internalComment, managerId"
                        ],
                        [
                            "orderItems",
                            "id, orderId, productName, quantity, price"
                        ]
                    ]
                },
                {
                    title: "3.2. Что решаем",
                    type: "table",
                    columns: [
                        "Решение",
                        "Почему"
                    ],
                    rows: [
                        [
                            "Позиции orderItems отдаём массивом items внутри заказа",
                            "Связь 1:N: у заказа несколько позиций"
                        ],
                        [
                            "Не отдаём internalComment и managerId",
                            "Это внутренние данные магазина, клиенту они не нужны"
                        ],
                        [
                            "Не отдаём orderItems.id и orderItems.orderId",
                            "Технические поля базы данных"
                        ]
                    ]
                },
                {
                    title: "3.3. Какой ответ получит клиент",
                    type: "code",
                    language: "json",
                    code: `{
  "id": 17,
  "customerName": "Мария",
  "status": "paid",
  "createdAt": "2026-10-01",
  "items": [
    {
      "productName": "Блокнот",
      "quantity": 2,
      "price": 150
    },
    {
      "productName": "Ручка",
      "quantity": 5,
      "price": 40
    }
  ]
}`
                },
                {
                    title: "3.4. Как это записано в OpenAPI",
                    type: "code",
                    language: "yaml",
                    code: `paths:
  /orders/{id}:
    get:
      summary: Get order
      operationId: getOrder
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: Order found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Order'
        '404':
          description: Order not found

components:
  schemas:
    Order:
      type: object
      properties:
        id:
          type: integer
        customerName:
          type: string
        status:
          type: string
        createdAt:
          type: string
        items:
          type: array
          items:
            $ref: '#/components/schemas/OrderItem'
      required:
        - id
        - customerName
        - status
        - createdAt
        - items

    OrderItem:
      type: object
      properties:
        productName:
          type: string
        quantity:
          type: integer
        price:
          type: number
      required:
        - productName
        - quantity
        - price`
                },
                {
                    title: "4. ТЗ: endpoint",
                    type: "table",
                    columns: [
                        "Что",
                        "Значение"
                    ],
                    rows: [
                        ["Метод и адрес", "GET /users/{id}"],
                        ["summary", "Get user"],
                        ["operationId", "getUser"],
                        ["Параметр", "id: в адресе (path), обязательный, целое число"],
                        ["Ответ 200", "description: User found; JSON по схеме User; обязательно с примером (example)"],
                        ["Ответ 404", "description: User not found"]
                    ]
                },
                {
                    title: "5. ТЗ: что должен вернуть API",
                    type: "text",
                    text: `
                        Клиент хочет получить пользователя целиком одним запросом:
                        его имя, все телефоны, все адреса и все устройства.

                        Устройства клиент опознаёт по инвентарному номеру,
                        а не по техническому id из базы.
                    `
                },
                {
                    title: "5.1. Схема User",
                    type: "table",
                    columns: [
                        "Поле",
                        "Тип",
                        "Обязательное",
                        "Откуда берём"
                    ],
                    rows: [
                        ["id", "integer", "да", "usersPersonalData.id"],
                        ["firstName", "string", "да", "usersPersonalData.firstName"],
                        ["lastName", "string", "да", "usersPersonalData.lastName"],
                        ["phones", "массив UserPhone", "да", "таблица userPhones"],
                        ["address", "массив UserAddress", "да", "таблица userAddress"],
                        ["devices", "массив UserDevice", "да", "таблицы mapUserDevice и Device"]
                    ]
                },
                {
                    title: "5.2. Схема UserPhone",
                    type: "table",
                    columns: [
                        "Поле",
                        "Тип",
                        "Обязательное",
                        "Откуда берём"
                    ],
                    rows: [
                        ["phone", "string", "да", "userPhones.phone"],
                        ["type", "string", "да", "userPhones.phoneType"]
                    ]
                },
                {
                    title: "5.3. Схема UserAddress",
                    type: "table",
                    columns: [
                        "Поле",
                        "Тип",
                        "Обязательное",
                        "Откуда берём"
                    ],
                    rows: [
                        ["city", "string", "да", "userAddress.city"],
                        ["street", "string", "да", "userAddress.street"],
                        ["house", "string", "да", "userAddress.house"],
                        ["apartment", "string", "да", "userAddress.apartment"]
                    ]
                },
                {
                    title: "5.4. Схема UserDevice",
                    type: "table",
                    columns: [
                        "Поле",
                        "Тип",
                        "Обязательное",
                        "Откуда берём"
                    ],
                    rows: [
                        ["name", "string", "да", "Device.name"],
                        ["operatingSystem", "string", "да", "Device.operatingSystem"],
                        ["inventoryNumber", "string", "да", "Device.inventoryNumber"]
                    ]
                },
                {
                    title: "6. ТЗ: чего не должно быть в API",
                    type: "table",
                    columns: [
                        "Таблица",
                        "Не отдаём",
                        "Почему"
                    ],
                    rows: [
                        ["usersPersonalData", "gender, birthDate, email", "Клиенту не нужны"],
                        ["userPhones", "id, userId, isPrimary", "Технические поля"],
                        ["userAddress", "id, userId", "Технические поля"],
                        ["mapUserDevice", "всю таблицу", "Это внутренняя связь: в API она превращается в массив devices"],
                        ["Device", "id", "Вместо технического id отдаём inventoryNumber"]
                    ]
                },
                {
                    title: "7. Ожидаемый вид ответа",
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
  "address": [
    {
      "city": "Москва",
      "street": "Лесная",
      "house": "19",
      "apartment": "42"
    }
  ],
  "devices": [
    {
      "name": "MacBook Air",
      "operatingSystem": "macOS",
      "inventoryNumber": "IT-LT-004271"
    }
  ]
}`
                },
                {
                    title: "8. Проверь себя перед кнопкой «Проверить»",
                    type: "checklist",
                    items: [
                        "Есть endpoint GET /users/{id} с summary и operationId.",
                        "Параметр id описан как обязательный path-параметр.",
                        "Ответы 200 и 404 описаны с нужными description.",
                        "В ответе 200 есть application/json, ссылка на User и example.",
                        "Схемы User, UserPhone, UserAddress и UserDevice лежат в components → schemas.",
                        "Массивы phones, address и devices ссылаются на свои схемы через $ref.",
                        "Все поля из ТЗ обязательные; лишних полей из базы нет."
                    ]
                },
                {
                    title: "9. Главная цель",
                    type: "goal",
                    text: `
                        Не просто написать YAML, который проходит проверку,
                        а понять логику: что из базы нужно клиенту,
                        какие связи 1:N превращаются в массивы
                        и какие технические поля остаются внутри.

                        Если застрял — вернись к примеру с заказом:
                        у тебя будет такой же ход решения.
                    `
                }
            ]
        }
    },

    initialYaml: `openapi: 3.0.3
info:
  title: Users API
  version: 1.0.0

paths:

components:
  schemas:`,

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
        в единую API-модель User.

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