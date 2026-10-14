export const helloUsers = {
    id: "practice-1",

    type: "practice",

    icon: "🛠️",

    title: "Hello Users",

    subtitle: "Создадим первый endpoint нашего Users API.",

    sidebarDescription: "Первый endpoint",

    theoryLinks: [
        "theory-api-basics",
        "theory-yaml"
    ],

    theory: {
        title: "Первый адрес",

        text: `
            Теперь добавим в описание первый адрес — GET /users.

            Для каждого адреса нужно сказать, что API ответит.
            Ответ описывается в разделе responses.
        `,

        idea: `
            responses — список возможных ответов API.

            У каждого ответа есть код — число, которое говорит,
            как всё прошло. Код 200 значит «всё хорошо».

            description — короткое пояснение к ответу человеческим языком.
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
            Это пример для другого адреса — /ping. Тебе нужно сделать
            то же самое, но для /users.

            paths — раздел со всеми адресами.
            /ping — адрес (всегда начинается с «/»).
            get — метод, «получить данные».
            summary — короткое название операции.
            responses → '200' → description — ответ и его пояснение.

            Код 200 пишем в кавычках: '200'.
            Каждый уровень вложенности сдвинут на 2 пробела.
        `,

        task: `
            Добавь в раздел paths адрес GET /users.

            Для него укажи:

            • summary: Get users
            • ответ с кодом '200' (в кавычках, как в примере)
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
