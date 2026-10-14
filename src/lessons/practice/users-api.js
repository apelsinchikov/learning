export const usersApi = {
    id: "practice-2",

    type: "practice",

    icon: "🛠️",

    title: "Describe Users API",

    subtitle: "Создадим полноценное описание ресурса пользователей.",

    sidebarDescription: "Описываем Users API",

    theoryLinks: [
        "theory-1",
        "theory-2"
    ],

    theory: {
        title: "Несколько операций у одного адреса",

        text: `
            В прошлом уроке мы сделали GET /users.
            Теперь добавим к тому же адресу ещё одну операцию.

            Схему самого пользователя пока не описываем —
            о ней поговорим в следующих уроках.
        `,

        idea: `
            У одного ресурса может быть много операций:

            GET /users — получить список пользователей.

            POST /users — создать пользователя.

            GET /users/{id} — получить одного пользователя.

            DELETE /users/{id} — удалить пользователя.
        `,

        structure: `
            paths:
              # {id} — номер пользователя
              /users/{id}:
                get:
                  summary: Get user
                  responses:
                    '200':
                      description: User found

                delete:
                  summary: Delete user
                  responses:
                    '204':
                      description: User deleted
        `,

        explanation: `
            В примере у адреса /users/{id} два метода: get и delete.
            Они стоят с одинаковым отступом, потому что оба относятся к одному адресу.
        `,

        task: `
            Добавь к адресу /users ещё один метод — POST.

            Для него укажи:

            • summary: Create user
            • ответ с кодом '201'
            • description ответа: User created

            Метод post должен стоять с таким же отступом, как get.

            requestBody и схемы пока не нужны — их мы добавим позже.
        `
    },

    initialYaml: `openapi: 3.0.3
info:
  title: Users API
  version: 1.0.0
paths:
  /users:
    get:
      summary: Get users
      responses:
        '200':
          description: Users endpoint works`,

    validation: {
        requiredPath: "/users",
        method: "post",
        summary: "Create user",
        response: "201",
        responseDescription: "User created"
    },

    successMessage: `
        Отлично! Теперь у адреса /users два метода: GET и POST.

        Один и тот же адрес может поддерживать разные методы —
        каждый делает своё дело.
    `
};
