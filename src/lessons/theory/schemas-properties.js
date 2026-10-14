export const schemasProperties = {
    id: "theory-3",

    type: "theory",

    icon: "📖",

    title: "Схемы и свойства",

    subtitle: "Как описать, из чего состоят данные.",

    sidebarDescription: "Схемы и свойства",

    theory: {
        intro: `
            Адрес и метод говорят, что можно сделать.
            Но ещё нужно описать данные: что отправляем и что получаем.
            Для этого в OpenAPI есть схемы (schemas).
        `,

        sections: [
            {
                type: "definition",

                term: "Схема (schema)",

                text: `
                    Схема — это описание того, как устроены данные:
                    какие в них поля и какого они типа.

                    Это как анкета: в ней написано, какие поля заполнить
                    и что в каждом писать — текст или число.
                `
            },

            {
                type: "code",

                title: "Данные, которые нужно описать (JSON)",

                language: "json",

                code: `
{
  "id": 7,
  "name": "Notebook",
  "price": 4.5,
  "inStock": true
}
                `.trim()
            },

            {
                type: "highlight",

                icon: "📦",

                title: "Где лежат схемы",

                text: `
                    Схемы кладём в раздел components → schemas.
                    Каждой схеме даём имя, например Product.

                    Потом на неё можно сослаться из любого места в спецификации.
                `
            },

            {
                type: "code",

                title: "Схема Product (пока пустая)",

                language: "yaml",

                code: `
components:
  schemas:
    Product:
      type: object
                `.trim()
            },

            {
                type: "code-explanation",

                title: "Что здесь написано",

                items: [
                    {
                        code: "components:",
                        text: "Раздел для всего, что мы хотим использовать повторно."
                    },
                    {
                        code: "  schemas:",
                        text: "Внутри components: список наших схем."
                    },
                    {
                        code: "    Product:",
                        text: "Имя схемы. Мы выбрали его сами."
                    },
                    {
                        code: "      type: object",
                        text: "Это объект — набор полей (как в JSON выше)."
                    }
                ]
            },

            {
                type: "definition",

                term: "properties",

                text: `
                    properties — это список полей объекта.
                    Для каждого поля указываем его имя и type.
                `
            },

            {
                type: "code",

                title: "Схема с полями",

                language: "yaml",

                code: `
Product:
  type: object
  properties:
    id:
      type: integer
    name:
      type: string
    price:
      type: number
    inStock:
      type: boolean
                `.trim()
            },

            {
                type: "highlight",

                icon: "📐",

                title: "Как читать отступы",

                text: `
                    id, name, price и inStock стоят с одним отступом — значит, все они лежат внутри properties.

                    type у каждого поля сдвинут ещё на 2 пробела — значит, он относится к этому полю.
                `
            },

            {
                type: "table",

                title: "Основные типы данных",

                columns: [
                    "type",
                    "Что это",
                    "Пример значения"
                ],

                rows: [
                    ["string", "Текст", "Notebook"],
                    ["integer", "Целое число", "42"],
                    ["number", "Любое число, в том числе с точкой", "4.5"],
                    ["boolean", "Да или нет", "true / false"],
                    ["object", "Объект с полями", "{ ... }"],
                    ["array", "Список значений", "[ ... ]"]
                ]
            },

            {
                type: "definition",

                term: "required",

                text: `
                    Поле в properties ещё не значит, что оно обязательное.

                    Чтобы сделать поле обязательным, запиши его имя
                    в список required.
                `
            },

            {
                type: "code",

                title: "Обязательные поля",

                language: "yaml",

                code: `
Product:
  type: object
  properties:
    id:
      type: integer
    name:
      type: string
    price:
      type: number
  required:
    - id
    - name
                `.trim()
            },

            {
                type: "highlight",

                icon: "⚠️",

                title: "Не путай properties и required",

                text: `
                    В примере выше описаны три поля: id, name и price.

                    Но обязательные только id и name.
                    Поле price можно не присылать.

                    properties — какие поля бывают.
                    required — какие из них обязательны.
                `
            },

            {
                type: "highlight",

                icon: "👀",

                title: "Отступы у required",

                text: `
                    required стоит на одном уровне с properties и type,
                    то есть внутри Product, а не внутри properties.

                    Элементы списка начинаются с «- » и сдвинуты на 2 пробела.
                `
            },

            {
                type: "definition",

                term: "format",

                text: `
                    Иногда одного type мало. Для строки можно уточнить,
                    что в ней лежит, с помощью format.

                    Чаще всего встречаются: email, date, date-time, uuid, uri.
                `
            },

            {
                type: "code",

                title: "Пример format",

                language: "yaml",

                code: `
contactEmail:
  type: string
  format: email
                `.trim()
            },

            {
                type: "definition",

                term: "Ограничения",

                text: `
                    Можно задать, какие значения допустимы.

                    Для строк: minLength (минимум символов) и maxLength (максимум).

                    Для чисел: minimum (не меньше) и maximum (не больше).
                `
            },

            {
                type: "code",

                title: "Пример ограничений",

                language: "yaml",

                code: `
quantity:
  type: integer
  minimum: 0
  maximum: 100
                `.trim()
            },

            {
                type: "definition",

                term: "description и example",

                text: `
                    description — пояснение для человека: что это за поле.

                    example — пример значения.

                    Они не влияют на проверку, но делают документацию понятнее.
                `
            },

            {
                type: "code",

                title: "Пример description и example",

                language: "yaml",

                code: `
name:
  type: string
  description: Product name
  example: Notebook
                `.trim()
            },

            {
                type: "highlight",

                icon: "🎯",

                title: "Главное из урока",

                text: `
                    Схема описывает данные: type: object — это объект,
                    properties — его поля, required — обязательные поля.

                    Схемы лежат в components → schemas.
                `
            }
        ]
    },

    nextLesson: {
        text: `
            В следующем уроке разберём вложенные объекты, списки
            и ссылки $ref. После этого опишем схему пользователя на практике.
        `
    }
};
