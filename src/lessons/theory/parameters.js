export const parameters = {
    id: "theory-6",

    type: "theory",

    icon: "📖",

    title: "Параметры",

    subtitle: "Как уточнить запрос: какого пользователя найти и сколько показать.",

    sidebarDescription: "Параметры запроса",

    theory: {
        intro: `
            Иногда мало сказать «получить пользователя».
            Нужно уточнить: какого именно? Для таких уточнений
            в запросе есть параметры.
        `,

        sections: [
            {
                type: "definition",

                term: "Параметр",

                text: `
                    Параметр — это дополнительное значение,
                    которое программа отправляет вместе с запросом.

                    Например: номер пользователя или сколько записей показать.
                `
            },

            {
                type: "table",

                title: "Два главных вида параметров",

                columns: [
                    "Вид",
                    "Где находится",
                    "Пример"
                ],

                rows: [
                    ["path (путь)", "Прямо в адресе", "/users/42"],
                    ["query (запрос)", "В конце адреса, после знака ?", "/users?limit=10"]
                ]
            },

            {
                type: "highlight",

                icon: "🔢",

                title: "Path-параметр: «какой именно»",

                text: `
                    В адресе /users/{id} в фигурных скобках стоит «пустое место».
                    Вместо {id} программа подставит реальный номер.

                    GET /users/42 — получить пользователя с номером 42.
                `
            },

            {
                type: "code",

                title: "Описание path-параметра",

                language: "yaml",

                code: `
/users/{id}:
  get:
    summary: Get user
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: integer
                `.trim()
            },

            {
                type: "code-explanation",

                title: "Как читать этот пример",

                items: [
                    {
                        code: "parameters:",
                        text: "Список параметров этой операции."
                    },
                    {
                        code: "  - name: id",
                        text: "Дефис начинает новый параметр. Имя — id, как в адресе {id}."
                    },
                    {
                        code: "    in: path",
                        text: "Где находится: в пути (адресе)."
                    },
                    {
                        code: "    required: true",
                        text: "Обязательный. Без номера адрес неполный."
                    },
                    {
                        code: "    schema:",
                        text: "Какого типа значение."
                    },
                    {
                        code: "      type: integer",
                        text: "Целое число."
                    }
                ]
            },

            {
                type: "warning",

                title: "Дефис и отступы",

                text: `
                    Дефис «-» в YAML — начало элемента списка.
                    Остальные строки параметра (in, required, schema)
                    стоят под name с тем же отступом.
                `
            },

            {
                type: "highlight",

                icon: "🔍",

                title: "Query-параметр: «как показать»",

                text: `
                    Query-параметры стоят после знака ? и нужны для уточнений:
                    сколько записей показать, что искать.

                    GET /users?limit=10 — показать только 10 пользователей.

                    Несколько параметров соединяются знаком &:
                    /users?limit=10&search=alex
                `
            },

            {
                type: "code",

                title: "Описание query-параметра",

                language: "yaml",

                code: `
parameters:
  - name: limit
    in: query
    required: false
    schema:
      type: integer
                `.trim()
            },

            {
                type: "highlight",

                icon: "✅",

                title: "Обязательный или нет",

                text: `
                    Path-параметр всегда обязательный (required: true).

                    Query-параметр обычно необязательный (required: false):
                    без него запрос тоже работает.
                `
            },

            {
                type: "table",

                title: "Поля параметра",

                columns: [
                    "Поле",
                    "Что значит"
                ],

                rows: [
                    ["name", "Имя параметра"],
                    ["in", "Где он: path или query"],
                    ["required", "Обязательный или нет"],
                    ["schema", "Какого типа значение"],
                    ["description", "Пояснение для людей"]
                ]
            },

            {
                type: "highlight",

                icon: "🎯",

                title: "Главное из урока",

                text: `
                    Параметры уточняют запрос.

                    Path — часть адреса: /users/42.
                    Query — после знака ?: /users?limit=10.

                    Каждый параметр описываем через name, in, required и schema.
                `
            }
        ]
    },

    nextLesson: {
        text: `
            В следующей практике добавим GET /users/{id} —
            получить одного пользователя по номеру.
        `
    }
};
