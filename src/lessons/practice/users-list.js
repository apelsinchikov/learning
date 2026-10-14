export const usersList = {
    id: "practice-users-list",

    type: "practice",

    icon: "🛠️",

    title: "Список пользователей",

    subtitle: "Описываем ответ GET /users как список.",

    sidebarDescription: "Ответ со списком",

    theoryLinks: [
        "theory-4",
        "theory-5"
    ],

    theory: {
        title: "GET /users возвращает список",

        text: `
            Сейчас у GET /users в ответе только пояснение.
            Давай расскажем, какие данные он возвращает:
            список пользователей по схеме User.
        `,

        idea: `
            Ответ — это список (array).
            Каждый элемент списка — пользователь (схема User).
        `,

        structure: `
            /books:
              get:
                summary: Get books
                responses:
                  '200':
                    description: Books found
                    content:
                      application/json:
                        schema:
                          type: array
                          items:
                            $ref: '#/components/schemas/Book'
        `,

        explanation: `
            Это пример для книг. Тебе нужно сделать то же самое
            для пользователей.

            Внутри '200' появились content → application/json → schema.
            Схема — список (type: array), а items говорит,
            что в списке лежат Book. Для пользователей будет User.
        `,

        task: `
            В ответ '200' метода GET /users добавь:

            • description: Users found
            • content → application/json
            • schema: type array, а в items — ссылка на User
              ($ref: '#/components/schemas/User')

            Схема User уже есть внизу, трогать её не нужно.
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
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserCreateRequest'
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

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
        - email

    UserCreateRequest:
      type: object
      properties:
        name:
          type: string
        email:
          type: string
          format: email
      required:
        - name
        - email`,

    validation: {
        requiredPath: "/users",

        method: "get",

        summary: "Get users",

        responses: {
            "200": {
                description: "Users found",
                mediaType: "application/json",
                arrayItemsRef: "#/components/schemas/User"
            }
        }
    },

    successMessage: `
        Отлично! Теперь GET /users возвращает список пользователей.

        В Swagger UI ты увидишь, что в ответе — массив
        объектов User.
    `
};
