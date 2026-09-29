export const userDto = {
    id: "practice-3",

    type: "practice",

    icon: "🛠️",

    title: "User DTO",

    subtitle: "Опишем структуру пользователя с помощью OpenAPI Schema.",

    sidebarDescription: "Создаём User DTO",

    theoryLinks: [
        "theory-3",
        "theory-4"
    ],

    theory: {
        title: "Описываем структуру User",

        text: `
            До этого момента наш Users API описывал
            сами операции, но мы ещё не говорили,
            как выглядит пользователь.

            Теперь создадим переиспользуемую схему User
            внутри components.schemas.
        `,

        idea: `
            User будет обычным объектом:

            User
            ↓
            object
            ↓
            id
            name
            email

            А required определит,
            какие поля обязательны.
        `,

        structure: `
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
                      type: string
                      format: email

                  required:
                    - id
                    - name
                    - email
        `,

        task: `
            Добавь в спецификацию схему User.

            Она должна находиться здесь:

            components:
              schemas:
                User:

            User должен быть объектом и содержать
            следующие свойства:

            • id — integer
            • name — string
            • email — string с format: email

            Все три свойства должны быть обязательными.

            Дополнительно:

            • id должен иметь minimum: 1
            • name должен иметь minLength: 2
            • name должен иметь maxLength: 100
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
  /users:
    post:
      summary: Create user
      responses:
        '201':
          description: User created`,

    validation: {
        requiredPath: "/users",
        method: "post",
        summary: "Create user",
        response: "201",
        responseDescription: "User created"
    },

    successMessage: `
        Отлично! Теперь у нашего Users API есть
        полноценная модель User.

        Мы описали структуру объекта,
        обязательные поля и ограничения их значений.

        В следующем уроке мы начнём использовать
        эту модель внутри запросов и ответов API.
    `
};