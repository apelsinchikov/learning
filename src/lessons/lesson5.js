export const lesson5 = {
    id: 5,

    title: "PUT — Обновление",

    subtitle: "Научимся описывать обновление существующего пользователя через PUT.",

    sidebarDescription: "Обновление данных",

    theory: {
        title: "Как описать PUT-запрос?",

        text: `
            PUT используется для обновления существующего ресурса.
            Обычно идентификатор ресурса передаётся прямо в URL,
            а новые данные передаются в теле запроса.
        `,

        idea: `
            В нашем API PUT /users/{id} означает:
            найти пользователя с указанным id и обновить
            его данные с помощью объекта User.
        `,

        structure: `
            paths:
              /users/{id}:
                put:
                  parameters:
                    - name: id
                      in: path
                      required: true
                      schema:
                        type: integer

                  requestBody:
                    required: true
                    content:
                      application/json:
                        schema:
                          $ref: '#/components/schemas/User'
        `,

        task: `
            Создай PUT /users/{id}.
            Добавь обязательный path-параметр id типа integer.
            В requestBody принимай пользователя User
            в формате application/json.
            В качестве успешного ответа используй код 200.
        `
    },

    initialYaml: `openapi: 3.0.3
info:
  title: Users API
  version: 1.0.0
paths:
  /users/{id}:
    put:
      summary: Update user
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/User'
      responses:
        '200':
          description: User updated
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