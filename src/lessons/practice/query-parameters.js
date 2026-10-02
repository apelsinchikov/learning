export const queryParameters = {
    id: "practice-6",

    type: "practice",

    icon: "🛠️",

    title: "Search and filtering",

    subtitle:
        "Добавим query-параметры для поиска и настройки списка пользователей.",

    sidebarDescription: "Поиск и фильтрация",

    theoryLinks: [
        "theory-6"
    ],

    theory: {
        title: "Query-параметры",

        text: `
            Сейчас GET /users возвращает список пользователей,
            но клиент не может управлять этим списком.

            Например, ему может понадобиться:

            • получить только первые 20 пользователей;
            • начать получение с определённой позиции;
            • найти пользователей по имени или email.

            Для таких дополнительных условий
            удобно использовать query-параметры.
        `,

        idea: `
            Query-параметры передаются после ?.

            Например:

            GET /users?limit=20

            Или несколько параметров:

            GET /users?limit=20&offset=40

            Для поиска:

            GET /users?search=alex
        `,

        structure: `
            /users:
              get:

                parameters:

                  - name: limit
                    in: query
                    required: false
                    schema:
                      type: integer
                      minimum: 1
                      maximum: 100

                  - name: offset
                    in: query
                    required: false
                    schema:
                      type: integer
                      minimum: 0

                  - name: search
                    in: query
                    required: false
                    schema:
                      type: string
                      minLength: 1
        `,

        task: `
            Добавь в GET /users три query-параметра.

            1. limit

            • in: query
            • required: false
            • type: integer
            • minimum: 1
            • maximum: 100

            2. offset

            • in: query
            • required: false
            • type: integer
            • minimum: 0

            3. search

            • in: query
            • required: false
            • type: string
            • minLength: 1

            Также добавь каждому параметру
            понятное description.
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
          description: Users endpoint works

    post:
      summary: Create user

      responses:
        '201':
          description: User created

  /users/{id}:
    get:
      summary: Get user

      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer

      responses:
        '200':
          description: User found

        '404':
          description: User not found

components:
  schemas:
    User:
      type: object

      properties:
        id:
          type: integer
          minimum: 1

        name:
          type: string
          minLength: 2
          maxLength: 100

        email:
          type: string
          format: email

      required:
        - id
        - name
        - email`,

    validation: {
        requiredPath: "/users",

        method: "get",

        summary: "Get users",

        parameters: {
            limit: {
                in: "query",
                required: false,
                type: "integer",
                minimum: 1,
                maximum: 100
            },

            offset: {
                in: "query",
                required: false,
                type: "integer",
                minimum: 0
            },

            search: {
                in: "query",
                required: false,
                type: "string",
                minLength: 1
            }
        },

        responses: {
            "200": {
                description: "Users endpoint works"
            }
        }
    },

    successMessage: `
        Отлично! Теперь GET /users поддерживает
        дополнительные query-параметры.

        Клиент может ограничивать количество результатов,
        задавать смещение и выполнять поиск.
    `
};