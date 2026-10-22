/* Глава 3. Хронология: сортировка, псевдонимы, выражения. */

export const chapter3 = [
    {
        id: "sql-order-by",
        title: "ORDER BY: порядок строк",
        summary: "Сортировка по возрастанию и по убыванию.",
        story: `
Инспектор разложила на столе листки: «Кто входил в кабинет управляющего этой ночью? Мне нужна хронология по минутам».

Без порядка записи журнала бесполезны.
`,
        theory: [
            {
                type: "why",
                title: "Зачем нужна сортировка",
                text: `
База не обещает никакого порядка строк. Сегодня они пришли одним образом, завтра другим. Если порядок важен, его нужно потребовать: \`ORDER BY\` ставится в самом конце запроса.
`
            },
            {
                type: "example",
                sql: "SELECT full_name, hired_on FROM staff\nORDER BY hired_on;",
                note: "От самого раннего найма к самому позднему."
            },
            {
                type: "example",
                sql: "SELECT full_name, hired_on FROM staff\nORDER BY hired_on DESC;",
                note: "DESC — по убыванию. По умолчанию действует ASC, по возрастанию."
            },
            {
                type: "text",
                text: `
Сортировать можно по нескольким колонкам: \`ORDER BY city, full_name\`. Сначала по городу, а внутри одного города по имени.
`
            },
            {
                type: "trap",
                text: `
Без \`ORDER BY\` нельзя полагаться на порядок. Даже если результат сегодня кажется упорядоченным, это случайность.
`
            }
        ],
        task: {
            prompt: `
Покажите открытия кабинета управляющего (\`room_id = 13\`) между 00:00 и 04:00 15 февраля 2026 года. Нужны колонки \`guest_id\`, \`staff_id\`, \`opened_at\`, по возрастанию времени.
`,
            starter:
                "SELECT guest_id, staff_id, opened_at\nFROM key_log\nWHERE room_id = 13\n  AND opened_at BETWEEN '2026-02-15 00:00' AND '2026-02-15 04:00'\n",
            solution:
                "SELECT guest_id, staff_id, opened_at FROM key_log WHERE room_id = 13 AND opened_at BETWEEN '2026-02-15 00:00' AND '2026-02-15 04:00' ORDER BY opened_at",
            ordered: true,
            expectRows: 5,
            expectCols: 3,
            hints: [
                "Условие уже написано. Осталось добавить порядок в самом конце.",
                "ORDER BY колонка. Нужна колонка со временем.",
                "ORDER BY opened_at"
            ],
            clue: {
                title: "Пять входов в кабинет за ночь",
                text: "Кабинет открывали пять раз: гость №7 в 00:48, сотрудник №2 в 01:40, гость №12 в 02:08, сотрудник №5 в 02:31 и сотрудник №1 в 03:05. Снова одни номера: нужно узнать, кто за ними."
            }
        },
        cheat: [
            ["ORDER BY a", "по возрастанию"],
            ["ORDER BY a DESC", "по убыванию"],
            ["ORDER BY a, b", "сначала по a, затем по b"]
        ]
    },

    {
        id: "sql-alias",
        title: "Выражения и псевдонимы",
        summary: "Вычисляем на лету и даём колонкам имена через AS.",
        story: `
«Гость №12 просит счёт с чаевыми в десять процентов, — рассказывает инспектор. — Бармен не успел посчитать. Помогите, заодно посмотрим, что этот гость вообще заказывал».
`,
        theory: [
            {
                type: "why",
                title: "Зачем вычислять в запросе",
                text: `
Базе можно поручить арифметику. Вам не нужен калькулятор, и данные не нужно переписывать: цена хранится одна, а наценку база считает в момент запроса.
`
            },
            {
                type: "example",
                sql: "SELECT item, price, price * 1.1 FROM orders\nWHERE guest_id = 7;",
                note: "Колонка с вычислением получила непонятное имя."
            },
            {
                type: "text",
                text: `
Чтобы дать результату читаемое имя, используют \`AS\`. Это **псевдоним**.
`
            },
            {
                type: "example",
                sql: "SELECT item, price * 1.1 AS with_tip FROM orders\nWHERE guest_id = 7;"
            },
            {
                type: "text",
                text: `
Можно склеивать текст через \`||\`, и вычислять с датами. Псевдонимы дают имя и таблицам: \`FROM guests AS g\`. Это пригодится, когда в запросе будет несколько таблиц.
`
            },
            {
                type: "trap",
                text: `
Псевдоним колонки нельзя использовать в \`WHERE\`: к моменту отбора строк база ещё не знает этого имени. Его можно использовать в \`ORDER BY\`. Почему так, станет понятно в главе 4.
`
            }
        ],
        task: {
            prompt: `
Покажите заказы гостя №12: блюдо (\`item\`), цену (\`price\`) и цену с чаевыми 10% под именем \`with_tip\`. Упорядочьте по времени заказа.
`,
            starter: "SELECT item, price,  AS with_tip\nFROM orders\nWHERE guest_id = 12\nORDER BY ordered_at",
            solution:
                "SELECT item, price, price * 1.1 AS with_tip FROM orders WHERE guest_id = 12 ORDER BY ordered_at",
            ordered: true,
            names: true,
            expectRows: 3,
            expectCols: 3,
            hints: [
                "Чаевые десять процентов — это умножение цены на 1.1.",
                "Выражение пишется в списке колонок, а после него AS и имя.",
                "price * 1.1 AS with_tip"
            ],
            clue: {
                title: "Три заказа гостя №12",
                text: "Гость №12 заказал стейк и глинтвейн вечером 14 февраля, а потом виски в 01:55 ночи. До этого вечера он вообще ничего не заказывал."
            }
        },
        cheat: [
            ["a * 1.1 AS b", "вычислить и назвать колонку b"],
            ["FROM t AS x", "короткий псевдоним таблицы"]
        ]
    },

    {
        id: "sql-top-n",
        title: "Кто был последним",
        summary: "ORDER BY DESC и LIMIT вместе.",
        story: `
«После виски гость №12 ещё что-нибудь заказывал? — спрашивает инспектор. — Нужен самый последний заказ до четырёх утра. И самый свежий заказ вообще».
`,
        theory: [
            {
                type: "why",
                title: "Зачем объединять",
                text: `
\`ORDER BY\` сам по себе выдаёт всё. \`LIMIT\` сам по себе выдаёт случайные строки. Вместе они отвечают на вопросы «самый», «последний», «первые три»: сначала упорядочиваем, потом берём верх списка.
`
            },
            {
                type: "example",
                sql: "SELECT full_name, hired_on FROM staff\nORDER BY hired_on DESC\nLIMIT 1;",
                note: "Самый новый сотрудник."
            },
            {
                type: "example",
                sql: "SELECT item, price FROM orders\nORDER BY price DESC, ordered_at\nLIMIT 3;",
                note: "Три самых дорогих заказа. Если цены равны, раньше идёт более ранний."
            },
            {
                type: "trap",
                text: `
Когда у нескольких строк одинаковое значение, «топ-3» неоднозначен. В примере выше четыре заказа стоят 1450. Добавьте вторую колонку в \`ORDER BY\`, чтобы результат не менялся от запуска к запуску.
`
            }
        ],
        task: {
            prompt: `
Найдите самый последний заказ до 04:00 15 февраля 2026 года. Покажите \`guest_id\`, \`item\`, \`ordered_at\`. Должна получиться одна строка.
`,
            starter:
                "SELECT guest_id, item, ordered_at\nFROM orders\nWHERE ordered_at < '2026-02-15 04:00'\n",
            solution:
                "SELECT guest_id, item, ordered_at FROM orders WHERE ordered_at < '2026-02-15 04:00' ORDER BY ordered_at DESC LIMIT 1",
            ordered: true,
            expectRows: 1,
            expectCols: 3,
            hints: [
                "Нужно упорядочить так, чтобы самый поздний заказ оказался первым.",
                "ORDER BY колонка DESC, а затем взять одну строку.",
                "ORDER BY ordered_at DESC LIMIT 1"
            ],
            clue: {
                title: "Последний заказ ночи",
                text: "Последним до четырёх утра заказывал гость №12: виски в 01:55. После этого он больше не заказывал ничего."
            }
        },
        cheat: [["ORDER BY a DESC LIMIT 1", "строка с наибольшим значением a"]]
    }
];
