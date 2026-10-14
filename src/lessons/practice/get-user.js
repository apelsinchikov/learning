export const getUser = {
    id: "practice-5",

    type: "practice",

    icon: "🛠️",

    title: "Get User",

    subtitle:
        "Получим конкретного пользователя по его идентификатору.",

    sidebarDescription: "GET /users/{id}",

    theoryLinks: [
        "theory-6"
    ],

    theory: {
        title: "Получение конкретного пользователя",

        text: `
            Мы уже описали список пользователей — GET /users.

            Теперь научимся получать одного пользователя по номеру.
            Для этого нужен адрес /users/{id}: вместо {id}
            подставляется номер, например /users/42.

            Этот номер называется path-параметром — частью адреса.
        `,

        idea: `
            /users

            — коллекция пользователей.

            /users/{id}

            — конкретный пользователь.

            Например:

            GET /users/42

            означает запрос пользователя
            с идентификатором 42.
        `,

        structure: `
            /products/{productId}:
              get:
                summary: Get product

                parameters:
                  - name: productId
                    in: path
                    required: true
                    schema:
                      type: integer

                responses:
                  '200':
                    description: Product found

                  '404':
                    description: Product not found
        `,

        explanation: `
            Это пример для товара (/products/{productId}). Тебе нужен адрес
            /users/{id}, а параметр называется id.

            Обрати внимание: имя параметра в фигурных скобках адреса
            должно совпадать с name в parameters.
        `,

        task: `
            Добавь GET /users/{id}.

            Для операции укажи:

            • summary: Get user

            • path parameter id

            • in: path

            • required: true

            • schema type: integer

            Добавь два ответа:

            200:
              description: User found

            404:
              description: User not found

            Содержимое ответов (content и schema) пока не нужно:
            описываем только коды и пояснения.
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
        requiredPath: "/users/{id}",

        method: "get",

        summary: "Get user",

        requiredParameter: {
            name: "id",
            in: "path",
            required: true,
            type: "integer"
        },

        responses: {
            "200": {
                description: "User found"
            },

            "404": {
                description: "User not found"
            }
        }
    },

    successMessage: `
        Отлично! Теперь API умеет получать
        как список пользователей,
        так и конкретного пользователя
        по его идентификатору.

        Ты также использовал обязательный
        path parameter.
    `
};