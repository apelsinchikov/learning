
export const updateDeleteUser = {
    id: "practice-7",

    type: "practice",

    icon: "🛠️",

    title: "Update and Delete",

    subtitle: "Добавим изменение и удаление пользователя.",

    sidebarDescription: "Update и Delete",

    theoryLinks: [
        "theory-2",
        "theory-5",
        "theory-6",
        "theory-7"
    ],

    theory: {
        title: "Изменяем и удаляем пользователя",

        text: `
            Мы уже умеем получать одного пользователя по номеру.

            Теперь добавим ещё две операции для того же адреса:

            PUT /users/{id}

            — изменить пользователя.

            DELETE /users/{id}

            — удалить пользователя.
        `,

        sections: [
            {
                type: "highlight",

                icon: "✏️",

                title: "Два способа изменить: PUT и PATCH",

                text: `
                    Представь анкету сотрудника в отделе кадров.

                    PUT — выкинуть старую анкету и положить новую, полностью заполненную.
                    PATCH — взять старую анкету и поправить в ней одну строчку.
                `
            },

            {
                type: "table",

                title: "Чем отличаются",

                columns: [
                    "",
                    "PUT",
                    "PATCH"
                ],

                rows: [
                    ["Что отправляем", "Все поля пользователя", "Только те поля, которые меняем"],
                    ["Что с полями, которых нет в запросе", "Пропадут (очистятся)", "Останутся как были"],
                    ["Когда использовать", "Нужно заменить запись целиком", "Нужно поменять одно-два поля"]
                ]
            },

            {
                type: "code",

                title: "Пример: у пользователя меняем только телефон",

                language: "text",

                code: `
Сейчас в базе:
  name: Ivan, email: ivan@mail.ru, phone: 111

PUT /users/42  с телом { "phone": "222" }
  → name и email пропадут.
  В базе: phone: 222

PATCH /users/42  с телом { "phone": "222" }
  → поменяется только phone.
  В базе: name: Ivan, email: ivan@mail.ru, phone: 222
                `.trim()
            },

            {
                type: "highlight",

                icon: "🧭",

                title: "Какой метод выбрать",

                text: `
                    Меняем одно-два поля (например, телефон или статус) — берём PATCH.

                    Редактируем всю карточку целиком, как в форме «сохранить всё» — берём PUT.

                    Если сомневаешься, чаще всего подходит PATCH:
                    он безопаснее, потому что ничего лишнего не стирает.
                `
            }
        ],

        idea: `
            Для одного и того же ресурса:

            GET
            — получить.

            PUT
            — изменить.

            DELETE
            — удалить.

            Идентификатор пользователя остаётся
            частью пути.
        `,

        structure: `
            /products/{productId}:

              patch:
                summary: Update product

                parameters:
                  - name: productId
                    in: path
                    required: true
                    schema:
                      type: integer

                responses:
                  '200':
                    description: Product updated

                  '404':
                    description: Product not found
        `,

        explanation: `
            Это пример для товара: метод patch (изменить часть записи).
            В этой практике тебе нужны методы put (изменить целиком) и delete
            для адреса /users/{id}. Описываются они так же, как patch.

            Параметр id нужно описать в каждой операции отдельно.
        `,

        task: `
            Добавь две операции для /users/{id}.

            1. PUT /users/{id}

            Укажи:

            • summary: Update user
            • обязательный path parameter id
            • id должен иметь type: integer

            Добавь ответы:

            200:
              description: User updated

            404:
              description: User not found


            2. DELETE /users/{id}

            Укажи:

            • summary: Delete user
            • обязательный path parameter id
            • id должен иметь type: integer

            Добавь ответы:

            204:
              description: User deleted

            404:
              description: User not found

            Тело запроса (requestBody) для PUT пока не нужно —
            добавим его в итоговом задании.

            Напоминаем про коды: 200 — успешно изменено,
            204 — удалено и ответа нет, 404 — пользователя нет.
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
        requiredPath: "/users/{id}",

        operations: {
            put: {
                summary: "Update user",

                requiredParameter: {
                    name: "id",
                    in: "path",
                    required: true,
                    type: "integer"
                },

                responses: {
                    "200": {
                        description: "User updated"
                    },

                    "404": {
                        description: "User not found"
                    }
                }
            },

            delete: {
                summary: "Delete user",

                requiredParameter: {
                    name: "id",
                    in: "path",
                    required: true,
                    type: "integer"
                },

                responses: {
                    "204": {
                        description: "User deleted"
                    },

                    "404": {
                        description: "User not found"
                    }
                }
            }
        }
    },

    successMessage: `
        Отлично! Теперь Users API поддерживает
        полный базовый набор операций
        для конкретного пользователя:

        GET — получить.

        PUT — изменить.

        DELETE — удалить.

        Также для операций описаны
        успешные и ошибочные ответы.
    `
};
