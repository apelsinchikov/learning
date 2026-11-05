/* Глава 5. Индексы и итог. */

import { columnIssues, expectInsertOk, expectInsertRejected, result, same, tableOf } from "./verify.js";

const INDEX_PLAN = /Index Scan|Index Only Scan|Bitmap Index Scan/;

/* Журнал событий: 20 000 строк, чтобы планировщик действительно выбирал между чтением всей таблицы и индексом. */
const AUDIT_BEFORE = `
CREATE TABLE audit_log (
    id integer PRIMARY KEY,
    guest_id integer NOT NULL,
    action text NOT NULL,
    created_at timestamp NOT NULL
);
INSERT INTO audit_log
SELECT n,
       (n % 5000) + 1,
       CASE n % 3 WHEN 0 THEN 'login' WHEN 1 THEN 'view' ELSE 'book' END,
       TIMESTAMP '2025-11-01 00:00:00' + n * INTERVAL '10 minutes'
FROM generate_series(1, 20000) AS n;
ANALYZE audit_log;
`;

const planText = run => (run.probes?.[1]?.rows || []).map(row => row[0]).join("\n");

export const chapter5 = [
    {
        id: "sqa-index",
        title: "Индекс по требованию",
        summary: "EXPLAIN: как увидеть, что запрос читает всю таблицу, и ускорить его индексом.",
        story: `
Метод \`GET /guests/{id}/events\` отвечает всё медленнее: журнал событий \`audit_log\` вырос до 20 тысяч строк, а гость ищет свои события по \`guest_id\`. Тимур спрашивает: «Что добавить в базу?» Вы отвечаете: «Индекс. Но сначала покажу, что без него».
`,
        before: AUDIT_BEFORE,
        refs: [["sql", "sql-where", "WHERE"]],
        theory: [
            {
                type: "why",
                title: "просить индекс осознанно",
                text: `
Индекс ускоряет чтение по колонке, но замедляет запись и занимает место. Поэтому его добавляют по требованию: когда известен запрос, который будет частым и медленным. Аналитик должен уметь показать это на плане запроса, а не просто попросить «добавить индекс на всякий случай».
`
            },
            {
                type: "text",
                text: `
Индекс — отсортированный список значений колонки со ссылками на строки, как предметный указатель в книге. Вместо чтения всей таблицы база находит нужное место в указателе.

Команда \`EXPLAIN запрос\` не выполняет запрос, а показывает **план**: как база собирается его выполнять. Нам важны два узла:

- \`Seq Scan\` — чтение всей таблицы подряд;
- \`Index Scan\` (а также \`Index Only Scan\` и \`Bitmap Index Scan\`) — поиск по индексу.

Цифры стоимости (\`cost=...\`) сейчас разбирать не нужно.
`
            },
            {
                type: "example",
                sql: "EXPLAIN SELECT * FROM audit_log WHERE guest_id = 4242;",
                note: "Индекса по guest_id нет, поэтому план говорит Seq Scan: база читает все 20 000 строк."
            },
            {
                type: "example",
                sql: "CREATE INDEX idx_audit_guest ON audit_log (guest_id);\nEXPLAIN SELECT * FROM audit_log WHERE guest_id = 4242;",
                note: "После создания индекса план сменился: теперь поиск идёт по индексу."
            },
            {
                type: "text",
                text: `
Индекс можно собрать из нескольких колонок. **Порядок колонок важен**: индекс по \`(guest_id, created_at)\` помогает запросам, где есть условие на \`guest_id\` (и дальше на \`created_at\`), но почти не помогает запросу, в котором есть только \`created_at\`. Правило: сначала колонки, по которым ищут точное значение, затем колонки диапазона или сортировки.
`
            },
            {
                type: "example",
                sql: "CREATE INDEX idx_audit_guest_time ON audit_log (guest_id, created_at);\nEXPLAIN SELECT * FROM audit_log WHERE guest_id = 4242 ORDER BY created_at DESC LIMIT 10;",
                note: "Индекс из двух колонок отдаёт события гостя уже в нужном порядке."
            },
            {
                type: "trap",
                text: `
Индекс не бесплатен: каждая вставка обновляет и таблицу, и все индексы. Индекс на колонке с двумя-тремя разными значениями (например, \`action\`) почти бесполезен: база всё равно прочитает значительную часть таблицы и выберет \`Seq Scan\`. На маленькой таблице индекс тоже не нужен: прочитать её целиком быстрее. Поэтому в описании пишут: какой запрос, как часто и сколько строк в таблице.
`
            }
        ],
        task: {
            kind: "plan",
            prompt: `
Сначала запустите запрос как есть (кнопка «Выполнить») и посмотрите план: там \`Seq Scan\`. Затем в том же запуске создайте индекс по колонке, которая стоит в условии, и снова выполните \`EXPLAIN\`. Проверка засчитает задачу, когда планировщик использует индекс.
`,
            starter: "EXPLAIN SELECT * FROM audit_log WHERE guest_id = 4242;",
            solution: `CREATE INDEX idx_audit_guest ON audit_log (guest_id);
EXPLAIN SELECT * FROM audit_log WHERE guest_id = 4242;`,
            wrong: `CREATE INDEX idx_audit_action ON audit_log (action);
EXPLAIN SELECT * FROM audit_log WHERE guest_id = 4242;`,
            probes: ["ANALYZE audit_log", "EXPLAIN SELECT * FROM audit_log WHERE guest_id = 4242"],
            verify(run) {
                const plan = planText(run);

                if (!plan) {
                    return result(["Не удалось получить план запроса. Проверьте, что таблица audit_log на месте."]);
                }

                if (!INDEX_PLAN.test(plan)) {
                    return result([
                        "Планировщик по-прежнему читает всю таблицу (Seq Scan). Создайте индекс по колонке, которая стоит в условии WHERE, и запустите проверку ещё раз."
                    ]);
                }

                return result([]);
            },
            hints: [
                "Условие запроса — guest_id = 4242. Индекс нужен по той колонке, по которой ищут.",
                "Индекс создаёт команда CREATE INDEX имя ON таблица (колонка);",
                "CREATE INDEX idx_audit_guest ON audit_log (guest_id); EXPLAIN SELECT * FROM audit_log WHERE guest_id = 4242;"
            ],
            afterwards: `
Проверка пересобрала статистику (\`ANALYZE\`) и снова показала план: теперь в нём индекс. В описании требования к индексу запишите три вещи: какой запрос ускоряем, как часто он выполняется и размер таблицы. По ним разработчик решит, нужен ли индекс.
`
        },
        cheat: [
            ["EXPLAIN запрос", "показать план, не выполняя запрос"],
            ["Seq Scan / Index Scan", "чтение всей таблицы / поиск по индексу"],
            ["CREATE INDEX имя ON t (a, b)", "индекс; порядок колонок важен"]
        ]
    },

    {
        id: "sqa-case-module",
        title: "Кейс: новый модуль",
        summary: "От требований к таблицам, ограничениям и представлению.",
        story: `
Владелица запускает программу лояльности. Вот что она написала:

1. У гостя может быть **не больше одного** счёта лояльности. У счёта есть уровень: \`basic\` (по умолчанию), \`silver\` или \`gold\`.
2. По счёту идут **операции**: начисление (плюс) и списание (минус) баллов. Ноль писать нельзя. У операции есть причина (текст), а время ставится само.
3. Нужен баланс гостя: сумма всех его операций.

Тимур просит: «Опиши схему, чтобы база сама следила за правилами».
`,
        refs: [
            ["diagrams", "dg-er-review", "Проверка ER"],
            ["sql", "sql-group-by", "GROUP BY"]
        ],
        theory: [
            {
                type: "why",
                title: "идти от требований к схеме по шагам",
                text: `
Новый модуль проектируют одним и тем же порядком: найти сущности, определить связи, перевести правила в ограничения, а затем описать, как читать данные. Если пройти этот путь по списку, ничего не теряется.
`
            },
            {
                type: "text",
                text: `
Разберём требования владелицы по шагам:

1. **Сущности.** Счёт лояльности и операция по счёту. Гость уже есть в [[table:guests]].
2. **Связи.** Один гость — не больше одного счёта. Значит, идентификатор счёта может совпадать с идентификатором гостя: \`guest_id\` одновременно первичный ключ и ссылка на \`guests\`. Одна операция относится к одному счёту, а у счёта много операций.
3. **Ограничения.** Уровень из трёх значений: \`CHECK\`. Баллы не равны нулю: \`CHECK\`. Время ставится само: \`DEFAULT\`. Идентификатор операции: \`uuid\` со значением по умолчанию.
4. **Чтение.** Баланс — сумма баллов по гостю. Его удобно отдать представлением.
`
            },
            {
                type: "example",
                sql: "CREATE TABLE demo_account (\n    guest_id integer PRIMARY KEY REFERENCES guests (id),\n    level text NOT NULL DEFAULT 'basic'\n);\nINSERT INTO demo_account (guest_id) VALUES (1);\nSELECT * FROM demo_account;",
                note: "Приём «первичный ключ — это и ссылка»: у гостя не может быть двух счётов."
            },
            {
                type: "trap",
                text: `
Баланс не нужно хранить отдельной колонкой в счёте: рано или поздно она разойдётся с суммой операций. Храните операции, а баланс считайте запросом или представлением. Если баланс читают очень часто и это тормозит, тогда разговор о материализованном представлении.
`
            }
        ],
        task: {
            kind: "script",
            prompt: `
Опишите схему целиком одним запуском:

- таблица \`loyalty_accounts\`: \`guest_id\` — целое, первичный ключ и ссылка на \`guests(id)\`; \`level\` — текст, обязательный, по умолчанию \`'basic'\`, допустимы \`basic\`, \`silver\`, \`gold\`;
- таблица \`loyalty_ops\`: \`id\` — \`uuid\`, первичный ключ, создаётся сам; \`guest_id\` — целое, обязательное, ссылка на \`loyalty_accounts(guest_id)\`; \`points\` — целое, обязательное, не ноль; \`reason\` — текст, обязательный; \`created_at\` — дата и время, обязательное, по умолчанию сейчас;
- представление \`v_loyalty_balance\`: \`guest_id\` и \`balance\` (сумма \`points\` по гостю).
`,
            starter:
                "CREATE TABLE loyalty_accounts (\n    guest_id integer PRIMARY KEY REFERENCES guests (id),\n    level text NOT NULL DEFAULT 'basic'\n);\n",
            solution: `CREATE TABLE loyalty_accounts (
    guest_id integer PRIMARY KEY REFERENCES guests (id),
    level text NOT NULL DEFAULT 'basic' CHECK (level IN ('basic', 'silver', 'gold'))
);

CREATE TABLE loyalty_ops (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id integer NOT NULL REFERENCES loyalty_accounts (guest_id),
    points integer NOT NULL CHECK (points <> 0),
    reason text NOT NULL,
    created_at timestamp NOT NULL DEFAULT now()
);

CREATE VIEW v_loyalty_balance AS
SELECT guest_id, sum(points) AS balance
FROM loyalty_ops
GROUP BY guest_id;`,
            wrong: `CREATE TABLE loyalty_accounts (
    guest_id integer PRIMARY KEY REFERENCES guests (id),
    level text NOT NULL DEFAULT 'basic' CHECK (level IN ('basic', 'silver', 'gold'))
);

CREATE TABLE loyalty_ops (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id integer NOT NULL REFERENCES loyalty_accounts (guest_id),
    points integer NOT NULL,
    reason text NOT NULL,
    created_at timestamp NOT NULL DEFAULT now()
);

CREATE VIEW v_loyalty_balance AS
SELECT guest_id, sum(points) AS balance
FROM loyalty_ops
GROUP BY guest_id;`,
            probes: [
                "INSERT INTO loyalty_accounts (guest_id) VALUES (1)",
                "INSERT INTO loyalty_accounts (guest_id) VALUES (1)",
                "INSERT INTO loyalty_accounts (guest_id, level) VALUES (2, 'platinum')",
                "INSERT INTO loyalty_accounts (guest_id) VALUES (999999)",
                "INSERT INTO loyalty_ops (guest_id, points, reason) VALUES (1, 100, 'бронь')",
                "INSERT INTO loyalty_ops (guest_id, points, reason) VALUES (1, -30, 'списание')",
                "INSERT INTO loyalty_ops (guest_id, points, reason) VALUES (1, 0, 'ноль')",
                "INSERT INTO loyalty_ops (guest_id, points, reason) VALUES (3, 10, 'нет счёта')",
                "SELECT guest_id, balance FROM v_loyalty_balance ORDER BY guest_id"
            ],
            verify(run) {
                const accounts = tableOf(run, "loyalty_accounts");
                const ops = tableOf(run, "loyalty_ops");
                const view = tableOf(run, "v_loyalty_balance");
                const issues = [];

                if (!accounts) {
                    issues.push("Таблица loyalty_accounts не найдена.");
                }

                if (!ops) {
                    issues.push("Таблица loyalty_ops не найдена.");
                }

                if (!view || view.kind !== "view") {
                    issues.push("Представление v_loyalty_balance не найдено: создайте его командой CREATE VIEW.");
                }

                if (issues.length > 0) {
                    return result(issues);
                }

                if (!same(accounts.primaryKey, ["guest_id"]) || !accounts.foreignKeys.some(item => item.refTable === "guests")) {
                    issues.push("loyalty_accounts.guest_id должен быть и первичным ключом, и ссылкой на guests(id).");
                }

                issues.push(
                    ...columnIssues(ops, { name: "id", type: /^uuid$/, hasDefault: true }),
                    ...columnIssues(ops, { name: "created_at", type: /^timestamp/, nullable: false, hasDefault: true }),
                    ...columnIssues(ops, { name: "reason", nullable: false })
                );

                if (issues.length > 0) {
                    return result(issues);
                }

                expectInsertOk(run, 0, "счёт для гостя 1", issues);
                expectInsertRejected(run, 1, "23505", "второй счёт у того же гостя", issues);
                expectInsertRejected(run, 2, "23514", "уровень «platinum»", issues);
                expectInsertRejected(run, 3, "23503", "счёт для несуществующего гостя", issues);
                expectInsertOk(run, 4, "начисление 100 баллов", issues);
                expectInsertOk(run, 5, "списание 30 баллов", issues);
                expectInsertRejected(run, 6, "23514", "операция на 0 баллов", issues);
                expectInsertRejected(run, 7, "23503", "операция по несуществующему счёту", issues);

                const balance = run.probes?.[8];

                if (!balance?.ok || balance.rows.length !== 1 || Number(balance.rows[0][0]) !== 1 || Number(balance.rows[0][1]) !== 70) {
                    issues.push("Баланс в представлении v_loyalty_balance должен считаться как сумма баллов: после +100 и −30 у гостя 1 должно быть 70.");
                }

                return result(issues);
            },
            hints: [
                "Три объекта: две таблицы и представление. Ограничения: CHECK на уровень, CHECK на баллы, PRIMARY KEY + REFERENCES на guest_id в счёте.",
                "Один счёт на гостя: сделайте guest_id первичным ключом счёта. У операции id — uuid с DEFAULT gen_random_uuid(). Баланс: sum(points) с GROUP BY guest_id.",
                "level text NOT NULL DEFAULT 'basic' CHECK (level IN ('basic', 'silver', 'gold')); points integer NOT NULL CHECK (points <> 0); CREATE VIEW v_loyalty_balance AS SELECT guest_id, sum(points) AS balance FROM loyalty_ops GROUP BY guest_id;"
            ],
            afterwards: `
Каждое требование владелицы превратилось в конкретное правило базы: «не больше одного» — первичный ключ, «ноль нельзя» — \`CHECK\`, «время само» — \`DEFAULT\`, «баланс» — представление. Если у вас получилось пройти этот путь без подсказок, вы готовы описывать схему нового модуля сами.
`
        },
        cheat: [
            ["сущности → таблицы", "что хранится в системе"],
            ["правила → ограничения", "PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK, NOT NULL, DEFAULT"],
            ["чтение → представление", "как отдавать готовые цифры"]
        ]
    },

    {
        id: "sqa-final",
        title: "Итоговый отчёт",
        summary: "Один запрос на пять таблиц: всё, что вы прошли.",
        story: `
Конец сезона. Владелица просит один отчёт по зимним месяцам: «По каждому типу номеров покажите, сколько было броней и разных гостей, сколько ночей, какая выручка по платежам и сколько мы заработали на дополнительных услугах. Берите заезды с 1 декабря 2025 по 28 февраля 2026 включительно, отменённые брони не учитывайте. Первыми покажите самые прибыльные типы».

Это итоговое задание: в нём есть и границы периода, и выручка с возвратами, и услуги, и защита от размножения строк.
`,
        refs: [
            ["sql", "sql-final", "Итог базового курса"],
            ["sql", "sql-subquery", "Подзапросы"]
        ],
        theory: [
            {
                type: "why",
                title: "собрать отчёт из проверенных частей",
                text: `
Сложный отчёт пишут слоями. Сначала по каждой «стороне» отчёта считают свой итог на уровне брони, потом соединяют итоги с бронью и группируют. Так таблицы не размножают строки друг друга.
`
            },
            {
                type: "text",
                text: `
План отчёта:

1. **Зерно:** одна неотменённая бронь с заездом в нужные даты.
2. **Измерение:** тип номера (\`rooms.kind\`).
3. **Показатели:** число броней, число разных гостей, ночи, выручка по платежам, выручка по услугам.
4. **Слои.** Платежи (\`payments\`) сводим к одной строке на бронь. Услуги (\`booking_services\` и \`services\`) тоже. Иначе платежи и услуги размножат друг друга.
5. **Период:** \`check_in >= '2025-12-01' AND check_in < '2026-03-01'\`.
6. **Порядок:** по выручке по убыванию.
`
            },
            {
                type: "example",
                sql: "SELECT bs.booking_id, sum(bs.quantity * s.price) AS services_revenue\nFROM booking_services bs\nJOIN services s ON s.id = bs.service_id\nGROUP BY bs.booking_id\nORDER BY bs.booking_id\nLIMIT 5;",
                note: "Один слой: услуги, сведённые к одной строке на бронь."
            },
            {
                type: "trap",
                text: `
Проверяйте итог на глаз: число броней в отчёте не должно превышать число подходящих броней в таблице. Если вышло больше, где-то строки размножились. Ещё проверьте границу: заезд 28 февраля должен попасть в период, а 1 марта нет.
`
            }
        ],
        task: {
            kind: "query",
            prompt: `
Постройте отчёт. Колонки: \`room_kind\`, \`bookings\` (число броней), \`guests\` (число разных гостей), \`nights\` (число ночей), \`revenue\` (оплаты минус возвраты) и \`services_revenue\` (количество услуги × цена по всем услугам брони). Период заезда: с 1 декабря 2025 по 28 февраля 2026 включительно. Отменённые брони не берите. Порядок по \`revenue\` по убыванию.
`,
            starter:
                "SELECT r.kind AS room_kind, count(*) AS bookings\nFROM bookings b\nJOIN rooms r ON r.id = b.room_id\nWHERE b.status <> 'cancelled'\nGROUP BY r.kind\nORDER BY bookings DESC",
            solution: `WITH pay AS (
    SELECT booking_id,
           sum(CASE WHEN status = 'paid' THEN amount ELSE -amount END) AS revenue
    FROM payments
    GROUP BY booking_id
),
svc AS (
    SELECT bs.booking_id, sum(bs.quantity * s.price) AS services_revenue
    FROM booking_services bs
    JOIN services s ON s.id = bs.service_id
    GROUP BY bs.booking_id
)
SELECT r.kind AS room_kind,
       count(*) AS bookings,
       count(DISTINCT b.guest_id) AS guests,
       sum(b.check_out - b.check_in) AS nights,
       COALESCE(sum(p.revenue), 0) AS revenue,
       COALESCE(sum(sv.services_revenue), 0) AS services_revenue
FROM bookings b
JOIN rooms r ON r.id = b.room_id
LEFT JOIN pay p ON p.booking_id = b.id
LEFT JOIN svc sv ON sv.booking_id = b.id
WHERE b.status <> 'cancelled'
  AND b.check_in >= DATE '2025-12-01'
  AND b.check_in < DATE '2026-03-01'
GROUP BY r.kind
ORDER BY revenue DESC`,
            ordered: true,
            names: true,
            expectRows: 3,
            expectCols: 6,
            hints: [
                "Платежи и услуги сначала сведите к одной строке на бронь в двух WITH-слоях, и только потом соединяйте с бронями.",
                "Период: b.check_in >= DATE '2025-12-01' AND b.check_in < DATE '2026-03-01'. Слои присоединяйте через LEFT JOIN: у части броней нет платежей или услуг. Пустое значение заменяет COALESCE.",
                "WITH pay AS (...), svc AS (...) SELECT r.kind AS room_kind, count(*) AS bookings, count(DISTINCT b.guest_id) AS guests, sum(b.check_out - b.check_in) AS nights, COALESCE(sum(p.revenue), 0) AS revenue, COALESCE(sum(sv.services_revenue), 0) AS services_revenue FROM bookings b JOIN rooms r ... LEFT JOIN pay p ... LEFT JOIN svc sv ... WHERE ... GROUP BY r.kind ORDER BY revenue DESC"
            ],
            afterwards: `
В этом запросе собран весь курс: границы периода, \`WITH\`, \`LEFT JOIN\` и \`COALESCE\`, выручка с возвратами и защита от размножения строк. Такой запрос и описание к нему — рабочий результат аналитика. Теперь можно потренироваться в песочнице на своих вопросах.
`
        },
        cheat: [
            ["слои в WITH", "свести каждую сторону отчёта к одной строке на бронь"],
            ["LEFT JOIN + COALESCE", "не терять брони без платежей и услуг"],
            ["период: >= начало AND < следующее", "честные границы"]
        ]
    }
];
