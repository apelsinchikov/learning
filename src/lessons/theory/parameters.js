export const parameters = {
    id: "theory-6",

    type: "theory",

    icon: "📖",

    title: "Parameters",

    subtitle: "Разберём path, query и header параметры в OpenAPI.",

    sidebarDescription: "Path, Query и Header",

    theory: {
        sections: [
            {
                title: "Что такое parameter?",

                text: `
                    Parameter — это дополнительное значение,
                    которое клиент передаёт API вместе с запросом.

                    Параметры позволяют уточнить,
                    какой именно ресурс нужен
                    или как должна выполняться операция.

                    В OpenAPI параметры имеют разные места
                    передачи.
                `
            },

            {
                title: "Path parameter",

                text: `
                    Path parameter находится непосредственно
                    в URL.

                    Например:

                    /users/{id}

                    Здесь {id} — параметр пути.

                    Запрос:

                    GET /users/42

                    означает, что id имеет значение 42.
                `
            },

            {
                title: "Описание path parameter",

                text: `
                    В OpenAPI path parameter описывается
                    через parameters.

                    Например:

                    parameters:
                      - name: id
                        in: path
                        required: true
                        schema:
                          type: integer

                    Для path-параметра required
                    должен быть true,
                    потому что без него путь
                    /users/{id} не является полным.
                `
            },

            {
                title: "Query parameter",

                text: `
                    Query parameter находится после знака ?

                    Например:

                    /users?limit=10

                    Здесь:

                    limit

                    — query-параметр.

                    Query-параметры часто используются
                    для фильтрации, поиска, сортировки
                    и ограничения количества результатов.
                `
            },

            {
                title: "Описание query parameter",

                text: `
                    В OpenAPI query parameter выглядит так:

                    parameters:
                      - name: limit
                        in: query
                        required: false
                        schema:
                          type: integer

                    В отличие от path parameter,
                    query parameter может быть необязательным.
                `
            },

            {
                title: "Path и Query — разница",

                text: `
                    Сравним:

                    /users/{id}

                    и:

                    /users?id=42

                    В первом случае id является
                    частью пути ресурса.

                    Во втором случае id передаётся
                    как query-параметр.

                    Для получения конкретного пользователя
                    обычно используется:

                    /users/{id}

                    А query-параметры хорошо подходят
                    для дополнительных условий поиска.
                `
            },

            {
                title: "Query-параметры для списка",

                text: `
                    Для GET /users можно использовать:

                    /users?limit=20&offset=40

                    Например:

                    limit
                    — сколько пользователей вернуть.

                    offset
                    — с какого элемента начать.

                    Также можно добавить:

                    search
                    — строку поиска.
                `
            },

            {
                title: "Header parameter",

                text: `
                    Parameter может находиться
                    и в HTTP-заголовке.

                    Для этого используется:

                    in: header

                    Например:

                    parameters:
                      - name: X-Request-ID
                        in: header
                        required: false
                        schema:
                          type: string

                    Такой параметр не отображается
                    в URL запроса.
                `
            },

            {
                title: "Основные поля parameter",

                text: `
                    При описании параметра обычно используются:

                    name
                    — имя параметра.

                    in
                    — где находится параметр:
                    path, query, header или cookie.

                    required
                    — обязательный параметр или нет.

                    schema
                    — тип значения.

                    description
                    — описание параметра.

                    example
                    — пример значения.
                `
            },

            {
                title: "Параметры и schema",

                text: `
                    Parameter и schema выполняют
                    разные задачи.

                    Parameter описывает,
                    где и как передаётся значение.

                    Schema описывает,
                    какого типа это значение
                    и какие ограничения у него есть.

                    Например:

                    name: limit
                    in: query

                    говорит, что limit —
                    query-параметр.

                    А:

                    schema:
                      type: integer

                    говорит, что значение limit —
                    целое число.
                `
            }
        ],

        idea: `
            Path parameter:

            /users/{id}

            Query parameter:

            /users?limit=10

            Header parameter:

            X-Request-ID: abc-123

            Parameter описывает способ передачи
            дополнительного значения в API.
        `,

        structure: `
            /users/{id}:

              get:

                parameters:
                  - name: id
                    in: path
                    required: true
                    schema:
                      type: integer

                  - name: limit
                    in: query
                    required: false
                    schema:
                      type: integer
        `,

        explanation: `
            Path parameter является частью URL.

            Query parameter передаётся после ?.

            Header parameter передаётся
            в HTTP-заголовке.

            Поле in определяет расположение параметра,
            а schema описывает его тип.

            В следующем практическом уроке
            мы используем path parameter
            для получения конкретного пользователя.
        `
    },

    nextLesson: {
        text: `
            В следующем уроке создадим GET /users/{id}
            и добавим обязательный path parameter id.
        `
    }
};