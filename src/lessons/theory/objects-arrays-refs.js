export const objectsArraysRefs = {
    id: "theory-4",

    type: "theory",

    icon: "📖",

    title: "Списки (array)",

    subtitle: "Как описать не одного пользователя, а много.",

    sidebarDescription: "Списки в OpenAPI",

    theory: {
        intro: `
            GET /users должен вернуть не одного пользователя,
            а целый список. Для списков в OpenAPI есть тип array.
        `,

        sections: [
            {
                type: "definition",

                term: "array (список)",

                text: `
                    array — это список однотипных элементов.

                    Например, список покупок: молоко, хлеб, яблоки.
                    Каждый элемент — строка, и их несколько.
                `
            },

            {
                type: "code",

                title: "Список строк в JSON",

                language: "json",

                code: `
["молоко", "хлеб", "яблоки"]
                `.trim()
            },

            {
                type: "highlight",

                icon: "📐",

                title: "Квадратные скобки — это список",

                text: `
                    В JSON список записывают в квадратных скобках,
                    элементы — через запятую.

                    В нашем YAML скобки писать не нужно:
                    там список описывается отступами.
                `
            },

            {
                type: "definition",

                term: "items — что лежит в списке",

                text: `
                    Одного type: array мало.
                    Нужно сказать, какие элементы лежат внутри списка.
                    Для этого есть items.
                `
            },

            {
                type: "code",

                title: "Схема списка строк",

                language: "yaml",

                code: `
type: array
items:
  type: string
                `.trim()
            },

            {
                type: "code-explanation",

                title: "Как читать этот пример",

                items: [
                    {
                        code: "type: array",
                        text: "Это список."
                    },
                    {
                        code: "items:",
                        text: "Описание одного элемента списка."
                    },
                    {
                        code: "  type: string",
                        text: "Каждый элемент — строка."
                    }
                ]
            },

            {
                type: "highlight",

                icon: "💡",

                title: "Список пользователей",

                text: `
                    Элементом списка может быть не только строка,
                    но и целый объект — например, пользователь.

                    Чтобы не описывать пользователя заново,
                    в items ставим ссылку $ref на схему User.
                `
            },

            {
                type: "code",

                title: "Схема списка пользователей",

                language: "yaml",

                code: `
type: array
items:
  $ref: '#/components/schemas/User'
                `.trim()
            },

            {
                type: "code-explanation",

                title: "Как читать этот пример",

                items: [
                    {
                        code: "type: array",
                        text: "Ответ — это список."
                    },
                    {
                        code: "items:",
                        text: "Что лежит в списке."
                    },
                    {
                        code: "  $ref: '#/components/schemas/User'",
                        text: "Каждый элемент — пользователь по схеме User."
                    }
                ]
            },

            {
                type: "code",

                title: "Как это выглядит в ответе GET /users",

                language: "yaml",

                code: `
responses:
  '200':
    description: Users found
    content:
      application/json:
        schema:
          type: array
          items:
            $ref: '#/components/schemas/User'
                `.trim()
            },

            {
                type: "warning",

                title: "Не путай один объект и список",

                text: `
                    GET /users/42 возвращает одного пользователя:
                    schema → $ref на User.

                    GET /users возвращает список:
                    schema → type: array → items → $ref на User.
                `
            },

            {
                type: "highlight",

                icon: "🎯",

                title: "Главное из урока",

                text: `
                    array — список однотипных элементов.

                    items — описание одного элемента.

                    Список пользователей: type: array и items с $ref на User.
                `
            }
        ]
    },

    nextLesson: {
        text: `
            В следующей практике опишем ответ GET /users — список пользователей.
        `
    }
};
