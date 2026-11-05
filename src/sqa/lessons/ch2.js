/* Глава 2. Отчёты и параметры метода: NULL, группировки, даты, фильтры, страницы. */

export const chapter2 = [
    {
        id: "sqa-null-traps",
        title: "Что значит «пусто»",
        summary: "NULL, COALESCE и счёт строк, когда значения нет.",
        story: `
Тимур спрашивает: «Что приходит в поле \`phone\`, если у гостя нет телефона? И как посчитать, у скольких гостей он есть?» Менеджер хочет обзвонить гостей по городам и просит цифры.

В базе пустое значение хранится как \`NULL\`. Это место, где чаще всего расходятся требования и запросы.
`,
        refs: [["sql", "sql-null", "NULL в условиях"]],
        theory: [
            {
                type: "why",
                title: "различать виды «пусто»",
                text: `
В требованиях «пусто» может значить три разных вещи: значение не заполнено, не применимо или это пустая строка. В базе первые два случая обычно \`NULL\`. Аналитик должен уточнить, что имеется в виду, и записать это в описании метода: поле необязательное, возвращаем \`null\` или значение по умолчанию.
`
            },
            {
                type: "text",
                text: `
\`NULL\` означает «значения нет». Это не ноль и не пустая строка. Любое сравнение с \`NULL\` даёт не «да» и не «нет», а «неизвестно», и \`WHERE\` такие строки отбрасывает. Поэтому проверка делается особым оператором: \`IS NULL\` или \`IS NOT NULL\`. Запись \`phone = NULL\` не найдёт ничего.
`
            },
            {
                type: "example",
                sql: "SELECT id, full_name, phone\nFROM guests\nWHERE phone IS NULL\nORDER BY id\nLIMIT 5;",
                note: "Гости без телефона. В колонке phone пусто."
            },
            {
                type: "text",
                text: `
Функция \`COALESCE(a, b, ...)\` возвращает первое значение, которое не \`NULL\`. Так задают значение по умолчанию для ответа метода: «телефон или текст "не указан"».
`
            },
            {
                type: "example",
                sql: "SELECT id, full_name, COALESCE(phone, 'не указан') AS phone\nFROM guests\nORDER BY id\nLIMIT 5;",
                note: "Пустой телефон заменён текстом. Сама таблица не изменилась."
            },
            {
                type: "text",
                text: `
Агрегаты тоже обходят \`NULL\`. \`count(*)\` считает строки, а \`count(колонка)\` считает только строки, где в колонке есть значение.
`
            },
            {
                type: "example",
                sql: "SELECT count(*) AS guests, count(phone) AS with_phone\nFROM guests;",
                note: "Всего гостей и гостей с телефоном. Разница и есть гости без телефона."
            },
            {
                type: "trap",
                text: `
Условие \`phone <> ''\` тоже пропускает \`NULL\`: гости без телефона не попадут ни в \`phone = ''\`, ни в \`phone <> ''\`. Если нужны «все, у кого телефон не пустой», пишите явно: \`phone IS NOT NULL\`. Особенно коварен \`NOT IN\`: если в подзапросе есть хоть один \`NULL\`, результат пустой. Для таких задач берите \`NOT EXISTS\`.
`
            }
        ],
        task: {
            kind: "query",
            prompt: `
Подготовьте цифры для обзвона. Для каждого города: \`city\`, \`guests\` (всего гостей), \`with_phone\` (у скольких указан телефон) и \`without_phone\` (у скольких телефона нет). Порядок по названию города.
`,
            starter: "SELECT city, count(*) AS guests\nFROM guests\nGROUP BY city\nORDER BY city",
            solution: `SELECT city,
       count(*) AS guests,
       count(phone) AS with_phone,
       count(*) - count(phone) AS without_phone
FROM guests
GROUP BY city
ORDER BY city`,
            ordered: true,
            names: true,
            expectRows: 8,
            expectCols: 4,
            hints: [
                "Группируем по городу. Для «у скольких указан телефон» нужен не count(*), а count по колонке.",
                "count(phone) считает только строки, где телефон есть. Тогда «без телефона» — это разница с count(*).",
                "SELECT city, count(*) AS guests, count(phone) AS with_phone, count(*) - count(phone) AS without_phone FROM guests GROUP BY city ORDER BY city"
            ],
            afterwards: `
Две цифры, которые различаются на один символ в запросе: \`count(*)\` и \`count(phone)\`. В отчёте их разница — это пустые значения. Если вы пишете требование «посчитать гостей», уточните, считать всех или только тех, у кого поле заполнено.
`
        },
        cheat: [
            ["x IS NULL / IS NOT NULL", "проверка на «значения нет»"],
            ["COALESCE(a, b)", "первое значение, которое не NULL"],
            ["count(*) и count(x)", "все строки и только строки со значением"]
        ]
    },

    {
        id: "sqa-report",
        title: "Требование → запрос",
        summary: "Отчёт по требованию: что считаем, в разрезе чего, какие строки.",
        story: `
Владелица пишет: «Хочу понять, откуда приходит выручка: с сайта, по телефону или от агентств. Платежи и возвраты считайте отдельно, а итог — оплаты минус возвраты. Покажите источники, которые принесли больше миллиона».

Это требование на человеческом языке. Ваша работа — разложить его и передать разработчику готовый запрос.
`,
        refs: [
            ["sql", "sql-group-by", "GROUP BY"],
            ["sql", "sql-having", "HAVING"]
        ],
        theory: [
            {
                type: "why",
                title: "раскладывать требование на части",
                text: `
Любой отчёт собирается из пяти ответов: что считаем, в разрезе чего, какие строки берём, какие группы оставляем и в каком порядке показываем. Если на каждый вопрос есть ответ, запрос пишется почти механически. Если ответа нет, это вопрос к заказчику, а не к базе.
`
            },
            {
                type: "text",
                text: `
Разложим требование владелицы:

- **Что считаем:** число платежей, число возвратов, итог.
- **В разрезе чего:** источник брони, то есть \`bookings.source\`.
- **Какие строки:** все платежи. Связь с источником идёт через [[table:bookings]].
- **Какие группы:** где итог больше миллиона. Условие на сумму группы пишется в \`HAVING\`.
- **Порядок:** по итогу, от большего к меньшему.
`
            },
            {
                type: "example",
                sql: "SELECT b.source, count(*) AS payments, sum(p.amount) AS total\nFROM payments p\nJOIN bookings b ON b.id = p.booking_id\nGROUP BY b.source\nORDER BY total DESC;",
                note: "Количество и сумма по источникам. Платежи и возвраты пока в одной куче."
            },
            {
                type: "text",
                text: `
Чтобы считать платежи и возвраты отдельно, внутри агрегата ставят условие. В Postgres для этого есть \`FILTER\`: \`count(*) FILTER (WHERE p.status = 'refunded')\`. Для суммы с разным знаком подходит \`CASE\`: оплата со знаком плюс, возврат со знаком минус.
`
            },
            {
                type: "example",
                sql: "SELECT b.source,\n       count(*) FILTER (WHERE p.status = 'paid') AS paid_count,\n       count(*) FILTER (WHERE p.status = 'refunded') AS refund_count\nFROM payments p\nJOIN bookings b ON b.id = p.booking_id\nGROUP BY b.source\nORDER BY b.source;",
                note: "Два счётчика в одном запросе, каждый со своим условием."
            },
            {
                type: "trap",
                text: `
Самая дорогая ошибка отчётов: соединить лишнюю таблицу и посчитать суммы дважды. У одной брони может быть несколько услуг в [[table:booking_services]]. Если соединить платежи с услугами, каждый платёж повторится столько раз, сколько услуг в брони, и выручка раздуется. Прежде чем что-то соединять, спросите: «одна строка в результате — это один платёж?»
`
            },
            {
                type: "example",
                sql: "SELECT sum(p.amount) AS wrong_total\nFROM payments p\nJOIN booking_services bs ON bs.booking_id = p.booking_id\nWHERE p.status = 'paid';",
                note: "Неверно: платежи размножены по услугам. Сравните с общей суммой оплат из предыдущих примеров."
            }
        ],
        task: {
            kind: "query",
            prompt: `
Постройте отчёт для владелицы. Колонки: \`source\`, \`paid_count\` (число платежей со статусом \`paid\`), \`refund_count\` (число платежей со статусом \`refunded\`), \`revenue\` (оплаты минус возвраты). Оставьте источники, у которых \`revenue\` больше 1 500 000. Порядок по \`revenue\` по убыванию.
`,
            starter:
                "SELECT b.source,\n       count(*) FILTER (WHERE p.status = 'paid') AS paid_count\nFROM payments p\nJOIN bookings b ON b.id = p.booking_id\nGROUP BY b.source",
            solution: `SELECT b.source,
       count(*) FILTER (WHERE p.status = 'paid') AS paid_count,
       count(*) FILTER (WHERE p.status = 'refunded') AS refund_count,
       sum(CASE WHEN p.status = 'paid' THEN p.amount ELSE -p.amount END) AS revenue
FROM payments p
JOIN bookings b ON b.id = p.booking_id
GROUP BY b.source
HAVING sum(CASE WHEN p.status = 'paid' THEN p.amount ELSE -p.amount END) > 1500000
ORDER BY revenue DESC`,
            ordered: true,
            names: true,
            expectRows: 2,
            expectCols: 4,
            hints: [
                "Источник лежит в bookings, суммы в payments: нужен JOIN по booking_id. Группируем по источнику.",
                "Итог считается суммой со знаком: оплата плюс, возврат минус. Условие на итог группы пишется в HAVING.",
                "sum(CASE WHEN p.status = 'paid' THEN p.amount ELSE -p.amount END) AS revenue ... HAVING sum(CASE WHEN ... END) > 1500000 ORDER BY revenue DESC"
            ],
            afterwards: `
Условие на итог группы стоит в \`HAVING\`: \`WHERE\` работает до группировки и суммы ещё не знает. В описании метода или отчёта записывайте все пять частей: что считаем, в разрезе чего, какие строки, какие группы, порядок. Так разработчик не будет гадать.
`
        },
        cheat: [
            ["count(*) FILTER (WHERE …)", "посчитать только строки с условием"],
            ["sum(CASE WHEN … THEN a ELSE -a END)", "сумма со знаком"],
            ["HAVING", "условие на группу после подсчёта"]
        ]
    },

    {
        id: "sqa-dates",
        title: "Даты и периоды",
        summary: "date_trunc, интервалы и честные границы периода.",
        story: `
Владелица просит ещё один отчёт: «Сколько броней заезжает каждый месяц и на сколько ночей в среднем?» А бухгалтерия уточняет: «Платежи за январь» — это до 31 января включительно?

Даты в требованиях всегда нужно уточнять. Сначала узнаем, как с ними работает база.
`,
        refs: [["sql", "sql-alias", "Вычисления в SELECT"]],
        theory: [
            {
                type: "why",
                title: "договариваться о границах периода",
                text: `
«За январь», «за последние 30 дней», «по неделям» легко понять по-разному. В описании метода должны быть написаны точные границы: с какой даты включительно и по какую не включая. От этого зависят цифры в отчёте.
`
            },
            {
                type: "text",
                text: `
Три вещи, которые нужны чаще всего:

- \`date_trunc('month', дата)\` — первое число месяца, к которому относится дата. Подходит, чтобы группировать по месяцам.
- Арифметика: \`дата + 7\` — ровно на семь дней вперёд, \`дата - INTERVAL '1 month'\` — на месяц назад.
- \`extract(month FROM дата)\` — число из даты: месяц, год, день недели.
`
            },
            {
                type: "example",
                sql: "SELECT DATE '2026-02-15' + 7 AS next_week,\n       date_trunc('month', DATE '2026-02-15')::date AS month_start,\n       extract(month FROM DATE '2026-02-15') AS month_number;",
                note: "Три операции над одной датой."
            },
            {
                type: "text",
                text: `
В учебной базе «сегодня» — 15 февраля 2026 года. Вместо \`current_date\` пишите \`DATE '2026-02-15'\`, тогда результат не зависит от дня, когда вы открыли урок.
`
            },
            {
                type: "trap",
                text: `
Ловушка с \`BETWEEN\`. У колонки \`created_at\` тип \`timestamp\`: дата и время. Запись \`BETWEEN '2026-01-01' AND '2026-01-31'\` означает «до 31 января 00:00», и всё, что случилось 31 января днём, потеряется. Надёжная запись периода: **с начала включительно, до начала следующего не включая**: \`>= '2026-01-01' AND < '2026-02-01'\`.
`
            },
            {
                type: "example",
                sql: "SELECT\n    (SELECT count(*) FROM bookings WHERE created_at BETWEEN '2026-01-01' AND '2026-01-31') AS with_between,\n    (SELECT count(*) FROM bookings WHERE created_at >= '2026-01-01' AND created_at < '2026-02-01') AS correct;",
                note: "Две записи «января». Разница — брони, созданные 31 января."
            }
        ],
        task: {
            kind: "query",
            prompt: `
Постройте отчёт по месяцам заезда. Не берите отменённые брони. Колонки: \`month\` (первое число месяца, тип дата), \`bookings\` (число броней) и \`avg_nights\` (средняя длительность в ночах, округлите до одного знака). Порядок по месяцу.
`,
            starter: "SELECT date_trunc('month', check_in)::date AS month, count(*) AS bookings\nFROM bookings\nGROUP BY 1\nORDER BY 1",
            solution: `SELECT date_trunc('month', check_in)::date AS month,
       count(*) AS bookings,
       round(avg(check_out - check_in), 1) AS avg_nights
FROM bookings
WHERE status <> 'cancelled'
GROUP BY 1
ORDER BY 1`,
            ordered: true,
            names: true,
            expectRows: 6,
            expectCols: 3,
            hints: [
                "Группируем по первому числу месяца заезда: date_trunc('month', check_in). Отменённые убираем в WHERE.",
                "Ночей в брони: check_out - check_in. Среднее по группе: avg(...), округление: round(..., 1).",
                "SELECT date_trunc('month', check_in)::date AS month, count(*) AS bookings, round(avg(check_out - check_in), 1) AS avg_nights FROM bookings WHERE status <> 'cancelled' GROUP BY 1 ORDER BY 1"
            ],
            afterwards: `
Группировка по \`date_trunc\` даёт месяцы в правильном порядке и с понятной датой. Для периода «с даты по дату» записывайте границы парой: начало включительно и начало следующего периода не включая.
`
        },
        cheat: [
            ["date_trunc('month', d)", "первое число месяца"],
            ["d + 7, d - INTERVAL '1 month'", "сдвиг даты"],
            ["x >= начало AND x < следующее", "честные границы периода"]
        ]
    },

    {
        id: "sqa-filters",
        title: "Необязательные фильтры",
        summary: "Параметры метода: пустой параметр не должен фильтровать.",
        story: `
Тимур описывает метод \`GET /bookings\` с четырьмя необязательными параметрами: \`date_from\`, \`date_to\`, \`status\` и \`q\` (часть имени гостя). Клиент может передать любой набор. «Пишите один запрос на все случаи», — просит он.

Ваша задача: показать, как один запрос обслуживает любой набор параметров.
`,
        refs: [["sql", "sql-where", "WHERE"]],
        theory: [
            {
                type: "why",
                title: "описывать пустые параметры в методе",
                text: `
В описании метода у каждого параметра пишут: обязательный он или нет и что значит, если его не передали. Для фильтров правило одно: не передан — не фильтруем. Это правило легко записать прямо в SQL.
`
            },
            {
                type: "text",
                text: `
Приём «параметр или не задан»: для каждого параметра пишем условие в виде \`(параметр IS NULL OR колонка сравнивается с параметром)\`. Если параметр \`NULL\`, первая часть истинна, и условие ничего не отсекает.

Чтобы параметры были видны сразу, их выносят в первый шаг запроса, в CTE \`params\`. Разработчик заменит значения на подстановки.
`
            },
            {
                type: "example",
                sql: "WITH params AS (\n    SELECT NULL::text AS status, 'ова' AS q\n)\nSELECT b.id, g.full_name, b.status\nFROM bookings b\nJOIN guests g ON g.id = b.guest_id\nCROSS JOIN params p\nWHERE (p.status IS NULL OR b.status = p.status)\n  AND (p.q IS NULL OR g.full_name ILIKE '%' || p.q || '%')\nORDER BY b.id\nLIMIT 5;",
                note: "Статус не передан и не фильтрует. Имя содержит «ова»."
            },
            {
                type: "text",
                text: `
Поиск по части слова делает \`ILIKE\`: он не различает регистр. Символ \`%\` значит «любые символы». Склеивает шаблон оператор \`||\`.

Для верхней границы даты пользователь обычно имеет в виду «включая этот день». Поэтому условие пишут так: \`b.check_in < p.date_to + 1\`. К дате можно прибавить число дней.
`
            },
            {
                type: "trap",
                text: `
Если пользователь введёт в поиск символ \`%\` или \`_\`, он станет подстановочным знаком и поиск вернёт лишнее. В настоящем сервисе такой ввод экранируют. А сам запрос нельзя собирать склейкой строк из пользовательского ввода: вместо этого значения передают отдельными параметрами.
`
            }
        ],
        task: {
            kind: "query",
            prompt: `
Дополните условия. Параметры уже заданы: \`date_from\` — 10 января 2026, остальные не переданы, кроме \`q\` со значением «ова». Верните брони, у которых заезд не раньше \`date_from\`, а имя гостя содержит \`q\`. Условия на \`date_to\` и \`status\` тоже должны быть написаны так, чтобы пустой параметр ничего не отсекал. Колонки: \`id\`, \`full_name\`, \`check_in\`, \`status\`. Порядок по заезду, затем по номеру брони.
`,
            starter:
                "WITH params AS (\n    SELECT DATE '2026-01-10' AS date_from,\n           NULL::date AS date_to,\n           NULL::text AS status,\n           'ова' AS q\n)\nSELECT b.id, g.full_name, b.check_in, b.status\nFROM bookings b\nJOIN guests g ON g.id = b.guest_id\nCROSS JOIN params p\nWHERE TRUE\nORDER BY b.check_in, b.id",
            solution: `WITH params AS (
    SELECT DATE '2026-01-10' AS date_from,
           NULL::date AS date_to,
           NULL::text AS status,
           'ова' AS q
)
SELECT b.id, g.full_name, b.check_in, b.status
FROM bookings b
JOIN guests g ON g.id = b.guest_id
CROSS JOIN params p
WHERE (p.date_from IS NULL OR b.check_in >= p.date_from)
  AND (p.date_to IS NULL OR b.check_in < p.date_to + 1)
  AND (p.status IS NULL OR b.status = p.status)
  AND (p.q IS NULL OR g.full_name ILIKE '%' || p.q || '%')
ORDER BY b.check_in, b.id`,
            ordered: true,
            names: true,
            expectRows: 87,
            expectCols: 4,
            hints: [
                "Для каждого параметра своё условие в скобках: (p.параметр IS NULL OR ...). Скобки обязательны, иначе OR смешается с AND.",
                "Для имени: g.full_name ILIKE '%' || p.q || '%'. Для даты заезда: b.check_in >= p.date_from.",
                "WHERE (p.date_from IS NULL OR b.check_in >= p.date_from) AND (p.date_to IS NULL OR b.check_in < p.date_to + 1) AND (p.status IS NULL OR b.status = p.status) AND (p.q IS NULL OR g.full_name ILIKE '%' || p.q || '%')"
            ],
            afterwards: `
Один запрос обслуживает любой набор параметров, и в нём видно, как они связаны. В описании метода это можно записать таблицей: параметр, тип, обязательный ли, что делает, если не передан. Теперь у разработчика не останется вопросов.
`
        },
        cheat: [
            ["(p IS NULL OR col = p)", "необязательный параметр"],
            ["col ILIKE '%' || q || '%'", "поиск по части слова без учёта регистра"],
            ["d < date_to + 1", "включая весь последний день"]
        ]
    },

    {
        id: "sqa-paging",
        title: "Страницы и порядок",
        summary: "LIMIT и OFFSET, и почему порядок обязан быть однозначным.",
        story: `
Метод \`GET /bookings\` возвращает сотни броней, а мобильному приложению нужна страница по десять штук. Тимур спрашивает: «Как просить следующую страницу и что делать, если у нескольких броней одинаковая дата?»
`,
        refs: [["sql", "sql-order-by", "ORDER BY"]],
        theory: [
            {
                type: "why",
                title: "описать страницы в методе",
                text: `
В описании метода со списком всегда должны быть параметры страницы и правило порядка. Без них клиент получит то все данные сразу, то разный порядок при каждом запросе.
`
            },
            {
                type: "text",
                text: `
Страница задаётся двумя числами: \`LIMIT\` — сколько строк, \`OFFSET\` — сколько пропустить. Страница с номером \`n\` размером \`size\` пропускает \`(n - 1) * size\` строк. Для третьей страницы по десять: \`LIMIT 10 OFFSET 20\`.
`
            },
            {
                type: "example",
                sql: "SELECT id, check_in, status\nFROM bookings\nORDER BY check_in DESC, id DESC\nLIMIT 5 OFFSET 10;",
                note: "Третья страница по пять строк."
            },
            {
                type: "trap",
                text: `
Без однозначного порядка страницы ломаются. У многих броней одинаковая дата заезда, и база вправе выдавать их в любом порядке. Тогда одна и та же бронь может попасть на две страницы или не попасть ни на одну. Исправление простое: добавить в \`ORDER BY\` уникальную колонку, например \`id\`. Порядок «дата, затем id» всегда один и тот же.
`
            },
            {
                type: "text",
                text: `
Про общее число записей клиент спрашивает отдельно: это второй запрос \`SELECT count(*) ...\` с теми же условиями без \`LIMIT\`.

У \`OFFSET\` есть цена: на больших таблицах база всё равно прочитает пропущенные строки. Для длинных лент используют другой приём: клиент присылает последнее увиденное значение сортировки, а запрос берёт строки после него (\`WHERE (check_in, id) < (дата, номер)\`). Для учебной задачи хватит \`OFFSET\`.
`
            }
        ],
        task: {
            kind: "query",
            prompt: `
Верните третью страницу списка броней по десять штук. Колонки: \`id\`, \`check_in\`, \`status\`. Сначала самые поздние заезды. Порядок должен быть однозначным: при одинаковой дате — по номеру брони, тоже по убыванию.
`,
            starter: "SELECT id, check_in, status\nFROM bookings\nORDER BY check_in DESC\nLIMIT 10",
            solution: `SELECT id, check_in, status
FROM bookings
ORDER BY check_in DESC, id DESC
LIMIT 10 OFFSET 20`,
            ordered: true,
            names: true,
            expectRows: 10,
            expectCols: 3,
            hints: [
                "Третья страница: две первые страницы по десять строк нужно пропустить.",
                "Пропуск задаёт OFFSET. А чтобы порядок не плавал при одинаковой дате, добавьте в ORDER BY уникальную колонку.",
                "SELECT id, check_in, status FROM bookings ORDER BY check_in DESC, id DESC LIMIT 10 OFFSET 20"
            ],
            afterwards: `
В описании метода запишите: параметры \`page\` и \`size\`, правило порядка (\`check_in\` по убыванию, затем \`id\` по убыванию), максимальный размер страницы. Если размер страницы не ограничить, клиент однажды попросит миллион строк.
`
        },
        cheat: [
            ["LIMIT n OFFSET (page - 1) * n", "страница номер page"],
            ["ORDER BY дата, id", "уникальная колонка в конце делает порядок однозначным"]
        ]
    }
];
