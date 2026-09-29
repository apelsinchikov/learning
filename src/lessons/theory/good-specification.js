export const goodSpecification = {
    id: "theory-8",

    type: "theory",

    icon: "📖",

    title: "What a good specification looks like",

    subtitle: "Соберём всё изученное и разберём признаки хорошей OpenAPI-спецификации.",

    sidebarDescription: "Хорошая спецификация",

    theory: {
        sections: [
            {
                title: "OpenAPI — это контракт",

                text: `
                    Хорошая OpenAPI-спецификация должна
                    достаточно точно описывать поведение API.

                    Из неё должно быть понятно:

                    • какие endpoints существуют;
                    • какие HTTP-методы доступны;
                    • какие параметры принимает API;
                    • какие данные принимает;
                    • какие ответы может вернуть;
                    • какие ошибки возможны.
                `
            },

            {
                title: "Понятные имена",

                text: `
                    Пути, схемы и операции должны иметь
                    понятные и последовательные имена.

                    Например:

                    /users

                    /users/{id}

                    User

                    UserCreateRequest

                    getUsers

                    getUser

                    createUser

                    Хорошие имена помогают быстро понять
                    назначение элемента спецификации.
                `
            },

            {
                title: "Ресурс в path, действие в method",

                text: `
                    В REST API путь обычно описывает ресурс,
                    а HTTP-метод определяет действие.

                    Хороший вариант:

                    GET /users
                    POST /users
                    GET /users/{id}
                    DELETE /users/{id}

                    Вместо:

                    GET /getUsers
                    POST /createUser
                    DELETE /deleteUser/{id}
                `
            },

            {
                title: "Переиспользуемые schemas",

                text: `
                    Если одна структура используется
                    в нескольких местах, лучше вынести её
                    в components.schemas.

                    Например:

                    components:
                      schemas:
                        User:
                          ...

                    А затем использовать:

                    $ref: '#/components/schemas/User'

                    Это уменьшает дублирование
                    и упрощает изменение спецификации.
                `
            },

            {
                title: "Request и Response должны быть понятны",

                text: `
                    Для каждой операции должно быть понятно,
                    какие данные принимает API
                    и какие данные возвращает.

                    Например:

                    POST /users

                    принимает:

                    UserCreateRequest

                    и возвращает:

                    User

                    Такой контракт позволяет клиенту
                    заранее понять структуру взаимодействия.
                `
            },

            {
                title: "Описываем content",

                text: `
                    Если операция принимает или возвращает JSON,
                    это должно быть явно указано.

                    Например:

                    content:
                      application/json:
                        schema:
                          $ref: '#/components/schemas/User'

                    Благодаря этому документация
                    точно показывает формат данных.
                `
            },

            {
                title: "Описываем возможные ответы",

                text: `
                    Хорошая спецификация описывает
                    не только успешный результат.

                    Например:

                    GET /users/{id}

                    может иметь:

                    200 — пользователь найден.

                    404 — пользователь не найден.

                    Для других операций могут использоваться
                    400, 401, 403, 409 и 500
                    в зависимости от поведения API.
                `
            },

            {
                title: "Описание помогает людям",

                text: `
                    OpenAPI читают не только инструменты,
                    но и разработчики.

                    Поэтому полезно использовать:

                    summary
                    description
                    description у параметров
                    description у схем
                    example

                    Спецификация должна быть понятна человеку,
                    который впервые открывает документацию API.
                `
            },

            {
                title: "Не стоит описывать то, чего нет",

                text: `
                    OpenAPI должна соответствовать
                    реальному API.

                    Если endpoint описан в спецификации,
                    но сервер его не поддерживает,
                    документация вводит разработчиков в заблуждение.

                    То же самое относится к параметрам,
                    структурам данных и HTTP-ответам.
                `
            },

            {
                title: "Последовательность",

                text: `
                    Хорошая спецификация использует
                    одинаковые подходы во всём API.

                    Например:

                    если идентификаторы пользователей
                    всегда integer,

                    то не стоит в одном endpoint
                    использовать integer,
                    а в другом неожиданно string.

                    Последовательность делает API
                    проще для использования и поддержки.
                `
            },

            {
                title: "Проверяем спецификацию",

                text: `
                    OpenAPI-спецификацию полезно проверять
                    автоматически.

                    Валидатор может обнаружить
                    структурные ошибки спецификации.

                    Swagger UI помогает увидеть,
                    как документация будет выглядеть
                    для разработчика.

                    А дополнительные проверки курса
                    могут проверить выполнение
                    конкретного учебного задания.
                `
            }
        ],

        idea: `
            Хорошая OpenAPI-спецификация:

            понятная
            ↓
            последовательная
            ↓
            переиспользует schemas
            ↓
            описывает request и response
            ↓
            содержит возможные ошибки
            ↓
            соответствует реальному API
        `,

        structure: `
            /users:
              get:
                summary: Get users

                parameters:
                  - name: limit
                    in: query

                responses:
                  '200':
                    description: Users found

            /users/{id}:
              get:
                summary: Get user

                parameters:
                  - name: id
                    in: path
                    required: true

                responses:
                  '200':
                    description: User found

                  '404':
                    description: User not found
        `,

        explanation: `
            На протяжении курса мы постепенно
            добавляли новые элементы OpenAPI:

            paths
            HTTP-методы
            schemas
            properties
            required
            arrays
            $ref
            requestBody
            application/json
            parameters
            status codes

            В финальном практическом задании
            мы объединим всё это в одну спецификацию
            Users API.
        `
    },

    nextLesson: {
        text: `
            Финальный урок — соберём полноценный Users API
            с endpoints, schemas, requestBody,
            parameters и несколькими status codes.
        `
    }
};