/* Глава 1. Сложные запросы: читаем схему и пишем запрос шагами. */

export const chapter1 = [
    {
        id: "sqa-schema-read",
        title: "Читаем схему",
        summary: "Ключи, связи и «может быть NULL»: что откуда брать.",
        story: `
Вы пришли в управляющую компанию «Перевала» системным аналитиком. Разработчик Тимур пишет бэкенд и просит: «Опиши метод \`GET /guests/{id}/bookings\`. Я не знаю, какие данные откуда брать».

Сначала смотрим схему базы. Она справа во вкладке «Схема».
`,
        refs: [
            ["diagrams", "dg-er-keys", "Ключи в ER"],
            ["sql", "sql-read-db", "Как читать базу"]
        ],
        theory: [
            {
                type: "why",
                title: "читать схему перед запросом",
                text: `
Схема отвечает на три вопроса: где лежат нужные данные, как таблицы связаны и что в них может отсутствовать. Без ответов запрос получится неверным, а метод API опишет не то, что есть в базе.
`
            },
            {
                type: "text",
                text: `
Таблица [[table:bookings]] хранит брони. Внешние ключи \`guest_id\` и \`room_id\` ссылаются на таблицы [[table:guests]] и [[table:rooms]]. Эти ключи и есть связь: значение в \`bookings.guest_id\` равно значению \`guests.id\`.

Значки в схеме: **PK** — первичный ключ, **FK** — внешний ключ, **UK** — значение должно быть уникальным.
`
            },
            {
                type: "text",
                text: `
Связь «один ко многим»: у одного гостя много броней, а у брони один гость. Внешний ключ лежит на стороне «многих», то есть в таблице броней.

Связь «многие ко многим»: у брони может быть несколько услуг, и одну услугу заказывают в разных бронях. Такую связь хранит отдельная таблица [[table:booking_services]]. У неё **составной ключ** из двух колонок: \`booking_id\` и \`service_id\`.
`
            },
            {
                type: "trap",
                text: `
Если у колонки в схеме написано «может быть NULL», значения может не быть. Например, у брони с сайта нет администратора: \`staff_id\` пустой. В методе API это необязательное поле, а в запросе — причина взять \`LEFT JOIN\` вместо \`JOIN\`.
`
            },
            {
                type: "text",
                text: `
Нажмите «Схема целиком» над таблицами: откроется ER-диаграмма всей базы. Ей удобно пользоваться, когда нужно найти путь от одной таблицы к другой.
`
            }
        ],
        task: {
            kind: "quiz",
            prompt: "Ответьте на вопросы по схеме. Смотрите во вкладку «Схема».",
            questions: [
                {
                    prompt: "Метод `GET /guests/{id}/bookings` возвращает все брони гостя. По какой колонке искать брони?",
                    options: ["guests.id", "bookings.guest_id", "bookings.id", "rooms.id"],
                    correct: 1,
                    explain: "Верно. `guest_id` лежит в таблице броней и ссылается на `guests.id`: по нему выбираем брони нужного гостя."
                },
                {
                    prompt: "Как в схеме видно, что у брони может не быть администратора?",
                    options: [
                        "Колонка помечена FK",
                        "У колонки `staff_id` написано «может быть NULL»",
                        "У колонки нет типа",
                        "Таблица staff пустая"
                    ],
                    correct: 1,
                    explain: "Верно. Колонка без NOT NULL допускает пустое значение, поэтому поле в методе API будет необязательным."
                },
                {
                    prompt: "Как в базе связаны брони и услуги?",
                    options: [
                        "Колонкой service_id в таблице bookings",
                        "Колонкой booking_id в таблице services",
                        "Отдельной таблицей booking_services (многие ко многим)",
                        "Они не связаны"
                    ],
                    correct: 2,
                    explain: "Верно. Многие ко многим всегда требует третьей таблицы, а её ключ состоит из двух колонок."
                }
            ],
            afterwards: `
Так читается любая схема: найдите таблицу с нужными данными, пройдите по внешним ключам к соседям и отметьте, что может быть пустым. Дальше пишем запросы.
`
        },
        cheat: [
            ["PK", "первичный ключ: однозначно определяет строку"],
            ["FK", "внешний ключ: ссылка на строку другой таблицы"],
            ["UK", "значение не повторяется в таблице"]
        ]
    },

    {
        id: "sqa-api-query",
        title: "Запрос под метод API",
        summary: "Поля ответа метода собираем из нескольких таблиц.",
        story: `
Тимур прислал черновик ответа метода \`GET /bookings?status=confirmed\`. Для каждой брони нужны: номер брони, имя гостя, номер комнаты, имя администратора, дата заезда и статус. Показать нужно ближайшие десять заездов.
`,
        refs: [
            ["sql", "sql-three-tables", "JOIN трёх таблиц"],
            ["sql", "sql-left-join", "LEFT JOIN"]
        ],
        theory: [
            {
                type: "why",
                title: "сопоставить поля ответа с колонками",
                text: `
Поле метода API редко лежит в одной таблице. Аналитик называет для каждого поля таблицу и колонку и описывает путь соединения. Запрос получается почти сам.
`
            },
            {
                type: "text",
                text: `
Составим таблицу соответствия:

- \`id\` — \`bookings.id\`
- \`guest\` — \`guests.full_name\`, соединяем по \`bookings.guest_id = guests.id\`
- \`room\` — \`rooms.number\`, соединяем по \`bookings.room_id = rooms.id\`
- \`administrator\` — \`staff.full_name\`, соединяем по \`bookings.staff_id = staff.id\`

Имя поля в ответе задаёт псевдоним: \`g.full_name AS guest\`.
`
            },
            {
                type: "example",
                sql: "SELECT b.id, g.full_name AS guest, r.number AS room\nFROM bookings b\nJOIN guests g ON g.id = b.guest_id\nJOIN rooms r ON r.id = b.room_id\nWHERE b.status = 'confirmed'\nORDER BY b.check_in, b.id\nLIMIT 5;",
                note: "Три таблицы, фильтр по статусу и порядок. Администратора здесь пока нет."
            },
            {
                type: "trap",
                text: `
У брони с сайта нет администратора: \`staff_id\` пустой. Обычный \`JOIN\` выбросит такие брони, и ответ метода окажется неполным. Для необязательной связи берите \`LEFT JOIN\`: строка остаётся, а недостающее поле будет \`NULL\`.
`
            }
        ],
        task: {
            kind: "query",
            prompt: `
Составьте запрос для метода. Колонки (имена как в ответе API): \`id\`, \`guest\`, \`room\`, \`administrator\`, \`check_in\`, \`status\`. Только брони со статусом \`confirmed\`. Порядок: по дате заезда, затем по номеру брони. Первые десять строк.
`,
            starter:
                "SELECT b.id, g.full_name AS guest\nFROM bookings b\nJOIN guests g ON g.id = b.guest_id\n",
            solution: `SELECT b.id, g.full_name AS guest, r.number AS room, s.full_name AS administrator, b.check_in, b.status
FROM bookings b
JOIN guests g ON g.id = b.guest_id
JOIN rooms r ON r.id = b.room_id
LEFT JOIN staff s ON s.id = b.staff_id
WHERE b.status = 'confirmed'
ORDER BY b.check_in, b.id
LIMIT 10`,
            ordered: true,
            names: true,
            expectRows: 10,
            expectCols: 6,
            hints: [
                "Нужны четыре таблицы: брони, гости, номера и сотрудники.",
                "Администратор бывает не у всех броней. Для сотрудников нужен LEFT JOIN.",
                "... LEFT JOIN staff s ON s.id = b.staff_id WHERE b.status = 'confirmed' ORDER BY b.check_in, b.id LIMIT 10"
            ],
            afterwards: `
Обратите внимание на \`LEFT JOIN\`. С обычным \`JOIN\` в ответе не оказалось бы броней, сделанных через сайт, а у них администратора нет. Такие вопросы «что будет, если связи нет» аналитик задаёт на этапе описания метода.
`
        },
        cheat: [
            ["expr AS name", "псевдоним: имя поля в ответе"],
            ["LEFT JOIN", "оставить строки без пары, недостающее будет NULL"]
        ]
    },

    {
        id: "sqa-cte",
        title: "WITH: запрос шагами",
        summary: "CTE: именованные шаги вместо вложенных подзапросов.",
        story: `
Владелица просит найти самые загруженные номера: «Где за сезон прожили больше шестидесяти ночей?» Считать надо только завершённые брони. Тимур просит описать это шагами, чтобы потом проверить каждый шаг отдельно.
`,
        refs: [
            ["sql", "sql-subquery", "Подзапросы"],
            ["sql", "sql-group-by", "GROUP BY"]
        ],
        theory: [
            {
                type: "why",
                title: "писать запрос шагами",
                text: `
Сложный запрос с вложенными скобками тяжело читать и проверять. \`WITH\` называет каждый шаг и ставит их друг за другом: сверху вниз, как пункты в спецификации. Любой шаг можно выполнить отдельно и посмотреть, что в нём получилось.
`
            },
            {
                type: "example",
                sql: "WITH stays AS (\n    SELECT room_id, check_out - check_in AS nights\n    FROM bookings\n    WHERE status = 'completed'\n)\nSELECT room_id, sum(nights) AS total_nights\nFROM stays\nGROUP BY room_id\nORDER BY total_nights DESC\nLIMIT 3;",
                note: "Шаг stays считает ночи по каждой брони. Основной запрос складывает их по номерам."
            },
            {
                type: "text",
                text: `
Конструкция \`WITH имя AS (запрос)\` называется **CTE**, общее табличное выражение. Это временное имя, которое живёт только внутри одного запроса. После \`WITH\` его можно использовать как обычную таблицу, в том числе в \`JOIN\`. Шагов может быть несколько, их перечисляют через запятую.
`
            },
            {
                type: "trap",
                text: `
CTE не сохраняется в базе и не ускоряет запрос сам по себе. Это способ сделать его читаемым. Если нужно сохранить шаг для других запросов, для этого есть представление (о нём в главе 3).
`
            }
        ],
        task: {
            kind: "query",
            prompt: `
Покажите номера, у которых по завершённым броням больше 60 ночей. Колонки: \`number\` (номер комнаты) и \`total_nights\`. Сначала в CTE \`nights_by_room\` посчитайте ночи по каждому номеру, затем соедините с [[table:rooms]]. Порядок: от большего числа ночей к меньшему.
`,
            starter:
                "WITH nights_by_room AS (\n    -- шаг 1: сумма ночей по каждому номеру, только завершённые брони\n    SELECT room_id, sum(check_out - check_in) AS total_nights\n    FROM bookings\n    WHERE status = 'completed'\n    GROUP BY room_id\n)\n-- шаг 2: подключите номер комнаты и оставьте тех, у кого больше 60 ночей\nSELECT ",
            solution: `WITH nights_by_room AS (
    SELECT room_id, sum(check_out - check_in) AS total_nights
    FROM bookings
    WHERE status = 'completed'
    GROUP BY room_id
)
SELECT r.number, n.total_nights
FROM nights_by_room n
JOIN rooms r ON r.id = n.room_id
WHERE n.total_nights > 60
ORDER BY n.total_nights DESC`,
            ordered: true,
            names: true,
            expectRows: 4,
            expectCols: 2,
            hints: [
                "Шаг 1 уже написан. В основном запросе нужен JOIN с rooms по room_id.",
                "Фильтр по сумме ночей пишется в основном запросе: WHERE n.total_nights > 60.",
                "SELECT r.number, n.total_nights FROM nights_by_room n JOIN rooms r ON r.id = n.room_id WHERE n.total_nights > 60 ORDER BY n.total_nights DESC"
            ],
            afterwards: `
Запрос читается как инструкция: сначала посчитали ночи, потом подключили номера. Так же стоит описывать сложные выборки в спецификации: по шагам, у каждого шага своё имя.
`
        },
        cheat: [["WITH имя AS (…)", "именованный шаг запроса (CTE)"]]
    },

    {
        id: "sqa-case",
        title: "CASE в отчётах",
        summary: "Условная логика: статусы, корзины, метки.",
        story: `
Для отчёта владелице нужно разделить брони по длине: короткие, обычные и длинные. Границы ей назвал менеджер: до 2 ночей включительно — короткая, 3–4 ночи — обычная, 5 и больше — длинная.
`,
        refs: [["sql", "sql-case-union", "CASE и UNION"]],
        theory: [
            {
                type: "why",
                title: "условную логику в запросе",
                text: `
Правило вида «если..., то...» часто есть в требованиях: статус заказа, размер скидки, категория клиента. \`CASE\` выражает его прямо в запросе, и результат можно группировать и считать.
`
            },
            {
                type: "example",
                sql: "SELECT id,\n       check_out - check_in AS nights,\n       CASE\n           WHEN check_out - check_in <= 2 THEN 'short'\n           WHEN check_out - check_in <= 4 THEN 'regular'\n           ELSE 'long'\n       END AS stay_type\nFROM bookings\nLIMIT 6;",
                note: "Условия проверяются сверху вниз. Срабатывает первое подходящее."
            },
            {
                type: "text",
                text: `
Ветки проверяются по порядку, поэтому граничные значения не нужно писать дважды: если число ночей не больше 2, до второй ветки дело не дойдёт. Ветка \`ELSE\` ловит всё остальное. Без неё для таких строк получится \`NULL\`.

Чтобы посчитать брони в каждой корзине, сгруппируйте по выражению \`CASE\` или оберните его в CTE и сгруппируйте по готовой колонке.
`
            },
            {
                type: "trap",
                text: `
Порядок веток меняет результат. Если поставить \`<= 4\` выше \`<= 2\`, короткие брони попадут в обычные. Проверяйте ветки сверху вниз.
`
            }
        ],
        task: {
            kind: "query",
            prompt: `
Посчитайте брони по длине, не считая отменённых (\`status <> 'cancelled'\`). Колонки: \`stay_type\` со значениями \`short\`, \`regular\`, \`long\` и \`bookings\` (число броней). Порядок: от большего числа к меньшему.
`,
            starter:
                "SELECT\n    CASE\n        WHEN check_out - check_in <= 2 THEN 'short'\n        -- добавьте остальные ветки\n    END AS stay_type,\n    count(*) AS bookings\nFROM bookings\nWHERE status <> 'cancelled'\n",
            solution: `SELECT
    CASE
        WHEN check_out - check_in <= 2 THEN 'short'
        WHEN check_out - check_in <= 4 THEN 'regular'
        ELSE 'long'
    END AS stay_type,
    count(*) AS bookings
FROM bookings
WHERE status <> 'cancelled'
GROUP BY 1
ORDER BY 2 DESC`,
            ordered: true,
            names: true,
            expectRows: 3,
            expectCols: 2,
            hints: [
                "Нужны три ветки: до 2 ночей, до 4 ночей и всё остальное (ELSE).",
                "Выражение CASE нужно и в SELECT, и в GROUP BY. Можно написать GROUP BY 1: это первая колонка.",
                "... WHEN check_out - check_in <= 4 THEN 'regular' ELSE 'long' END AS stay_type, count(*) AS bookings FROM bookings WHERE status <> 'cancelled' GROUP BY 1 ORDER BY 2 DESC"
            ],
            afterwards: `
Одно выражение \`CASE\` превратило число ночей в понятную категорию, и категории можно считать. В спецификации границы корзин лучше записывать таблицей: тогда ветки \`CASE\` пишутся без вопросов.
`
        },
        cheat: [["CASE WHEN … THEN … ELSE … END", "условное значение; ветки проверяются сверху вниз"]]
    },

    {
        id: "sqa-exists",
        title: "EXISTS и NOT EXISTS",
        summary: "Найти строки, у которых нет пары: брони без оплаты.",
        story: `
Бухгалтерия жалуется на расхождения: завершённые брони есть, а платежей по ним не видно. Нужен список таких броней, чтобы позвонить гостям.
`,
        refs: [
            ["sql", "sql-anti-join", "Кого нет в другой таблице"],
            ["sql", "sql-left-join", "LEFT JOIN"]
        ],
        theory: [
            {
                type: "why",
                title: "искать строки без пары",
                text: `
Вопросы «у кого нет...», «какие не ...» встречаются постоянно: клиенты без заказов, брони без оплаты, товары без остатка. \`NOT EXISTS\` отвечает на них прямо.
`
            },
            {
                type: "example",
                sql: "SELECT b.id, b.check_out\nFROM bookings b\nWHERE b.status = 'completed'\n  AND NOT EXISTS (\n      SELECT 1 FROM payments p WHERE p.booking_id = b.id\n  )\nORDER BY b.id\nLIMIT 5;",
                note: "Для каждой брони база проверяет: есть ли хотя бы один платёж. Нет — бронь попадает в ответ."
            },
            {
                type: "text",
                text: `
Подзапрос внутри \`EXISTS\` может ссылаться на строку внешнего запроса (здесь \`b.id\`). \`SELECT 1\` — просто заглушка: важно только, нашлась ли строка. Если найдена хоть одна, \`EXISTS\` истинно, а \`NOT EXISTS\` ложно.

Тот же результат можно получить через \`LEFT JOIN ... WHERE p.id IS NULL\`. \`NOT EXISTS\` читается ближе к тому, что написано в требованиях.
`
            },
            {
                type: "trap",
                text: `
Не заменяйте \`NOT EXISTS\` на \`NOT IN (SELECT ...)\`. Если в подзапросе встретится хотя бы один \`NULL\`, \`NOT IN\` не вернёт ни одной строки, и ошибку заметить трудно. \`NOT EXISTS\` с \`NULL\` справляется.
`
            }
        ],
        task: {
            kind: "query",
            prompt: `
Найдите завершённые брони (\`status = 'completed'\`), по которым нет ни одного платежа в [[table:payments]]. Колонки: \`id\`, \`guest\` (имя гостя), \`check_out\`. Порядок: по номеру брони.
`,
            starter:
                "SELECT b.id, g.full_name AS guest, b.check_out\nFROM bookings b\nJOIN guests g ON g.id = b.guest_id\nWHERE b.status = 'completed'\n  AND ",
            solution: `SELECT b.id, g.full_name AS guest, b.check_out
FROM bookings b
JOIN guests g ON g.id = b.guest_id
WHERE b.status = 'completed'
  AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.booking_id = b.id)
ORDER BY b.id`,
            ordered: true,
            names: true,
            expectRows: 13,
            expectCols: 3,
            hints: [
                "Условие «платежа нет» пишется как NOT EXISTS (подзапрос).",
                "В подзапросе платежи ищутся по booking_id внешней брони: WHERE p.booking_id = b.id.",
                "AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.booking_id = b.id) ORDER BY b.id"
            ],
            afterwards: `
Тринадцать завершённых броней без оплаты. Этот список бухгалтерия передаст менеджерам. Запрос не нужно переписывать, если появятся новые брони: он каждый раз проверяет актуальные данные.
`
        },
        cheat: [
            ["EXISTS (подзапрос)", "истина, если подзапрос вернул хотя бы одну строку"],
            ["NOT EXISTS (подзапрос)", "истина, если подзапрос ничего не вернул"]
        ]
    },

    {
        id: "sqa-set-ops",
        title: "INTERSECT, EXCEPT, UNION ALL",
        summary: "Операции над множествами: общее, разница, объединение.",
        story: `
Маркетинг хочет вернуть ушедших гостей. Нужен список тех, кто бывал в «Перевале» до Нового года, но с 1 января не бронировал ничего.
`,
        refs: [["sql", "sql-case-union", "UNION"]],
        theory: [
            {
                type: "why",
                title: "сравнивать два списка",
                text: `
Иногда вопрос состоит из двух списков: «кто есть и в одном, и в другом», «кто есть в первом, но нет во втором». Операции над множествами отвечают на такие вопросы без сложных соединений.
`
            },
            {
                type: "text",
                text: `
- \`UNION ALL\` склеивает два результата в один, все строки сохраняются.
- \`UNION\` склеивает и убирает повторы.
- \`INTERSECT\` оставляет только строки, которые есть в обоих результатах.
- \`EXCEPT\` оставляет строки первого результата, которых нет во втором.

У обоих запросов должно быть одинаковое число колонок с совместимыми типами. Имена колонок берутся из первого запроса.
`
            },
            {
                type: "example",
                sql: "SELECT guest_id FROM bookings WHERE check_in < '2026-01-01'\nINTERSECT\nSELECT guest_id FROM bookings WHERE check_in >= '2026-01-01'\nORDER BY guest_id\nLIMIT 5;",
                note: "Гости, которые бронировали и до Нового года, и после."
            },
            {
                type: "trap",
                text: `
\`UNION\` убирает дубликаты и делает это дороже, чем \`UNION ALL\`. Если повторов быть не может или они нужны, берите \`UNION ALL\`. \`ORDER BY\` пишется один раз, в самом конце, и относится ко всему результату.
`
            }
        ],
        task: {
            kind: "query",
            prompt: `
Найдите гостей, у которых есть брони с датой заезда раньше 1 января 2026 года, но нет ни одной брони с этой даты и позже. Используйте \`EXCEPT\`. Колонки: \`id\` и \`full_name\` из [[table:guests]]. Порядок: по \`id\`.
`,
            starter:
                "SELECT g.id, g.full_name\nFROM guests g\nJOIN bookings b ON b.guest_id = g.id\nWHERE b.check_in < '2026-01-01'\n",
            solution: `SELECT g.id, g.full_name
FROM guests g
JOIN bookings b ON b.guest_id = g.id
WHERE b.check_in < '2026-01-01'
EXCEPT
SELECT g.id, g.full_name
FROM guests g
JOIN bookings b ON b.guest_id = g.id
WHERE b.check_in >= '2026-01-01'
ORDER BY id`,
            ordered: true,
            names: true,
            expectRows: 4,
            expectCols: 2,
            hints: [
                "Нужны два запроса с одинаковыми колонками: «до Нового года» и «с Нового года».",
                "Между ними ставится EXCEPT. Второй запрос отличается только условием check_in >= '2026-01-01'.",
                "... EXCEPT SELECT g.id, g.full_name FROM guests g JOIN bookings b ON b.guest_id = g.id WHERE b.check_in >= '2026-01-01' ORDER BY id"
            ],
            afterwards: `
Четыре гостя ушли. Теперь у маркетинга есть список для рассылки. Обратите внимание: \`EXCEPT\` сравнивает целые строки, поэтому в обоих запросах колонки должны быть одинаковыми.
`
        },
        cheat: [
            ["A INTERSECT B", "строки, которые есть и в A, и в B"],
            ["A EXCEPT B", "строки из A, которых нет в B"],
            ["A UNION ALL B", "все строки A и B подряд"]
        ]
    },

    {
        id: "sqa-lateral",
        title: "LATERAL: последняя запись",
        summary: "Для каждой строки взять «последнюю» связанную запись.",
        story: `
Администратор просит для каждого номера показать, кто жил в нём последним и когда выехал. Так проще понять, когда номер освободился и можно ли убирать.
`,
        refs: [["sql", "sql-top-n", "ORDER BY и LIMIT"]],
        theory: [
            {
                type: "why",
                title: "брать последнюю запись для каждой строки",
                text: `
Задачи вида «последний заказ клиента», «самый свежий статус», «две последние брони номера» повторяются в любой системе. Обычный \`JOIN\` для них не подходит: нужно отсортировать связанные строки и взять первые.
`
            },
            {
                type: "text",
                text: `
\`LATERAL\` позволяет подзапросу в \`FROM\` ссылаться на строку таблицы, стоящей слева. Для каждой строки внешней таблицы такой подзапрос выполняется заново, поэтому внутри него можно писать \`ORDER BY ... LIMIT 1\`.
`
            },
            {
                type: "example",
                sql: "SELECT r.number, last.check_out\nFROM rooms r\nCROSS JOIN LATERAL (\n    SELECT b.check_out\n    FROM bookings b\n    WHERE b.room_id = r.id AND b.status = 'completed'\n    ORDER BY b.check_out DESC\n    LIMIT 1\n) AS last\nORDER BY r.number;",
                note: "Для каждого номера подзапрос берёт самый поздний выезд."
            },
            {
                type: "trap",
                text: `
Если у номера нет подходящих броней, \`CROSS JOIN LATERAL\` не покажет такой номер. Чтобы оставить его с пустым значением, пишите \`LEFT JOIN LATERAL (...) AS last ON true\`.
`
            }
        ],
        task: {
            kind: "query",
            prompt: `
Для каждого номера найдите последнюю завершённую бронь. Колонки: \`number\` (номер комнаты), \`last_check_out\` (дата выезда), \`guest\` (имя гостя). Порядок: по номеру комнаты. Используйте \`LATERAL\`.
`,
            starter:
                "SELECT r.number, last.check_out AS last_check_out, last.guest\nFROM rooms r\nCROSS JOIN LATERAL (\n    SELECT b.check_out, g.full_name AS guest\n    FROM bookings b\n    JOIN guests g ON g.id = b.guest_id\n    WHERE b.room_id = r.id\n    -- оставьте только завершённые, возьмите самую позднюю\n) AS last\nORDER BY r.number",
            solution: `SELECT r.number, last.check_out AS last_check_out, last.guest
FROM rooms r
CROSS JOIN LATERAL (
    SELECT b.check_out, g.full_name AS guest
    FROM bookings b
    JOIN guests g ON g.id = b.guest_id
    WHERE b.room_id = r.id AND b.status = 'completed'
    ORDER BY b.check_out DESC
    LIMIT 1
) AS last
ORDER BY r.number`,
            ordered: true,
            names: true,
            expectRows: 12,
            expectCols: 3,
            hints: [
                "Внутри подзапроса добавьте условие по статусу: b.status = 'completed'.",
                "Самая последняя бронь — это сортировка по выезду по убыванию и LIMIT 1.",
                "... WHERE b.room_id = r.id AND b.status = 'completed' ORDER BY b.check_out DESC LIMIT 1"
            ],
            afterwards: `
Двенадцать номеров, у каждого последний гость. \`LATERAL\` решает один частый класс задач: «первые N записей для каждого». Если нужно две последние брони, достаточно заменить \`LIMIT 1\` на \`LIMIT 2\`.
`
        },
        cheat: [["CROSS JOIN LATERAL (подзапрос) AS t", "подзапрос видит строку слева и выполняется для каждой"]]
    },

    {
        id: "sqa-recursive",
        title: "Рекурсивный CTE",
        summary: "Иерархия: цепочка руководителей и подчинённых.",
        story: `
Для метода \`GET /staff/tree\` нужен весь штат компании в виде дерева: кто кому подчиняется и на каком уровне стоит. Вложенность заранее неизвестна: директор, менеджеры, администраторы, а у них свои подчинённые.
`,
        refs: [["sql", "sql-self-join", "Таблица с собой"]],
        theory: [
            {
                type: "why",
                title: "обходить иерархию",
                text: `
Структуры вида «начальник — подчинённый», «категория — подкатегория», «папка — вложенная папка» хранятся в одной таблице со ссылкой на себя. Глубина заранее неизвестна, и обычными \`JOIN\` её не обойти. Рекурсивный CTE повторяет шаг, пока находит новые строки.
`
            },
            {
                type: "text",
                text: `
У рекурсивного запроса две части, соединённые \`UNION ALL\`:

- **основа** — с чего начинаем (например, директор: у него нет руководителя);
- **шаг** — как найти следующий уровень: берём тех, чей руководитель уже найден.

База повторяет шаг, пока он возвращает строки. В таблице [[table:staff]] руководитель хранится в колонке \`manager_id\`.
`
            },
            {
                type: "example",
                sql: "WITH RECURSIVE tree AS (\n    SELECT id, full_name, 0 AS level\n    FROM staff\n    WHERE manager_id IS NULL\n  UNION ALL\n    SELECT s.id, s.full_name, t.level + 1\n    FROM staff s\n    JOIN tree t ON s.manager_id = t.id\n)\nSELECT * FROM tree ORDER BY level, id;",
                note: "Основа — директор. Шаг находит подчинённых тех, кто уже в дереве."
            },
            {
                type: "trap",
                text: `
Если в данных есть цикл (А подчиняется Б, а Б подчиняется А), запрос не закончится. В песочнице он остановится через 10 секунд, а в рабочей системе зависнет. Условие остановки и защита от циклов описываются в требованиях.
`
            }
        ],
        task: {
            kind: "query",
            prompt: `
Постройте дерево штата. Колонки: \`id\`, \`full_name\`, \`level\` (директор — уровень 0, его подчинённые — 1 и так далее). Порядок: по уровню, затем по \`id\`.
`,
            starter:
                "WITH RECURSIVE tree AS (\n    -- основа: директор, у него нет руководителя\n    SELECT id, full_name, 0 AS level\n    FROM staff\n    WHERE manager_id IS NULL\n  UNION ALL\n    -- шаг: подчинённые тех, кто уже в дереве\n    SELECT \n)\nSELECT id, full_name, level FROM tree ORDER BY level, id",
            solution: `WITH RECURSIVE tree AS (
    SELECT id, full_name, 0 AS level
    FROM staff
    WHERE manager_id IS NULL
  UNION ALL
    SELECT s.id, s.full_name, t.level + 1
    FROM staff s
    JOIN tree t ON s.manager_id = t.id
)
SELECT id, full_name, level FROM tree ORDER BY level, id`,
            ordered: true,
            names: true,
            expectRows: 12,
            expectCols: 3,
            hints: [
                "В шаге соедините staff с самим деревом: руководитель сотрудника должен быть уже в tree.",
                "Условие соединения: s.manager_id = t.id. Уровень на единицу больше: t.level + 1.",
                "SELECT s.id, s.full_name, t.level + 1 FROM staff s JOIN tree t ON s.manager_id = t.id"
            ],
            afterwards: `
Двенадцать человек на четырёх уровнях. Рекурсивный CTE нужен тогда, когда глубина не известна заранее. Если уровней всегда ровно два, достаточно обычного соединения таблицы с собой.
`
        },
        cheat: [["WITH RECURSIVE t AS (основа UNION ALL шаг)", "обход иерархии, пока шаг находит строки"]]
    }
];
