export const pathsMethodsNaming = {
    id: "theory-2",

    type: "theory",

    icon: "📖",

    title: "Адреса, методы и названия",

    subtitle: "Как описать endpoint и как правильно называть адреса.",

    sidebarDescription: "Paths и HTTP-методы",

    theory: {
        intro: `
            В прошлом уроке мы узнали про адреса и методы.
            Теперь посмотрим, как записать их в OpenAPI.
        `,

        sections: [
            {
                type: "definition",

                term: "Endpoint",

                text: `
                    Endpoint («эндпоинт») — это одно конкретное действие в API.

                    Оно состоит из двух частей: адреса и метода.
                    Например, GET /users — получить список пользователей.
                `
            },

            {
                type: "code",

                title: "Раздел paths",

                language: "yaml",

                code: `
paths:
  /products:
    get:
      summary: Get products
                `.trim()
            },

            {
                type: "code-explanation",

                title: "Как читать этот пример",

                items: [
                    {
                        code: "paths:",
                        text: "Раздел, где перечислены все адреса API."
                    },
                    {
                        code: "  /products:",
                        text: "Адрес. Он всегда начинается с «/» и лежит внутри paths (отступ 2 пробела)."
                    },
                    {
                        code: "    get:",
                        text: "Метод. Лежит внутри адреса (отступ 4 пробела)."
                    },
                    {
                        code: "      summary: Get products",
                        text: "Короткое название операции. Лежит внутри метода (отступ 6 пробелов)."
                    }
                ]
            },

            {
                type: "highlight",

                icon: "📐",

                title: "Каждый уровень — на 2 пробела глубже",

                text: `
                    paths → адрес → метод → описание метода.

                    Чем глубже вложенность, тем больше отступ.
                    Нажимай Tab, чтобы сдвинуть строку вправо.
                `
            },

            {
                type: "highlight",

                icon: "🔀",

                title: "Один адрес — несколько методов",

                text: `
                    У одного адреса может быть сразу несколько методов.

                    Например, для адреса /users:

                    - GET /users — получить список пользователей;
                    - POST /users — создать нового пользователя.

                    Поэтому endpoint — это всегда адрес и метод вместе.
                `
            },

            {
                type: "code",

                title: "Два метода у одного адреса",

                language: "yaml",

                code: `
paths:
  /products:
    get:
      summary: Get products

    post:
      summary: Create product
                `.trim()
            },

            {
                type: "highlight",

                icon: "👀",

                title: "Смотри на отступы",

                text: `
                    get и post стоят с одинаковым отступом.
                    Значит, они соседи, и оба относятся к адресу /products.
                `
            },

            {
                type: "highlight",

                icon: "✏️",

                title: "Как называть адреса",

                text: `
                    В адресе пишем, С ЧЕМ работаем (существительное).
                    Метод говорит, ЧТО делаем (глагол).

                    Поэтому глагол в адресе не нужен.
                `
            },

            {
                type: "table",

                title: "Хорошо и плохо",

                columns: [
                    "Хорошо",
                    "Плохо"
                ],

                rows: [
                    ["GET /users", "GET /getUsers"],
                    ["POST /users", "POST /createUser"],
                    ["DELETE /users/42", "DELETE /deleteUser/42"]
                ]
            },

            {
                type: "table",

                title: "Список и один элемент",

                columns: [
                    "Адрес",
                    "Что это",
                    "Пример"
                ],

                rows: [
                    ["/users", "Список всех пользователей", "GET /users"],
                    ["/users/42", "Один пользователь с номером 42", "GET /users/42"]
                ]
            },

            {
                type: "definition",

                term: "summary и description",

                text: `
                    summary — короткое название операции. Его видно в Swagger UI в одной строке.

                    description — подробное пояснение, если одной строки мало.
                `
            },

            {
                type: "code",

                title: "summary и description вместе",

                language: "yaml",

                code: `
get:
  summary: Get products
  description: Returns all products from the catalog
                `.trim()
            },

            {
                type: "definition",

                term: "operationId",

                text: `
                    operationId — уникальное имя операции, как логин у человека.
                    У двух разных операций не может быть одинаковых operationId.

                    Оно нужно программам, которые создают код по описанию.
                    Поэтому пишем его понятно: getUsers, getUser, createUser.
                `
            },

            {
                type: "highlight",

                icon: "🎯",

                title: "Главное из урока",

                text: `
                    Адрес — это ресурс («с чем работаем»).
                    Метод — это действие («что делаем»).

                    В YAML адреса лежат внутри paths, а методы — внутри адресов.
                    Глубже — значит больше отступ.
                `
            }
        ]
    },

    nextLesson: {
        text: `
            В следующем уроке вернёмся к практике и расширим
            наш Users API.
        `
    }
};
