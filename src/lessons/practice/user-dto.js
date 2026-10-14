export const userDto = {
    id: "practice-3",

    type: "practice",

    icon: "🛠️",

    title: "User DTO",

    subtitle:
        "Опишем структуру пользователя с помощью OpenAPI Schema.",

    sidebarDescription: "Создаём User DTO",

    theoryLinks: [
        "theory-3",
        "theory-4"
    ],

    theory: {
        title: "Описываем пользователя",

        text: `
            Пока мы описывали только операции.
            Теперь опишем, как выглядит сам пользователь.

            Для этого создадим схему User. Она лежит
            в разделе components → schemas.
        `,

        idea: `
            User — это объект с тремя полями:

            User
            ↓
            object
            ↓
            id
            name
            email

            Список required говорит, какие поля обязательны.
        `,

        structure: `
            components:
              schemas:
                Book:
                  type: object

                  properties:
                    id:
                      type: integer
                      minimum: 1

                    title:
                      type: string
                      minLength: 2
                      maxLength: 200

                    publishedAt:
                      type: string
                      format: date

                  required:
                    - id
                    - title
        `,

        explanation: `
            Это пример схемы Book (книга). Тебе нужна схема User.

            Что есть в примере:

            • type: object — это объект;
            • properties — список полей, у каждого свой type;
            • minimum, minLength, maxLength — ограничения;
            • required — поля, которые обязательно должны быть.
        `,

        task: `
            Добавь в components → schemas схему User.

            User — это объект (type: object) с тремя полями:

            • id — integer, минимум 1
            • name — string, длина от 2 до 100 символов (minLength и maxLength)
            • email — string с format: email

            Все три поля обязательны: перечисли их в required.
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
  schemas:`,

    validation: {
        requiredPath: "/users",
        method: "post",
        summary: "Create user",

        response: "201",
        responseDescription: "User created",

        schemas: {
            User: {
                type: "object",

                required: [
                    "id",
                    "name",
                    "email"
                ],

                properties: {
                    id: {
                        type: "integer",
                        minimum: 1
                    },

                    name: {
                        type: "string",
                        minLength: 2,
                        maxLength: 100
                    },

                    email: {
                        type: "string",
                        format: "email"
                    }
                }
            }
        }
    },

    successMessage: `
        Отлично! У нашего Users API появилась модель User.

        Ты описал объект, его поля, ограничения и обязательные поля.

        В следующих уроках будем использовать эту схему
        в запросах и ответах.
    `
};
