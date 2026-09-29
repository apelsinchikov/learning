export const createUser = {
    id: "practice-4",

    type: "practice",

    icon: "🛠️",

    title: "Create User",

    subtitle: "Опишем создание пользователя через POST /users.",

    sidebarDescription: "Создаём пользователя",

    theoryLinks: [
        "theory-3",
        "theory-4",
        "theory-5"
    ],

    theory: {
        title: "POST /users",

        text: `
            Теперь применим сразу несколько изученных
            возможностей OpenAPI.

            Мы создадим POST /users,
            который принимает данные нового пользователя
            в формате JSON и возвращает созданного User.
        `,

        idea: `
            У POST /users будет две разные структуры данных.

            Request:

            UserCreateRequest
            ↓
            name
            email

            Response:

            User
            ↓
            id
            name
            email
        `,

        structure: `
            /users:
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
        `,

        task: `
            Добавь полноценное создание пользователя.

            1. Создай схему UserCreateRequest.

            Она должна содержать:

            • name — string
            • email — string, format: email

            Оба поля должны быть обязательными.

            2. Добавь requestBody в POST /users.

            requestBody должен:

            • иметь required: true
            • использовать application/json
            • использовать UserCreateRequest через $ref

            3. Измени ответ 201.

            Он должен:

            • иметь description: User created
            • использовать application/json
            • возвращать User через $ref
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
        method: "post",
        summary: "Create user",
        response: "201",
        responseDescription: "User created"
    },

    successMessage: `
        Отлично! Теперь POST /users принимает
        JSON с данными нового пользователя
        и возвращает созданного User.

        Ты впервые связал endpoint,
        requestBody, JSON, schemas и $ref.
    `
};