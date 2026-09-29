export const finalUsersApi = {
    id: "practice-8",

    type: "practice",

    icon: "🛠️",

    title: "Final Users API",

    subtitle: "Соберём полноценную OpenAPI-спецификацию Users API.",

    sidebarDescription: "Финальное задание",

    theoryLinks: [
        "theory-1",
        "theory-2",
        "theory-3",
        "theory-4",
        "theory-5",
        "theory-6",
        "theory-7",
        "theory-8"
    ],

    theory: {
        title: "Финальная спецификация",

        text: `
            В этом задании нужно самостоятельно собрать
            полноценную спецификацию Users API.

            Мы объединим практически все элементы,
            которые изучили в курсе.

            Здесь уже не будет готовой структуры,
            которую нужно просто дополнить.
            
            Тебе нужно самостоятельно построить
            спецификацию на основе требований.
        `,

        idea: `
            Итоговый Users API должен уметь:

            • получать список пользователей;
            • создавать пользователя;
            • получать конкретного пользователя;
            • изменять пользователя;
            • удалять пользователя;
            • искать и фильтровать пользователей.
        `,

        task: `
            Создай полноценную OpenAPI 3.0.3 спецификацию
            Users API.

            ОБЩАЯ ЧАСТЬ

            Используй:

            openapi: 3.0.3

            info:
              title: Users API
              version: 1.0.0


            USER SCHEMA

            Создай:

            components:
              schemas:
                User:

            User должен быть object и содержать:

            id:
              integer
              minimum: 1

            name:
              string
              minLength: 2
              maxLength: 100

            email:
              string
              format: email

            Все три свойства обязательные.


            USER CREATE REQUEST

            Создай:

            UserCreateRequest

            Это object со свойствами:

            name:
              string
              minLength: 2
              maxLength: 100

            email:
              string
              format: email

            Оба свойства обязательные.


            GET /users

            Добавь:

            summary: Get users

            Query-параметры:

            limit:
              integer
              minimum: 1
              maximum: 100

            offset:
              integer
              minimum: 0

            search:
              string
              minLength: 1

            Все три параметра должны быть необязательными.

            Добавь ответ:

            200
              description: Users found

            Ответ должен содержать JSON-массив User
            через $ref.


            POST /users

            Добавь:

            summary: Create user

            requestBody:

            required: true

            content:
              application/json

            Используй UserCreateRequest через $ref.

            Ответ:

            201
              description: User created

            Ответ должен содержать JSON User
            через $ref.


            GET /users/{id}

            Добавь:

            summary: Get user

            Path parameter:

            id
              in: path
              required: true
              type: integer

            Ответы:

            200
              description: User found

            404
              description: User not found

            Успешный ответ должен возвращать JSON User.


            PUT /users/{id}

            Добавь:

            summary: Update user

            Обязательный path parameter id
            типа integer.

            requestBody должен принимать
            application/json с UserCreateRequest.

            Ответы:

            200
              description: User updated

            404
              description: User not found

            Успешный ответ должен возвращать JSON User.


            DELETE /users/{id}

            Добавь:

            summary: Delete user

            Обязательный path parameter id
            типа integer.

            Ответы:

            204
              description: User deleted

            404
              description: User not found


            ДОПОЛНИТЕЛЬНО

            Используй operationId
            для каждой операции.

            operationId должны быть уникальными
            и понятными.

            Например:

            getUsers
            createUser
            getUser
            updateUser
            deleteUser
        `,

        structure: `
            Users API
            │
            ├── GET /users
            │   ├── query parameters
            │   └── 200
            │
            ├── POST /users
            │   ├── requestBody
            │   └── 201
            │
            └── /users/{id}
                │
                ├── GET
                │   ├── 200
                │   └── 404
                │
                ├── PUT
                │   ├── requestBody
                │   ├── 200
                │   └── 404
                │
                └── DELETE
                    ├── 204
                    └── 404
        `
    },

    initialYaml: `openapi: 3.0.3
info:
  title: Users API
  version: 1.0.0

paths: {}

components:
  schemas: {}`,

    validation: {
        requiredPath: "/users",
        method: "get"
    },

    successMessage: `
        Поздравляю!

        Ты собрал полноценную OpenAPI-спецификацию
        Users API.

        За курс ты научился описывать:

        • paths и HTTP-методы;
        • schemas и properties;
        • required и ограничения;
        • arrays;
        • $ref;
        • requestBody;
        • application/json;
        • parameters;
        • HTTP status codes;
        • request и response структуры.

        Теперь Swagger UI может использовать
        твою спецификацию как документацию API.
    `
};