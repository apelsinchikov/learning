export const lesson4 = {
    id: 4,

    title: "GET — Получение",

    subtitle: "Опишем получение списка пользователей и одного пользователя по ID.",

    sidebarDescription: "Получение данных",

    theory: {
        title: "Как описать GET-запрос?",

        text: `
            GET используется для получения данных с сервера.
            В OpenAPI мы можем описать как получение списка
            ресурсов, так и получение конкретного ресурса
            по идентификатору.
        `,

        idea: `
            Для разных вариантов запроса можно использовать
            разные endpoints. Например, GET /users возвращает
            список пользователей, а GET /users/{id} — одного
            конкретного пользователя.
        `,

        structure: `
            paths:
              /users:
                get:
                  responses:
                    '200':
                      description: Users list

              /users/{id}:
                get:
                  parameters:
                    - name: id
                      in: path
                      required: true
                      schema:
                        type: integer
        `,

        task: `
            Создай два GET endpoint:
            GET /users для получения списка пользователей
            и GET /users/{id} для получения одного пользователя.
            Для параметра id используй тип integer.
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
          description: Users list

  /users/{id}:
    get:
      summary: Get user by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: User
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
        email:
          type: string`
};