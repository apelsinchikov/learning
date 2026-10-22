/* Глава 4. Закономерности: агрегаты, GROUP BY, HAVING. */

export const chapter4 = [
    {
        id: "sql-count",
        title: "COUNT: сколько?",
        summary: "Считаем строки. COUNT(*) и COUNT(колонка).",
        story: `
«Сколько в отеле гостей и у скольких из них известна профессия? — спрашивает инспектор. — Мне нужно число, а не двадцать четыре строки».
`,
        theory: [
            {
                type: "why",
                title: "Зачем агрегатные функции",
                text: `
До сих пор запрос возвращал строки. Но иногда нужен один ответ: сколько, на какую сумму, какой самый большой. Агрегатные функции сворачивают много строк в одно значение.
`
            },
            {
                type: "example",
                sql: "SELECT COUNT(*) FROM guests;",
                note: "Сколько строк в таблице."
            },
            {
                type: "example",
                sql: "SELECT COUNT(*) AS total, COUNT(occupation) AS with_occupation FROM guests;"
            },
            {
                type: "text",
                text: `
\`COUNT(*)\` считает **строки**. \`COUNT(колонка)\` считает строки, где в этой колонке есть значение. \`NULL\` не считается. Поэтому два числа выше разные: у трёх гостей профессии нет.
`
            },
            {
                type: "trap",
                text: `
Агрегат не сочетается с обычной колонкой без группировки. Запрос \`SELECT full_name, COUNT(*) FROM guests\` вызовет ошибку: база не знает, какое имя показать рядом с общим числом. Эту проблему решает \`GROUP BY\`.
`
            }
        ],
        task: {
            prompt: `
Посчитайте всех гостей в колонку \`total\`, а гостей с указанной профессией в колонку \`with_occupation\`. Должна получиться одна строка с двумя числами.
`,
            starter: "SELECT  AS total,\n        AS with_occupation\nFROM guests",
            solution: "SELECT COUNT(*) AS total, COUNT(occupation) AS with_occupation FROM guests",
            names: true,
            expectRows: 1,
            expectCols: 2,
            hints: [
                "Нужны две функции COUNT.",
                "Всех строк считает COUNT(*). Строки с заполненной колонкой считает COUNT(колонка).",
                "COUNT(*) AS total, COUNT(occupation) AS with_occupation"
            ],
            clue: {
                title: "24 гостя, у 21 известна профессия",
                text: "Всего 24 гостя. У трёх профессия неизвестна. Это те самые Белова, Гаврилов и Назаров."
            }
        },
        cheat: [
            ["COUNT(*)", "число строк"],
            ["COUNT(a)", "число строк, где a не NULL"]
        ]
    },

    {
        id: "sql-aggregates",
        title: "SUM, AVG, MIN, MAX",
        summary: "Сумма, среднее, наименьшее и наибольшее.",
        story: `
«Что вообще заказывал гость №12 за всё время? — не унимается инспектор. — Сколько заказов, на какую сумму и когда был последний?»
`,
        theory: [
            {
                type: "why",
                title: "Зачем несколько функций",
                text: `
Каждая функция отвечает на свой вопрос. Складывает \`SUM\`, усредняет \`AVG\`, находит наименьшее \`MIN\` и наибольшее \`MAX\`. Вместе они дают портрет данных за один запрос.
`
            },
            {
                type: "example",
                sql: "SELECT SUM(price) AS total, AVG(price) AS average, MIN(price) AS cheapest, MAX(price) AS priciest\nFROM orders;"
            },
            {
                type: "text",
                text: `
\`MIN\` и \`MAX\` работают не только с числами. С датами они находят самую раннюю и самую позднюю. Условие \`WHERE\` применяется **до** подсчёта: сначала отбираем строки, потом считаем по ним.
`
            },
            {
                type: "trap",
                text: `
\`AVG\` и \`SUM\` пропускают \`NULL\`. Если у половины строк значения нет, среднее считается только по другой половине. Убедитесь, что вам нужно именно это.
`
            }
        ],
        task: {
            prompt: `
Для гостя №12 посчитайте: число заказов (\`orders_count\`), общую сумму (\`total\`) и время последнего заказа (\`last_order\`).
`,
            starter:
                "SELECT COUNT(*) AS orders_count,\n       AS total,\n       AS last_order\nFROM orders\nWHERE guest_id = 12",
            solution:
                "SELECT COUNT(*) AS orders_count, SUM(price) AS total, MAX(ordered_at) AS last_order FROM orders WHERE guest_id = 12",
            names: true,
            expectRows: 1,
            expectCols: 3,
            hints: [
                "Число заказов — COUNT, сумма — SUM, самое позднее время — MAX.",
                "Для времени подходит MAX: самое большое значение даты — самое позднее.",
                "SUM(price) AS total, MAX(ordered_at) AS last_order"
            ],
            clue: {
                title: "3100 рублей и тишина",
                text: "За всё время гость №12 сделал три заказа на 3100 рублей. Последний — в 01:55 ночи на 15 февраля."
            }
        },
        cheat: [
            ["SUM(a)", "сумма"],
            ["AVG(a)", "среднее"],
            ["MIN(a), MAX(a)", "наименьшее и наибольшее"]
        ]
    },

    {
        id: "sql-group-by",
        title: "GROUP BY: по группам",
        summary: "Считаем отдельно для каждого города, номера, гостя.",
        story: `
«Мне нужна картина по городам, — говорит инспектор. — Не общее число гостей, а сколько приехало из каждого города».
`,
        theory: [
            {
                type: "why",
                title: "Зачем нужна группировка",
                text: `
Агрегат без группировки даёт один ответ на всю таблицу. Но вопросы часто звучат как «сколько **в каждом** городе» или «сколько заказов **у каждого** гостя». \`GROUP BY\` делит строки на группы и считает отдельно в каждой.
`
            },
            {
                type: "example",
                sql: "SELECT city, COUNT(*) AS guests\nFROM guests\nGROUP BY city;"
            },
            {
                type: "text",
                text: `
Правило: всё, что стоит в \`SELECT\` и не является агрегатом, обязано быть в \`GROUP BY\`. Иначе база не поймёт, какое значение показать для группы.
`
            },
            {
                type: "example",
                sql: "SELECT guest_id, COUNT(*) AS orders_count, SUM(price) AS total\nFROM orders\nGROUP BY guest_id\nORDER BY total DESC;",
                note: "Группировать можно по любой колонке, и сортировать по результату."
            },
            {
                type: "trap",
                text: `
Если добавить в \`SELECT\` колонку и забыть её в \`GROUP BY\`, получите ошибку: «колонка должна быть в GROUP BY или внутри агрегата». Это правило, а не прихоть базы.
`
            }
        ],
        task: {
            prompt: `
Посчитайте, сколько гостей приехало из каждого города. Покажите \`city\` и число гостей под именем \`guests\`.
`,
            starter: "SELECT city, COUNT(*) AS guests\nFROM guests\n",
            solution: "SELECT city, COUNT(*) AS guests FROM guests GROUP BY city",
            names: true,
            expectRows: 6,
            expectCols: 2,
            hints: [
                "Запрос почти готов. Не хватает группировки.",
                "GROUP BY указывает колонку, по которой делим на группы.",
                "GROUP BY city"
            ],
            clue: {
                title: "География гостей",
                text: "Москва — 8 гостей, Санкт-Петербург и Казань — по 4, Екатеринбург и Сочи — по 3, Новосибирск — 2. Москвичей больше всего."
            }
        },
        cheat: [["GROUP BY a", "считать отдельно для каждого значения a"]]
    },

    {
        id: "sql-having",
        title: "HAVING: условие на группы",
        summary: "Оставляем только те группы, что удовлетворяют условию.",
        story: `
«Какие двери в отеле открывают чаще всего? — спрашивает инспектор. — Я хочу понять, где в отеле самое людное место».

Нужны не все комнаты, а только те, где дверь открывалась больше 15 раз.
`,
        theory: [
            {
                type: "why",
                title: "Зачем нужен HAVING",
                text: `
\`WHERE\` отбирает **строки** до группировки. Но условие вроде «больше 15 открытий» относится к группе, а группа появляется только после подсчёта. Для условий на результат подсчёта есть \`HAVING\`.
`
            },
            {
                type: "example",
                sql: "SELECT room_id, COUNT(*) AS openings\nFROM key_log\nGROUP BY room_id\nHAVING COUNT(*) > 15\nORDER BY room_id;"
            },
            {
                type: "text",
                text: `
Порядок частей в запросе всегда такой: \`SELECT\`, \`FROM\`, \`WHERE\`, \`GROUP BY\`, \`HAVING\`, \`ORDER BY\`, \`LIMIT\`.
`
            },
            {
                type: "trap",
                text: `
В \`HAVING\` пишите саму функцию: \`HAVING COUNT(*) > 15\`. Псевдоним \`openings\` тут не годится в стандартном SQL. В следующем уроке вы разберёте, почему.
`
            }
        ],
        task: {
            prompt: `
Найдите комнаты, дверь которых открывалась больше 15 раз. Покажите \`room_id\` и число открытий \`openings\`, по возрастанию номера комнаты.
`,
            starter:
                "SELECT room_id, COUNT(*) AS openings\nFROM key_log\nGROUP BY room_id\n",
            solution:
                "SELECT room_id, COUNT(*) AS openings FROM key_log GROUP BY room_id HAVING COUNT(*) > 15 ORDER BY room_id",
            ordered: true,
            names: true,
            expectRows: 6,
            expectCols: 2,
            hints: [
                "Условие на результат подсчёта пишется после GROUP BY.",
                "HAVING и сама функция COUNT(*) с нужным сравнением.",
                "HAVING COUNT(*) > 15 ORDER BY room_id"
            ],
            clue: {
                title: "Самые людные двери",
                text: "Чаще всего открывали бар (комната 15): более 50 раз. Дальше идут комнаты 4, 16, 13, 1 и 10."
            }
        },
        cheat: [["HAVING COUNT(*) > n", "оставить группы по условию на итог"]]
    },

    {
        id: "sql-where-vs-having",
        title: "WHERE или HAVING: что раньше",
        summary: "Порядок выполнения запроса и поиск ошибки.",
        story: `
Помощник инспектора написал запрос: «Кто сделал больше трёх заказов?» — и получил ошибку.

«Не понимаю, — говорит он. — Я же поставил условие. Исправьте».
`,
        theory: [
            {
                type: "why",
                title: "Откуда берётся путаница",
                text: `
Мы пишем запрос в одном порядке, а база выполняет его в другом. Если держать в голове настоящий порядок, ошибки с \`WHERE\`, \`HAVING\` и псевдонимами перестают быть загадкой.
`
            },
            { type: "order-steps" },
            {
                type: "text",
                text: `
Отсюда два правила.

- \`WHERE\` работает **до** группировки. Он не знает про \`COUNT\`, потому что подсчёта ещё не было.
- Псевдоним из \`SELECT\` появляется **после** \`WHERE\` и \`HAVING\`. Поэтому в них его использовать нельзя. А в \`ORDER BY\` — можно: он выполняется позже.
`
            },
            {
                type: "trap",
                text: `
Условие на отдельную строку («заказы после полуночи») пишите в \`WHERE\`. Оно отсеет лишнее заранее, и считать придётся меньше. Условие на итог группы («больше трёх заказов») пишите в \`HAVING\`.
`
            }
        ],
        task: {
            kind: "fix",
            prompt: `
Запрос ниже должен показать гостей, сделавших больше трёх заказов (\`guest_id\` и число \`orders_count\`). Он сломан. Исправьте его.
`,
            starter:
                "SELECT guest_id, COUNT(*) AS orders_count\nFROM orders\nWHERE COUNT(*) > 3\nGROUP BY guest_id",
            solution:
                "SELECT guest_id, COUNT(*) AS orders_count FROM orders GROUP BY guest_id HAVING COUNT(*) > 3",
            names: true,
            expectRows: 8,
            expectCols: 2,
            hints: [
                "Прочитайте ошибку: WHERE не знает про COUNT. Подумайте, на каком этапе появляется число заказов.",
                "Условие на итог группы пишется после GROUP BY.",
                "Уберите WHERE, добавьте HAVING COUNT(*) > 3 после GROUP BY."
            ],
            clue: {
                title: "Восемь любителей заказывать",
                text: "Больше трёх заказов сделали восемь гостей. Гостя №12 среди них нет: он заказывал мало и только вечером накануне."
            }
        },
        cheat: [
            ["WHERE", "отбирает строки до группировки"],
            ["HAVING", "отбирает группы после подсчёта"]
        ]
    }
];
