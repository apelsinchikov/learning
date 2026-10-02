const users = {
    1: {
        id: 1,
        firstName: "Иван",
        lastName: "Иванов",
        phones: [
            {
                phone: "+79990000000",
                type: "mobile"
            }
        ],
        address: [
            {
                city: "Москва",
                street: "Ленина",
                house: "10",
                apartment: "25"
            }
        ],
        devices: [
            {
                name: "MacBook Pro",
                operatingSystem: "macOS",
                inventoryNumber: "INV-001"
            }
        ]
    },

    42: {
        id: 42,
        firstName: "Петр",
        lastName: "Петров",
        phones: [
            {
                phone: "+48123456789",
                type: "mobile"
            },
            {
                phone: "+48987654321",
                type: "work"
            }
        ],
        address: [
            {
                city: "Варшава",
                street: "Nowa",
                house: "15",
                apartment: "8"
            }
        ],
        devices: [
            {
                name: "Lenovo ThinkPad",
                operatingSystem: "Windows",
                inventoryNumber: "LAPTOP-777"
            }
        ]
    }
};

const createdUser = {
    id: 100,
    firstName: "Алексей",
    lastName: "Смирнов",
    phones: [
        {
            phone: "+79991112233",
            type: "mobile"
        }
    ],
    address: [
        {
            city: "Москва",
            street: "Пушкина",
            house: "15",
            apartment: "10"
        }
    ],
    devices: [
        {
            name: "MacBook Air",
            operatingSystem: "macOS",
            inventoryNumber: "INV-100"
        }
    ]
};

const updatedUser = {
    id: 1,
    firstName: "Иван",
    lastName: "Иванов",
    phones: [
        {
            phone: "+79990000000",
            type: "mobile"
        }
    ],
    address: [
        {
            city: "Москва",
            street: "Ленина",
            house: "10",
            apartment: "25"
        }
    ],
    devices: [
        {
            name: "MacBook Pro",
            operatingSystem: "macOS",
            inventoryNumber: "INV-001"
        }
    ]
};

function jsonResponse(data, status = 200) {
    return new Response(
        JSON.stringify(data),
        {
            status,
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
}

function emptyResponse(status = 204) {
    return new Response(null, {
        status
    });
}

export function startMockApi() {
    const originalFetch = window.fetch;

    window.fetch = async function (
        input,
        init = {}
    ) {
        const url =
            typeof input === "string"
                ? input
                : input.url;

        const requestUrl =
            new URL(
                url,
                window.location.origin
            );

        const method =
            (
                init.method ||
                "GET"
            ).toUpperCase();

        const path =
            requestUrl.pathname;

        /*
         * GET /api/users
         */
        if (
            path === "/api/users" &&
            method === "GET"
        ) {
            return jsonResponse(
                Object.values(users),
                200
            );
        }

        /*
         * POST /api/users
         *
         * Всегда возвращаем
         * одного и того же пользователя.
         */
        if (
            path === "/api/users" &&
            method === "POST"
        ) {
            return jsonResponse(
                createdUser,
                201
            );
        }

        const match =
            path.match(
                /^\/api\/users\/(\d+)$/
            );

        if (match) {
            const id =
                Number(match[1]);

            /*
             * GET /api/users/{id}
             */
            if (method === "GET") {
                const user =
                    users[id];

                if (!user) {
                    return jsonResponse(
                        {
                            message:
                                "User not found"
                        },
                        404
                    );
                }

                return jsonResponse(
                    user,
                    200
                );
            }

            /*
             * PUT /api/users/{id}
             */
            if (method === "PUT") {
                return jsonResponse(
                    updatedUser,
                    200
                );
            }

            /*
             * PATCH /api/users/{id}
             */
            if (method === "PATCH") {
                return jsonResponse(
                    updatedUser,
                    200
                );
            }

            /*
             * DELETE /api/users/{id}
             */
            if (method === "DELETE") {
                return emptyResponse(204);
            }
        }

        return originalFetch(
            input,
            init
        );
    };
}