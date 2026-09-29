export const requestResponseJson = {
    id: "theory-5",

    type: "theory",

    icon: "📖",

    title: "Request, Response и JSON",

    subtitle: "Разберём, как API принимает и возвращает данные.",

    sidebarDescription: "Request, Response и JSON",

    theory: {
        sections: [
            {
                title: "Request и Response",

                text: `
                    При работе с API клиент отправляет request —
                    запрос к серверу.

                    Сервер обрабатывает запрос
                    и возвращает response — ответ.

                    Например:

                    клиент
                      ↓
                    GET /users
                      ↓
                    сервер
                      ↓
                    response
                `
            },

            {
                title: "Request",

                text: `
                    Request содержит информацию,
                    которую клиент отправляет серверу.

                    В зависимости от операции это могут быть:

                    • параметры URL
                    • query-параметры
                    • заголовки
                    • тело запроса

                    Например, при создании пользователя
                    серверу нужно передать данные нового пользователя.
                `
            },

            {
                title: "Response",

                text: `
                    Response содержит результат обработки запроса.

                    В ответе обычно есть:

                    • HTTP status code
                    • заголовки
                    • тело ответа

                    Например, после создания пользователя
                    сервер может вернуть созданного User.
                `
            },

            {
                title: "JSON",

                text: `
                    JSON — один из основных форматов,
                    используемых для передачи данных между API
                    и клиентом.

                    Например:

                    {
                      "id": 42,
                      "name": "Alex",
                      "email": "alex@example.com"
                    }

                    Это JSON-объект с тремя свойствами.
                `
            },

            {
                title: "application/json",

                text: `
                    В OpenAPI формат данных указывается
                    через content.

                    Например:

                    content:
                      application/json:

                    application/json означает,
                    что тело запроса или ответа
                    передаётся в формате JSON.
                `
            },

            {
                title: "requestBody",

                text: `
                    Если данные передаются в теле запроса,
                    в OpenAPI используется requestBody.

                    Например, при создании пользователя:

                    requestBody:
                      content:
                        application/json:
                          schema:
                            ...
                    
                    Здесь мы говорим,
                    что POST-запрос принимает JSON
                    в теле запроса.
                `
            },

            {
                title: "Schema внутри requestBody",

                text: `
                    В requestBody можно указать,
                    какую структуру данных ожидает API.

                    Например:

                    schema:
                      $ref: '#/components/schemas/UserCreateRequest'

                    Теперь API ожидает структуру,
                    описанную схемой UserCreateRequest.
                `
            },

            {
                title: "Schema внутри response",

                text: `
                    Аналогичным образом можно описать
                    тело ответа.

                    Например:

                    responses:
                      '200':
                        description: User found
                        content:
                          application/json:
                            schema:
                              $ref: '#/components/schemas/User'

                    Это означает, что успешный ответ
                    содержит JSON, соответствующий схеме User.
                `
            },

            {
                title: "Request DTO и Response DTO",

                text: `
                    Структура данных для создания пользователя
                    может отличаться от структуры пользователя,
                    который возвращает API.

                    Например:

                    UserCreateRequest

                    может содержать:

                    name
                    email

                    А User дополнительно содержит:

                    id
                    name
                    email

                    Поэтому для разных операций часто создают
                    отдельные схемы.
                `
            },

            {
                title: "Почему это важно",

                text: `
                    Явное описание request и response позволяет
                    разработчикам заранее понимать,
                    какие данные принимает и возвращает API.

                    Swagger UI может показать эти структуры
                    непосредственно в документации.

                    А другие инструменты могут использовать
                    эти схемы для генерации кода и проверки данных.
                `
            }
        ],

        idea: `
            Request — что клиент отправляет API.

            Response — что API возвращает клиенту.

            JSON — формат передаваемых данных.

            requestBody описывает тело запроса.

            content: application/json указывает,
            что тело содержит JSON.

            schema описывает структуру этого JSON.
        `,

        structure: `
            post:
              summary: Create user

              requestBody:
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
        `,

        explanation: `
            requestBody используется для описания
            тела входящего запроса.

            responses описывает возможные ответы.

            Внутри content указывается формат данных,
            например application/json.

            schema определяет структуру данных,
            а $ref позволяет использовать
            уже существующую схему.

            В следующем практическом уроке мы создадим
            POST /users с полноценным JSON-запросом
            и JSON-ответом.
        `
    },

    nextLesson: {
        text: `
            В следующем уроке создадим отдельную схему
            UserCreateRequest и научимся принимать
            нового пользователя через POST /users.
        `
    }
};