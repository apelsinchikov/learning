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
            Теперь создадим первый адрес нашего Users API.

            Пока без схем и сложных вещей. Мы только скажем,
            что адрес GET /users существует и отвечает успешно.
        `,

        idea: `
            GET /users означает:

            «У нашего API есть адрес /users,
            и к нему можно отправить запрос GET».
        `,

        structure: `
            paths:
              /ping:
                get:
                  summary: Ping
                  responses:
                    '200':
                      description: Server is alive
        `,

        explanation: `
            Это пример для другого адреса — /ping.
            Тебе нужно сделать то же самое, но для /users.

            Смотри на отступы: каждый уровень вложенности
            сдвинут на 2 пробела.
        `,

        task: `
            Добавь в спецификацию адрес GET /users.

            Для него укажи:

            • summary: Get users
            • ответ с кодом '200' (код пиши в кавычках, как в примере)
            • description ответа: Users endpoint works

            Подсказка: поставь курсор в конец строки paths: и нажми Enter.
            Редактор сам сделает отступ. Если нужно сдвинуть строку,
            используй Tab (вправо) и Shift + Tab (влево).
        `
    },

    initialYaml: `openapi: 3.0.3
info:
  title: Users API
  version: 1.0.0
paths:`,

    validation: {
        requiredPath: "/users",
        method: "get",
        summary: "Get users",
        response: "200",
        responseDescription: "Users endpoint works"
    },

    successMessage: `
        Отлично! Ты описал первый адрес своего Users API.

        Swagger UI построил документацию по тому, что ты написал.
    `
};
