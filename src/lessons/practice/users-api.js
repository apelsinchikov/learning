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
        title: "От первого endpoint к полноценному API",

        text: `
            В первом практическом уроке мы создали
            простой endpoint GET /users.

            Теперь начнём развивать наш Users API.

            Пока мы не будем подробно описывать структуру
            самого пользователя. Наша задача — научиться
            организовывать несколько операций вокруг одного ресурса.
        `,

        idea: `
            Ресурс users может иметь несколько операций.

            Например:

            GET /users
            — получить список пользователей.

            POST /users
            — создать пользователя.

            GET /users/{id}
            — получить конкретного пользователя.

            DELETE /users/{id}
            — удалить пользователя.

            Сейчас мы начнём с описания самого ресурса
            и его основных операций.
        `,

        structure: `
            paths:
              /users:
                get:
                  summary: Get users
                  responses:
                    '200':
                      description: Users endpoint works

                post:
                  summary: Create user
                  responses:
                    '201':
                      description: User created

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

        task: `
            Расширь свой Users API.

            Добавь операцию POST /users.

            Для неё укажи:

            • summary: Create user
            • успешный ответ с кодом 201
            • description ответа: User created

            Пока не добавляй requestBody и схемы пользователя.
            С ними мы познакомимся в следующих уроках.
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
        Отлично! Теперь Users API умеет описывать
        не только получение пользователей,
        но и создание нового пользователя.

        Мы использовали один и тот же ресурс /users
        с двумя разными HTTP-методами.
    `
};