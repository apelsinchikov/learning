export const lesson6 = {
    id: 6,

    title: "DELETE — Удаление",

    subtitle: "Опишем удаление существующего пользователя через DELETE.",

    sidebarDescription: "Удаление данных",

    theory: {
        title: "Как описать DELETE-запрос?",

        text: `
            DELETE используется для удаления существующего ресурса.
            Обычно идентификатор удаляемого ресурса передаётся
            в URL в качестве path-параметра.
        `,

        idea: `
            В нашем API DELETE /users/{id} означает:
            удалить пользователя с указанным идентификатором.
            Если операция выполнена успешно, сервер может
            вернуть код 204 без тела ответа.
        `,

        structure: `
            paths:
              /users/{id}:
                delete:
                  parameters:
                    - name: id
                      in: path
                      required: true
                      schema:
                        type: integer

                  responses:
                    '204':
                      description: User deleted
        `,

        task: `
            Создай DELETE /users/{id}.
            Добавь обязательный path-параметр id типа integer.
            В качестве успешного ответа используй код 204.
        `
    },

    initialYaml: `openapi: 3.0.3
info:
  title: Users API
  version: 1.0.0
paths:
  /users/{id}:
    delete:
      summary: Delete user
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '204':
          description: User deleted
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