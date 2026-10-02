
export const databaseToApi = {
    id: "theory-9",

    type: "theory",

    icon: "🗄️",

    title: "Как из базы данных сделать API-модель",

    subtitle:
        "Разберём, как данные из нескольких таблиц превращаются в удобный API-ответ.",

    sidebarDescription: "База данных → API",

    theory: {
        intro: `
            API не обязан повторять структуру базы данных.
            Наша задача — понять, **какие данные нужны клиенту**,
            получить их из базы и представить в удобной API-модели.
        `,

        sections: [
            {
                type: "definition",

                term: "Database Model",

                text: `
                    Это структура данных внутри базы данных:
                    таблицы, столбцы, первичные и внешние ключи,
                    связи между таблицами.
                `
            },

            {
                type: "definition",

                term: "API Model",

                text: `
                    Это структура данных, которую получает клиент API.

                    Она проектируется под потребности клиента
                    и может сильно отличаться от структуры базы данных.
                `
            },

            {
                type: "highlight",

                icon: "💡",

                title: "Главное правило урока",

                text: `
                    **Структура базы данных и структура API-ответа —
                    это не обязательно одно и то же.**

                    База хранит данные так, как удобно системе.
                    API отдаёт данные так, как удобно клиенту.
                `
            },

            {
                type: "database-diagram"
            },

            {
                type: "list",

                title: "Какие таблицы участвуют",

                items: [
                    "`usersPersonalData` — основные данные пользователя",
                    "`userPhones` — телефоны пользователя",
                    "`userAddress` — адрес пользователя",
                    "`mapUserDevice` — связь пользователя с устройствами",
                    "`Device` — данные устройства"
                ]
            },

            {
                type: "definition",

                term: "Primary Key (PK)",

                text: `
                    **Primary Key** — уникальный идентификатор записи
                    внутри таблицы.

                    Например:

                    \`usersPersonalData.id\`

                    Это идентификатор пользователя.
                `
            },

            {
                type: "definition",

                term: "Foreign Key (FK)",

                text: `
                    **Foreign Key** — поле, которое позволяет связать
                    запись одной таблицы с записью другой таблицы.

                    Например:

                    \`userPhones.userId\`

                    содержит идентификатор пользователя,
                    которому принадлежит телефон.

                    Поэтому \`userPhones.userId\` ссылается
                    на \`usersPersonalData.id\`.
                `
            },

            {
                type: "table",

                title: "Как таблицы связаны",

                columns: [
                    "Поле",
                    "Роль",
                    "Связано с"
                ],

                rows: [
                    [
                        "usersPersonalData.id",
                        "PK",
                        "Идентификатор пользователя"
                    ],
                    [
                        "userPhones.userId",
                        "FK",
                        "usersPersonalData.id"
                    ],
                    [
                        "userAddress.userId",
                        "FK",
                        "usersPersonalData.id"
                    ],
                    [
                        "mapUserDevice.userId",
                        "FK",
                        "usersPersonalData.id"
                    ],
                    [
                        "mapUserDevice.deviceId",
                        "FK",
                        "Device.id"
                    ]
                ]
            },

            {
                type: "highlight",

                icon: "🔗",

                title: "Что даёт внешний ключ",

                text: `
                    Когда мы видим \`userPhones.userId\`,
                    мы понимаем, **какому пользователю принадлежит телефон**.

                    Аналогично \`userAddress.userId\` позволяет найти
                    адрес конкретного пользователя.
                `
            },

            {
                type: "highlight",

                icon: "↔️",

                title: "1:N в базе → array в API",

                text: `
                    В базе несколько строк связаны с одним пользователем.

                    В API те же данные удобно представить
                    как **массив**.

                    Это один из самых важных переходов
                    между реляционной моделью и API-моделью.
                `
            },

            {
                type: "definition",

                term: "Связь 1:N — usersPersonalData → userPhones",

                text: `
                    У одного пользователя может быть один или несколько телефонов.

                    Каждый телефон принадлежит одному и только одному пользователю.

                    Например, пользователь с \`id = 42\`
                    может иметь два телефона: личный и рабочий.
                `
            },

            {
                type: "table",

                title: "Один пользователь — несколько телефонов",

                columns: [
                    "userId",
                    "phone",
                    "phoneType"
                ],

                rows: [
                    [
                        "42",
                        "+7 999 111-11-11",
                        "mobile"
                    ],
                    [
                        "42",
                        "+7 999 222-22-22",
                        "mobile"
                    ]
                ]
            },

            {
                type: "code",

                title: "Как это может выглядеть в API",

                language: "json",

                code: `
{
  "id": 42,
  "phones": [
    {
      "phone": "+7 999 111-11-11",
      "type": "mobile"
    },
    {
      "phone": "+7 999 222-22-22",
      "type": "mobile"
    }
  ]
}
                `.trim()
            },

            {
                type: "definition",

                term: "Связь 1:N — usersPersonalData → userAddress",

                text: `
                    У одного пользователя может быть один или несколько адресов.

                    Каждый адрес принадлежит одному и только одному пользователю.

                    Например, пользователь с \`id = 42\`
                    может иметь домашний и рабочий адрес.
                `
            },

            {
                type: "table",

                title: "Один пользователь — несколько адресов",

                columns: [
                    "userId",
                    "city",
                    "street",
                    "house",
                    "apartment"
                ],

                rows: [
                    [
                        "42",
                        "Москва",
                        "Лесная",
                        "19",
                        "42"
                    ],
                    [
                        "42",
                        "Москва",
                        "Тверская",
                        "10",
                        "15"
                    ]
                ]
            },

            {
                type: "code",

                title: "Как это может выглядеть в API",

                language: "json",

                code: `
{
  "id": 42,
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
  ]
}
                `.trim()
            },

            {
                type: "definition",

                term: "Связь 1:N — usersPersonalData → mapUserDevice",

                text: `
                    У одного пользователя может быть одна или несколько записей
                    в таблице \`mapUserDevice\`.

                    Каждая запись \`mapUserDevice\` относится к одному
                    и только одному пользователю.

                    Например, пользователь с \`id = 42\`
                    может быть связан с телефоном, ноутбуком и планшетом.
                `
            },

            {
                type: "table",

                title: "Один пользователь — несколько связанных устройств",

                columns: [
                    "userId",
                    "deviceId"
                ],

                rows: [
                    [
                        "42",
                        "15"
                    ],
                    [
                        "42",
                        "27"
                    ],
                    [
                        "42",
                        "31"
                    ]
                ]
            },

            {
                type: "code",

                title: "Как это может выглядеть в API",

                language: "json",

                code: `
{
  "id": 42,
  "devices": [
    {
      "id": 15,
      "name": "iPhone 16 Pro Max"
    },
    {
      "id": 27,
      "name": "MacBook Air"
    },
    {
      "id": 31,
      "name": "iPad Pro"
    }
  ]
}
                `.trim()
            },

            {
                type: "definition",

                term: "Связь N:1 — mapUserDevice → Device",

                text: `
                    Одна запись \`mapUserDevice\` ссылается
                    на одно и только одно устройство в таблице \`Device\`.

                    При этом одно устройство может быть связано
                    с одной или несколькими записями \`mapUserDevice\`.

                    Например, несколько записей \`mapUserDevice\`
                    могут ссылаться на устройство с \`id = 15\`.
                `
            },

            {
                type: "table",

                title: "Несколько связей — одно устройство",

                columns: [
                    "id",
                    "userId",
                    "deviceId"
                ],

                rows: [
                    [
                        "101",
                        "42",
                        "15"
                    ],
                    [
                        "102",
                        "57",
                        "15"
                    ],
                    [
                        "103",
                        "81",
                        "15"
                    ]
                ]
            },

            {
                type: "code",

                title: "Как это может выглядеть в API",

                language: "json",

                code: `
{
  "id": 15,
  "name": "Shared Office Printer",
  "users": [
    {
      "id": 42
    },
    {
      "id": 57
    },
    {
      "id": 81
    }
  ]
}
                `.trim()
            },

            {
                type: "highlight",

                icon: "🧩",

                title: "Теперь собираем всё в одну API-модель",

                text: `
                    До этого мы рассматривали каждую связь отдельно.

                    Теперь объединим данные из нескольких таблиц
                    в одну модель пользователя.

                    Клиенту API не нужно знать, из каких именно таблиц
                    были получены эти данные.

                    Он получает готовый объект **User**
                    с вложенными массивами телефонов, адресов и устройств.
                `
            },

            {
                type: "table",

                title: "Как данные из БД превращаются в поля User",

                columns: [
                    "Источник в БД",
                    "API-поле",
                    "Что содержит"
                ],

                rows: [
                    [
                        "usersPersonalData.id",
                        "`User.id`",
                        "Идентификатор пользователя"
                    ],
                    [
                        "usersPersonalData.firstName",
                        "`User.firstName`",
                        "Имя пользователя"
                    ],
                    [
                        "usersPersonalData.lastName",
                        "`User.lastName`",
                        "Фамилия пользователя"
                    ],
                    [
                        "userPhones.phone",
                        "`User.phones[].phone`",
                        "Номер телефона"
                    ],
                    [
                        "userPhones.phoneType",
                        "`User.phones[].type`",
                        "Тип телефона"
                    ],
                    [
                        "userAddress.city",
                        "`User.address[].city`",
                        "Город адреса"
                    ],
                    [
                        "userAddress.street",
                        "`User.address[].street`",
                        "Улица адреса"
                    ],
                    [
                        "mapUserDevice.deviceId",
                        "`User.devices[].id`",
                        "Идентификатор устройства"
                    ],
                    [
                        "Device.name",
                        "`User.devices[].name`",
                        "Название устройства"
                    ]
                ]
            },

            {
                type: "code",

                title: "Полная API-модель пользователя",

                language: "json",

                code: `
{
  "id": 42,
  "firstName": "Иван",
  "lastName": "Петров",
  "phones": [
    {
      "phone": "+7 999 111-11-11",
      "type": "mobile"
    },
    {
      "phone": "+7 999 222-22-22",
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
      "id": 15,
      "name": "iPhone 16 Pro Max"
    },
    {
      "id": 27,
      "name": "MacBook Air"
    },
    {
      "id": 31,
      "name": "iPad Pro"
    }
  ]
}
                `.trim()
            },

            {
                type: "highlight",

                icon: "🎯",

                title: "Что видит клиент API",

                text: `
                    Клиент получает **один объект User**.

                    Внутри него находятся обычные поля пользователя
                    и вложенные массивы связанных данных:

                    \`phones\` — телефоны,

                    \`address\` — адреса,

                    \`devices\` — устройства.

                    Клиенту не нужно знать, что эти данные
                    физически находятся в пяти разных таблицах.
                `
            },

            {
                type: "warning",

                title: "Не копируй структуру БД в API",

                text: `
                    Клиенту не обязательно знать про внутренние идентификаторы,
                    таблицы связей и технические поля.

                    API должен возвращать только те данные,
                    которые нужны клиенту.
                `
            },

            {
                type: "table",

                title: "База данных и API могут содержать разные поля",

                columns: [
                    "Поле",
                    "Есть в БД",
                    "Есть в API"
                ],

                rows: [
                    [
                        "id",
                        "Да",
                        "Да"
                    ],
                    [
                        "firstName",
                        "Да",
                        "Да"
                    ],
                    [
                        "lastName",
                        "Да",
                        "Да"
                    ],
                    [
                        "gender",
                        "Да",
                        "Нет"
                    ],
                    [
                        "birthDate",
                        "Да",
                        "Нет"
                    ],
                    [
                        "email",
                        "Да",
                        "Нет"
                    ]
                ]
            },

            {
                type: "highlight",

                icon: "🎯",

                title: "Почему поля могут исчезнуть",

                text: `
                    Наличие поля в базе **не означает**, что оно должно
                    автоматически появиться в API.

                    Например, если клиенту нужны только:

                    \`id\`, \`firstName\`, \`lastName\` и \`phones\`

                    остальные поля можно не включать в API-ответ.
                `
            },

            {
                type: "definition",

                term: "JOIN",

                text: `
                    Если нужные данные находятся в нескольких таблицах,
                    сервер может объединить их с помощью SQL \`JOIN\`.

                    Например, чтобы получить имя пользователя
                    и его телефоны одновременно.
                `
            },

            {
                type: "code",

                title: "Пример SQL-запроса",

                language: "sql",

                code: `
SELECT
  u.firstName,
  u.lastName,
  p.phone,
  p.phoneType
FROM usersPersonalData AS u
LEFT JOIN userPhones AS p
  ON p.userId = u.id
WHERE u.id = 42;
                `.trim()
            },

            {
                type: "highlight",

                icon: "🧩",

                title: "Что делает запрос",

                text: `
                    \`usersPersonalData\` даёт нам имя и фамилию.

                    \`userPhones\` даёт телефоны.

                    \`LEFT JOIN\` связывает эти данные через
                    \`p.userId = u.id\`.

                    \`WHERE u.id = 42\` ограничивает результат
                    одним пользователем.
                `
            },

            {
                type: "definition",

                term: "DTO",

                text: `
                    **DTO (Data Transfer Object)** — объект,
                    специально подготовленный для передачи данных
                    между системами или слоями приложения.

                    DTO позволяет отделить внутреннюю структуру базы
                    от структуры API.
                `
            },

            {
                type: "table",

                title: "Database Model → API Model",

                columns: [
                    "Источник",
                    "API-поле"
                ],

                rows: [
                    [
                        "usersPersonalData.id",
                        "`User.id`"
                    ],
                    [
                        "usersPersonalData.firstName",
                        "`User.firstName`"
                    ],
                    [
                        "usersPersonalData.lastName",
                        "`User.lastName`"
                    ],
                    [
                        "userPhones.phone",
                        "`User.phones[].phone`"
                    ],
                    [
                        "userPhones.phoneType",
                        "`User.phones[].type`"
                    ],
                    [
                        "userAddress.city",
                        "`User.address[].city`"
                    ],
                    [
                        "Device.name",
                        "`User.devices[].name`"
                    ]
                ]
            },

            {
                type: "highlight",

                icon: "🔄",

                title: "Полный путь данных",

                text: `
                    Мы можем представить весь процесс так:

                    **База данных → JOIN → DTO → OpenAPI Schema → JSON → клиент**
                `
            },

            {
                type: "steps",

                title: "Как собирается ответ пользователя",

                items: [
                    {
                        title: "Находим пользователя",

                        text: `
                            Получаем запись из \`usersPersonalData\`
                            по \`id\`.
                        `,

                        code: "id = 42"
                    },

                    {
                        title: "Получаем связанные данные",

                        text: `
                            Находим телефоны, адрес и устройства,
                            связанные с этим пользователем.
                        `
                    },

                    {
                        title: "Формируем DTO",

                        text: `
                            Выбираем только те поля,
                            которые должны попасть в API.
                        `
                    },

                    {
                        title: "Описываем API-модель",

                        text: `
                            Создаём OpenAPI Schema для структуры ответа.
                        `,

                        code: "components.schemas.User"
                    },

                    {
                        title: "Возвращаем JSON",

                        text: `
                            Клиент получает уже готовую,
                            удобную для него структуру.
                        `
                    }
                ]
            },

            {
                type: "definition",

                term: "id и inventoryNumber — разные значения",

                text: `
                    **\`Device.id\`** — технический идентификатор записи
                    устройства в базе данных.

                    **\`inventoryNumber\`** — бизнес-значение,
                    которое может использоваться сотрудниками организации
                    как инвентарный номер.
                `
            },

            {
                type: "table",

                title: "Сравнение идентификаторов устройства",

                columns: [
                    "Поле",
                    "Пример",
                    "Назначение"
                ],

                rows: [
                    [
                        "`Device.id`",
                        "5832",
                        "Связь записей внутри базы"
                    ],
                    [
                        "`inventoryNumber`",
                        "IT-LT-004271",
                        "Инвентарный номер устройства"
                    ]
                ]
            },

            {
                type: "warning",

                title: "Не путай технический ID и бизнес-значение",

                text: `
                    Если в таблице есть \`Device.id\` и \`inventoryNumber\`,
                    это не два разных способа записать одно и то же.

                    У этих полей **разное назначение**.
                `
            },

            {
                type: "highlight",

                icon: "🧠",

                title: "Что важно вынести из урока",

                text: `
                    Мы не переносим базу данных в OpenAPI один к одному.

                    Мы сначала понимаем структуру БД,
                    затем получаем нужные данные,
                    после этого формируем отдельную **API-модель**
                    и только её описываем в OpenAPI.

                    Клиент получает готовую структуру,
                    не зная внутреннего устройства базы данных.
                `
            }
        ]
    },

    nextLesson: {
        text: `
            В следующем практическом задании мы построим
            \`GET /users/{id}\` и создадим API-ответ,
            который объединяет данные из нескольких таблиц.

            Нам понадобятся:

            - **GET /users/{id}**
            - **path parameter \`id\`**
            - **User response schema**
            - **object**
            - **array**
            - **$ref**
            - **вложенные объекты**
            - **несколько связанных таблиц**
            - **HTTP status codes**
            - **required**
            - **правильные типы данных**

            При этом мы не будем просто копировать структуру таблиц.
            Мы создадим отдельную API-модель,
            содержащую только необходимые клиенту данные.
        `
    }
};
