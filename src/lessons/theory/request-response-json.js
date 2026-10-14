export const requestResponseJson = {
    id: "theory-5",

    type: "theory",

    icon: "📖",

    title: "Запрос, ответ и JSON",

    subtitle: "Как описать, какие данные API получает и отдаёт.",

    sidebarDescription: "Запрос, ответ, JSON",

    theory: {
        intro: `
            Мы умеем описывать адреса и поля пользователя.
            Теперь соединим их: покажем, какие данные
            идут в API и какие возвращаются обратно.
        `,

        sections: [
            {
                type: "definition",

                term: "Request и Response",

                text: `
                    Request («запрос») — это то, что программа отправляет в API.

                    Response («ответ») — это то, что API отправляет обратно.

                    Как в кафе: заказ — это запрос, а поднос с едой — ответ.
                `
            },

            {
                type: "definition",

                term: "JSON",

                text: `
                    Данные между программами обычно передают в формате JSON.

                    Это текст, где данные записаны парами «имя: значение»
                    в фигурных скобках.
                `
            },

            {
                type: "code",

                title: "Пример JSON с пользователем",

                language: "json",

                code: `
{
  "id": 42,
  "name": "Alex",
  "email": "alex@example.com"
}
                `.trim()
            },

            {
                type: "highlight",

                icon: "💡",

                title: "JSON и схема — это пара",

                text: `
                    JSON — сами данные.
                    Схема (например, User) — описание: какие поля
                    должны быть в этих данных.
                `
            },

            {
                type: "definition",

                term: "$ref — ссылка на схему",

                text: `
                    Схему User мы описали один раз в components → schemas.
                    Чтобы не писать её заново в каждом месте,
                    на неё можно сослаться через $ref.

                    Это как ссылка в интернете: не копируем страницу,
                    а просто показываем, где она лежит.
                `
            },

            {
                type: "code",

                title: "Как выглядит ссылка",

                language: "yaml",

                code: `
$ref: '#/components/schemas/User'
                `.trim()
            },

            {
                type: "highlight",

                icon: "🧭",

                title: "Как читать эту ссылку",

                text: `
                    '#/components/schemas/User' — это путь внутри
                    самого файла: components → schemas → User.

                    Знак # значит «в этом же файле».
                    Ссылку пишем в кавычках.
                `
            },

            {
                type: "definition",

                term: "Тело ответа",

                text: `
                    Кроме кода и пояснения, ответ может содержать данные.
                    Их называют «телом ответа».

                    В OpenAPI тело описывается в разделе content:
                    сначала формат данных (application/json — это JSON),
                    потом schema — какая схема у данных.
                `
            },

            {
                type: "code",

                title: "Ответ 200 с одним пользователем",

                language: "yaml",

                code: `
responses:
  '200':
    description: User found
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/User'
                `.trim()
            },

            {
                type: "code-explanation",

                title: "Как читать этот пример",

                items: [
                    {
                        code: "'200':",
                        text: "Код ответа. Всё хорошо."
                    },
                    {
                        code: "    content:",
                        text: "Тело ответа — сами данные."
                    },
                    {
                        code: "      application/json:",
                        text: "Формат данных: JSON."
                    },
                    {
                        code: "        schema:",
                        text: "Какие поля в этих данных."
                    },
                    {
                        code: "          $ref: '#/components/schemas/User'",
                        text: "Берём схему User из components."
                    }
                ]
            },

            {
                type: "definition",

                term: "requestBody — тело запроса",

                text: `
                    Когда мы создаём пользователя (POST), нужно отправить
                    его данные: имя и email. Это «тело запроса».

                    Оно описывается так же, как тело ответа: content,
                    формат, schema. Только называется requestBody.
                `
            },

            {
                type: "code",

                title: "Запрос на создание пользователя",

                language: "yaml",

                code: `
post:
  summary: Create user
  requestBody:
    required: true
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/UserCreateRequest'
  responses:
    '201':
      description: User created
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/User'
                `.trim()
            },

            {
                type: "highlight",

                icon: "👀",

                title: "Две разные схемы",

                text: `
                    При создании пользователя мы отправляем только name и email.
                    Номер (id) назначит сервер.

                    Поэтому для запроса нужна одна схема (UserCreateRequest),
                    а для ответа другая (User — вместе с id).

                    required: true означает, что тело запроса обязательно.
                `
            },

            {
                type: "highlight",

                icon: "🎯",

                title: "Главное из урока",

                text: `
                    Request — что отправляем, response — что получаем.

                    Данные обычно в формате JSON.

                    requestBody — тело запроса, content → application/json → schema — тело ответа.

                    $ref — ссылка на готовую схему, чтобы не писать её заново.
                `
            }
        ]
    },

    nextLesson: {
        text: `
            В следующей практике создадим POST /users:
            принимаем нового пользователя и возвращаем созданного.
        `
    }
};
