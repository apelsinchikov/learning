export const skeleton = {
    id: "practice-skeleton",

    type: "practice",

    icon: "🛠️",

    title: "Заготовка описания",

    subtitle: "Пишем первые строки: версию OpenAPI и название API.",

    sidebarDescription: "Название и версия",

    theoryLinks: [
        "theory-yaml"
    ],

    theory: {
        title: "Начинаем с главного",

        text: `
            Каждое описание OpenAPI начинается с двух вещей:
            какую версию правил OpenAPI мы используем
            и как называется наш API.

            Пока никаких адресов — только заготовка.
        `,

        idea: `
            openapi — версия правил OpenAPI.

            info — раздел с информацией о нашем API:
            название (title) и версия (version).
        `,

        structure: `
            openapi: 3.0.3

            info:
              title: Shop API
              version: 1.0.0
        `,

        explanation: `
            Это пример для магазина (Shop API). Тебе нужно написать
            то же самое, но для Users API.

            openapi: 3.0.3 — версия правил OpenAPI.
            version: 1.0.0 — версия нашего API. Это не одно и то же.

            Смотри на отступы: title и version стоят
            на 2 пробела правее, чем info.
        `,

        task: `
            Заполни описание:

            • openapi: 3.0.3
            • info → title: Users API
            • info → version: 1.0.0

            Подсказка: после строки info: нажми Enter —
            редактор сам поставит отступ.
        `
    },

    initialYaml: `# Напиши здесь версию OpenAPI и раздел info
`,

    validation: {
        skipSpecValidation: true,

        openapi: "3.0.3",

        info: {
            title: "Users API",
            version: "1.0.0"
        }
    },

    successMessage: `
        Отлично! Заготовка готова.

        Теперь у нашего API есть название и версия.
        В следующей практике добавим первый адрес.
    `
};
