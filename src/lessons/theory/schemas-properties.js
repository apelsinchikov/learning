export const schemasProperties = {
    id: "theory-3",

    type: "theory",

    icon: "📖",

    title: "Schemas и Properties",

    subtitle: "Разберём, как описывать структуру данных в OpenAPI.",

    sidebarDescription: "Схемы и свойства",

    theory: {
        sections: [
            {
                title: "Зачем нужны schemas?",

                text: `
                    Endpoint описывает операцию API,
                    но нам также нужно описывать данные,
                    с которыми эта операция работает.

                    Например, Users API может возвращать
                    объект пользователя:

                    {
                      "id": 42,
                      "name": "Alex",
                      "email": "alex@example.com"
                    }

                    Чтобы описать такую структуру,
                    в OpenAPI используются schemas.
                `
            },

            {
                title: "components.schemas",

                text: `
                    Переиспользуемые схемы обычно размещаются
                    внутри components.schemas.

                    Например:

                    components:
                      schemas:
                        User:
                          type: object

                    Здесь мы создаём схему с именем User.

                    В дальнейшем разные endpoints смогут
                    использовать эту схему.
                `
            },

            {
                title: "type: object",

                text: `
                    Если схема описывает объект,
                    используется:

                    type: object

                    Например:

                    User:
                      type: object

                    Но пока это только пустой объект.
                    Чтобы описать его поля, используются properties.
                `
            },

            {
                title: "properties",

                text: `
                    properties описывает поля объекта.

                    Например:

                    User:
                      type: object
                      properties:
                        id:
                          type: integer
                        name:
                          type: string
                        email:
                          type: string

                    Теперь OpenAPI знает,
                    какие свойства может содержать User.
                `
            },

            {
                title: "Основные типы данных",

                text: `
                    Для свойств используются типы данных.

                    string — строка.

                    integer — целое число.

                    number — число с плавающей точкой.

                    boolean — true или false.

                    object — объект.

                    array — массив.

                    Например:

                    age:
                      type: integer

                    name:
                      type: string

                    active:
                      type: boolean
                `
            },

            {
                title: "required",

                text: `
                    Само наличие свойства в properties
                    не означает, что оно обязательно.

                    Для обязательных свойств используется
                    массив required.

                    Например:

                    required:
                      - id
                      - name

                    Это означает, что id и name должны
                    присутствовать в объекте.

                    Свойство email при этом может существовать
                    в properties, но не быть обязательным.
                `
            },

            {
                title: "Важно: properties ≠ required",

                text: `
                    Это одна из важных особенностей OpenAPI.

                    Например:

                    properties:
                      name:
                        type: string
                      email:
                        type: string

                    required:
                      - name

                    Здесь описаны два свойства:

                    name
                    email

                    Но обязательным является только name.

                    email является допустимым свойством,
                    но его наличие не требуется.
                `
            },

            {
                title: "format",

                text: `
                    Для некоторых строк можно дополнительно
                    указать формат.

                    Например:

                    email:
                      type: string
                      format: email

                    Возможные форматы помогают инструментам
                    лучше понимать назначение значения.

                    Часто используются:

                    email
                    date
                    date-time
                    uuid
                    uri
                `
            },

            {
                title: "Ограничения",

                text: `
                    Для значений можно задавать ограничения.

                    Для строк:

                    minLength
                    maxLength

                    Для чисел:

                    minimum
                    maximum

                    Например:

                    age:
                      type: integer
                      minimum: 0
                      maximum: 120

                    Такие ограничения помогают точнее описывать
                    допустимые данные.
                `
            },

            {
                title: "description, example и default",

                text: `
                    Свойства и схемы можно дополнительно
                    документировать.

                    description — описание значения.

                    example — пример значения.

                    default — значение по умолчанию.

                    Например:

                    name:
                      type: string
                      description: User display name
                      example: Alex

                    Эти поля помогают разработчикам
                    понимать назначение данных.
                `
            }
        ],

        idea: `
            Schema описывает структуру данных.

            components.schemas.User
            ↓
            type: object
            ↓
            properties
            ↓
            id, name, email

            required отдельно определяет,
            какие свойства обязательны.
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
        `,

        explanation: `
            components.schemas используется для создания
            переиспользуемых моделей данных.

            Внутри схемы type определяет общий тип данных,
            properties описывает свойства объекта,
            а required определяет обязательные свойства.

            В следующем уроке мы разберём,
            как использовать объекты, массивы
            и ссылки $ref между схемами.
        `
    },

    nextLesson: {
        text: `
            В следующем уроке разберём объекты, массивы
            и $ref, а затем применим эти знания
            на практике при создании User DTO.
        `
    }
};