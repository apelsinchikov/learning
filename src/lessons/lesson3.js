export const lesson3 = {
    id: 3,

    title: "POST — Создание",

    subtitle: "Научимся описывать создание нового пользователя через POST-запрос.",

    sidebarDescription: "Отправка данных",

    theory: {
        title: "Как описать POST-запрос?",

        text: `
            GET обычно используется для получения данных,
            а POST — для отправки данных на сервер и создания
            нового ресурса.
        `,

        idea: `
            В OpenAPI тело запроса описывается через
            requestBody. Мы можем указать формат данных
            и связать его со схемой User.
        `,

        structure: `
            paths:
              /users:
                post:
                  requestBody:
                    required: true
                    content:
                      application/json:
                        schema:
                          $ref: '#/components/schemas/User'
        `,

        task: `
            Создай POST /users, который принимает пользователя
            в формате JSON и возвращает ответ с кодом 201.
        `
    },

    initialYaml: `openapi: 3.0.3
info:
  title: Users API
  version: 1.0.0
paths:
  /users:
    post:
      summary: Create user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/User'
      responses:
        '201':
          description: User created
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