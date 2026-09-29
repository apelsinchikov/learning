export const helloUsers = {
    id: "practice-1",

    type: "practice",

    icon: "🛠️",

    title: "Hello Users",

    subtitle: "Создадим первый endpoint нашего Users API.",

    sidebarDescription: "Первый endpoint",

    theoryLinks: [
        "theory-1"
    ],

    theory: {
        title: "Первый шаг",

        text: `
            В предыдущем уроке мы разобрались, что OpenAPI
            описывает API.

            Теперь создадим первую операцию нашего Users API.

            Пока не будем создавать DTO, схемы и сложные структуры.
            Наша задача — просто описать существование endpoint
            GET /users и его успешный ответ.
        `,

        idea: `
            GET /users означает:

            «у нашего API существует операция GET,
            доступная по адресу /users».
        `,

        structure: `
            paths:
              /users:
                get:
                  summary: Get users
                  responses:
                    '200':
                      description: Users endpoint works
        `,

        task: `
            Добавь в спецификацию endpoint GET /users.

            Для операции укажи:

            • summary: Get users
            • успешный ответ с кодом 200
            • description ответа: Users endpoint works
        `
    },

    initialYaml: `openapi: 3.0.3
info:
  title: Users API
  version: 1.0.0
paths: {}`,

    validation: {
        requiredPath: "/users",
        method: "get",
        summary: "Get users",
        response: "200",
        responseDescription: "Users endpoint works"
    },

    successMessage: `
        Отлично! Ты создал первый endpoint своего Users API.

        Swagger UI построил документацию на основе
        написанной тобой OpenAPI-спецификации.
    `
};