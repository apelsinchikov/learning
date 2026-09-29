export const lesson7 = {
    id: 7,

    title: "Query Parameters",

    subtitle: "Научимся передавать параметры запроса для фильтрации и управления данными.",

    sidebarDescription: "Параметры запроса",

    theory: {
        title: "Что такое query-параметры?",

        text: `
            Query-параметры передаются в URL после знака ?.
            Они позволяют передавать дополнительные настройки
            запроса, например параметры поиска, фильтрации,
            сортировки или пагинации.
        `,

        idea: `
            В OpenAPI query-параметр описывается через
            parameters с указанием in: query.
            В отличие от path-параметра, query-параметр
            обычно не является частью пути.
        `,

        structure: `
            paths:
              /users:
                get:
                  parameters:
                    - name: limit
                      in: query
                      required: false
                      schema:
                        type: integer
        `,

        task: `
            Добавь GET /users с query-параметром limit.
            Параметр должен называться limit, находиться
            в query и иметь тип integer.
            Сделай его необязательным.
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
      parameters:
        - name: limit
          in: query
          required: false
          schema:
            type: integer
      responses:
        '200':
          description: Users list
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