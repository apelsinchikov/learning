export const pathsMethodsNaming = {
    id: "theory-2",

    type: "theory",

    icon: "📖",

    title: "Paths, HTTP-методы и API naming",

    subtitle: "Разберём endpoints, HTTP-методы и правила именования ресурсов.",

    sidebarDescription: "Paths и HTTP-методы",

    theory: {
        sections: [
            {
                title: "Что такое endpoint?",

                text: `
                    Endpoint — это конкретная точка API,
                    по которой клиент может выполнить определённую операцию.

                    Например:

                    /users

                    — это ресурс пользователей.

                    А комбинация пути и HTTP-метода определяет
                    конкретную операцию:

                    GET /users
                `
            },

            {
                title: "Раздел paths",

                text: `
                    В OpenAPI все endpoints описываются внутри
                    раздела paths.

                    Каждый ключ внутри paths — это путь API.

                    Например:

                    paths:
                      /users:
                        get:
                          ...
                `
            },

            {
                title: "HTTP-методы",

                text: `
                    HTTP-метод определяет, что мы хотим сделать
                    с ресурсом.

                    GET — получить данные.

                    POST — создать новый ресурс.

                    PUT — полностью изменить существующий ресурс.

                    PATCH — изменить часть существующего ресурса.

                    DELETE — удалить ресурс.
                `
            },

            {
                title: "Один путь — несколько операций",

                text: `
                    Один и тот же путь может поддерживать
                    несколько HTTP-методов.

                    Например:

                    /users

                    GET /users — получить список пользователей.

                    POST /users — создать нового пользователя.

                    Поэтому endpoint определяется не только путём,
                    но и HTTP-методом.
                `
            },

            {
                title: "Как называть ресурсы",

                text: `
                    В REST API путь обычно описывает ресурс,
                    а действие определяется HTTP-методом.

                    Поэтому лучше:

                    GET /users

                    POST /users

                    DELETE /users/42

                    чем:

                    GET /getUsers

                    POST /createUser

                    DELETE /deleteUser/42

                    Сам путь должен описывать ресурс,
                    а не повторять название действия.
                `
            },

            {
                title: "Коллекция и конкретный ресурс",

                text: `
                    Обычно коллекция ресурсов находится
                    по пути без идентификатора:

                    /users

                    А конкретный ресурс — с идентификатором:

                    /users/42

                    Например:

                    GET /users
                    — получить список пользователей.

                    GET /users/42
                    — получить пользователя с идентификатором 42.
                `
            },

            {
                title: "summary и description",

                text: `
                    Для операции можно указать summary —
                    короткое название операции.

                    Например:

                    summary: Get users

                    Также можно использовать description,
                    чтобы дать более подробное описание.

                    summary хорошо подходит для короткого
                    отображения операции в Swagger UI,
                    а description — для дополнительных пояснений.
                `
            },

            {
                title: "operationId",

                text: `
                    operationId — уникальное имя операции
                    внутри OpenAPI-спецификации.

                    Например:

                    operationId: getUsers

                    Для другой операции можно использовать:

                    operationId: getUser

                    operationId особенно полезен инструментам,
                    которые генерируют клиентский код.

                    Поэтому operationId должен быть понятным,
                    стабильным и уникальным.
                `
            }
        ],

        idea: `
            В REST API путь описывает ресурс,
            а HTTP-метод описывает операцию над этим ресурсом.

            Например:

            GET /users
            POST /users
            GET /users/42
            DELETE /users/42
        `,

        structure: `
            paths:
              /users:
                get:
                  summary: Get users

                post:
                  summary: Create user

              /users/{id}:
                get:
                  summary: Get user

                delete:
                  summary: Delete user
        `,

        explanation: `
            paths содержит доступные пути API.

            Внутри каждого пути находятся HTTP-методы.

            Для каждой операции можно указать
            summary, description, operationId,
            параметры, запросы и ответы.

            На следующем практическом уроке мы применим
            эти знания и расширим наш Users API.
        `
    },

    nextLesson: {
        text: `
            В следующем уроке мы вернёмся к практике
            и начнём описывать Users API более подробно.
        `
    }
};