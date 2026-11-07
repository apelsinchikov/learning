
export const createUser = {
    id: "practice-4",

    type: "practice",

    icon: "🛠️",

    title: "Create User",

    subtitle:
        "Опишем создание пользователя через POST /users.",

    sidebarDescription:
        "Создаём пользователя",

    theoryLinks: [
        "theory-3",
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
            /orders:
              post:
                summary: Create order

                requestBody:
                  required: true
                  content:
                    application/json:
                      schema:
                        $ref: '#/components/schemas/OrderCreateRequest'

                responses:
                  '201':
                    description: Order created
                    content:
                      application/json:
                        schema:
                          $ref: '#/components/schemas/Order'

            components:
              schemas:

                OrderCreateRequest:
                  type: object
                  required:
                    - customerName
                    - total
                  properties:
                    customerName:
                      type: string
                    total:
                      type: number

                Order:
                  type: object
                  properties:
                    id:
                      type: integer
                    customerName:
                      type: string
                    total:
                      type: number
        `,

        explanation: `
            Это пример для заказов (/orders). Тебе нужно сделать то же самое
            для пользователей: свои схемы, свой summary и свои описания.

            Верхняя часть (paths) показывает, КАК схемы подключаются:
            requestBody и ответ 201 ссылаются на них через $ref.

            Нижняя часть (components → schemas) показывает, КАК выглядят
            сами схемы. У OrderCreateRequest поля customerName и total
            обязательные, а у Order есть ещё id, который назначает сервер.
            Схему User в components ты уже написал в практике «Схема User».

            Если что-то забыл, открой блок «Напоминание из теории» ниже:
            там нужные куски из урока 7 «Схемы и свойства»
            и урока 9 «Запрос, ответ и JSON».
        `,

        recall: [
            {
                lessonId: "theory-3",

                sections: [
                    {
                        type: "text",

                        text: `
                            Схема лежит в components → schemas.
                            Поля описываем в properties, а какие из них обязательные —
                            в required. required стоит рядом с properties,
                            внутри самой схемы.
                        `
                    },

                    {
                        type: "code",

                        title: "Схема с обязательными полями и format",

                        language: "yaml",

                        code: `
Product:
  type: object
  required:
    - id
    - name
  properties:
    id:
      type: integer
    name:
      type: string
    contactEmail:
      type: string
      format: email
                        `.trim()
                    },

                    {
                        type: "highlight",

                        icon: "👀",

                        title: "Не путай properties и required",

                        text: `
                            properties — какие поля бывают.
                            required — какие из них обязательны.
                            Элементы required — это список: каждое имя с «- ».
                        `
                    }
                ]
            },

            {
                lessonId: "theory-5",

                sections: [
                    {
                        type: "text",

                        text: `
                            Тело запроса описывается в requestBody, тело ответа —
                            в content. Формат данных — application/json,
                            а схему подключаем ссылкой $ref.
                        `
                    },

                    {
                        type: "code",

                        title: "Ссылка на схему",

                        language: "yaml",

                        code: `
schema:
  $ref: '#/components/schemas/User'
                        `.trim()
                    },

                    {
                        type: "highlight",

                        icon: "🧩",

                        title: "Две схемы",

                        text: `
                            Для запроса — одна схема (без id), для ответа — другая
                            (с id, его назначает сервер).
                        `
                    }
                ]
            }
        ],

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
        '200':
          description: Not implemented yet

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

        requestBody: {
            required: true,
            mediaType: "application/json",
            schemaRef:
                "#/components/schemas/UserCreateRequest"
        },

        responses: {
            "201": {
                description: "User created",
                mediaType: "application/json",
                schemaRef:
                    "#/components/schemas/User"
            }
        },

        schemas: {
            UserCreateRequest: {
                type: "object",

                required: [
                    "name",
                    "email"
                ],

                properties: {
                    name: {
                        type: "string"
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
        Отлично! Теперь POST /users принимает
        JSON с данными нового пользователя
        и возвращает созданного User.

        Ты связал endpoint, requestBody,
        JSON, schemas и $ref.
    `
};
