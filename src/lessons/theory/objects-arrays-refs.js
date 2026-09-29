export const objectsArraysRefs = {
    id: "theory-4",

    type: "theory",

    icon: "📖",

    title: "Object, Array и $ref",

    subtitle: "Научимся описывать вложенные объекты, массивы и переиспользовать схемы.",

    sidebarDescription: "Object, Array и $ref",

    theory: {
        sections: [
            {
                title: "Объект внутри объекта",

                text: `
                    В OpenAPI один объект может содержать
                    другие объекты.

                    Например, у пользователя может быть
                    объект address:

                    properties:
                      name:
                        type: string

                      address:
                        type: object

                    Чтобы описать свойства вложенного объекта,
                    внутри него также используется properties.
                `
            },

            {
                title: "Массив",

                text: `
                    Массив описывается с помощью:

                    type: array

                    Но одного type недостаточно.

                    OpenAPI также нужно сообщить,
                    какие элементы находятся внутри массива.

                    Для этого используется items.
                `
            },

            {
                title: "Массив строк",

                text: `
                    Например, массив строк:

                    tags:
                      type: array
                      items:
                        type: string

                    Это означает:

                    tags — массив,
                    каждый элемент которого является строкой.
                `
            },

            {
                title: "Массив объектов",

                text: `
                    Массив может содержать объекты.

                    Например:

                    users:
                      type: array
                      items:
                        type: object
                        properties:
                          id:
                            type: integer
                          name:
                            type: string

                    В этом случае users — массив объектов,
                    каждый объект содержит id и name.
                `
            },

            {
                title: "Зачем нужен $ref?",

                text: `
                    Представим, что схема User используется
                    в нескольких местах API.

                    Можно каждый раз описывать её полностью,
                    но это приведёт к дублированию.

                    OpenAPI позволяет сослаться
                    на уже существующую схему с помощью $ref.
                `
            },

            {
                title: "Ссылка на User",

                text: `
                    Если у нас есть:

                    components:
                      schemas:
                        User:
                          type: object
                          properties:
                            id:
                              type: integer
                            name:
                              type: string

                    На эту схему можно сослаться:

                    $ref: '#/components/schemas/User'

                    Теперь вместо повторного описания
                    структуры мы используем ссылку.
                `
            },

            {
                title: "$ref внутри массива",

                text: `
                    $ref особенно полезен для массивов объектов.

                    Например:

                    items:
                      $ref: '#/components/schemas/User'

                    Полная структура:

                    users:
                      type: array
                      items:
                        $ref: '#/components/schemas/User'

                    Это означает, что users —
                    массив объектов User.
                `
            },

            {
                title: "$ref не создаёт новую схему",

                text: `
                    Важно понимать разницу.

                    components.schemas.User
                    создаёт саму схему.

                    $ref:
                      '#/components/schemas/User'

                    не создаёт новую схему,
                    а ссылается на уже существующую.

                    Поэтому сначала должна существовать
                    схема, на которую указывает ссылка.
                `
            },

            {
                title: "Когда использовать $ref",

                text: `
                    $ref особенно полезен,
                    когда одна и та же структура используется
                    в нескольких операциях.

                    Например, User может использоваться:

                    • в ответе GET /users
                    • в ответе GET /users/{id}
                    • внутри других объектов
                    • внутри массива пользователей

                    Вместо копирования структуры
                    мы используем одну переиспользуемую схему.
                `
            },

            {
                title: "User и массив пользователей",

                text: `
                    В нашем Users API можно описать:

                    User
                    — один пользователь.

                    А затем:

                    users:
                      type: array
                      items:
                        $ref: '#/components/schemas/User'

                    Таким образом мы можем использовать
                    одну модель User для описания
                    списка пользователей.
                `
            }
        ],

        idea: `
            Object описывает структуру объекта.

            Array описывает коллекцию значений.

            items описывает элементы массива.

            $ref позволяет повторно использовать
            уже существующую схему вместо её копирования.
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

                UserList:
                  type: array

                  items:
                    $ref: '#/components/schemas/User'
        `,

        explanation: `
            User описывает одного пользователя.

            UserList описывает массив пользователей.

            В UserList используется $ref,
            поэтому структура User не дублируется.

            Такой подход делает OpenAPI-спецификацию
            компактнее и удобнее для поддержки.
        `
    },

    nextLesson: {
        text: `
            Теперь применим эти знания на практике
            и создадим полноценный User DTO.
        `
    }
};