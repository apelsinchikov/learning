/* Глава 3. Таблицы, представления и ключи: создаём структуры и смотрим, как их защищают ограничения. */

import { columnIssues, expectInsertOk, expectInsertRejected, probeValue, result, same, tableOf } from "./verify.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const chapter3 = [
    {
        id: "sqa-table-view",
        title: "Таблица и представление",
        summary: "Где лежат данные, а где сохранён запрос: VIEW и MATERIALIZED VIEW.",
        story: `
Тимур пишет бэкенд и жалуется: «Каждый раз для \`GET /bookings\` я склеиваю четыре таблицы. Нельзя ли получить готовую "таблицу" для метода?» Можно. Для этого есть представление.

Сначала разберёмся, чем оно отличается от таблицы.
`,
        refs: [["diagrams", "dg-er-entities", "Сущности в ER"]],
        theory: [
            {
                type: "why",
                title: "выбирать, где хранить и что сохранять",
                text: `
Когда вы описываете метод или отчёт, нужно решить: данные хранятся сами или считаются из других таблиц. От этого зависят скорость, свежесть данных и место на диске.
`
            },
            {
                type: "text",
                text: `
**Таблица** хранит данные. Каждая строка записана на диске.

**Представление** (\`VIEW\`) хранит только запрос. Данных в нём нет: при каждом обращении база выполняет запрос заново. Поэтому данные всегда свежие. Представление прячет сложные соединения и лишние колонки, а для метода выглядит как обычная таблица.

**Материализованное представление** (\`MATERIALIZED VIEW\`) хранит готовый результат запроса. Читать его быстро, но данные остаются такими, какими были при последнем обновлении (\`REFRESH MATERIALIZED VIEW\`).
`
            },
            {
                type: "example",
                sql: "CREATE VIEW v_services AS SELECT * FROM services;\nCREATE MATERIALIZED VIEW mv_services AS SELECT * FROM services;\nINSERT INTO services (id, title, price) VALUES (9, 'Кофе', 200);\nSELECT (SELECT count(*) FROM v_services) AS view_rows,\n       (SELECT count(*) FROM mv_services) AS matview_rows;",
                note: "После новой услуги представление видит 9 строк, а материализованное остаётся на 8. Запуск откатится сам."
            },
            {
                type: "trap",
                text: `
Обычное представление не ускоряет запрос: внутри него тот же самый запрос. Материализованное ускоряет чтение, но легко стать устаревшим, и кто-то должен его обновлять. Для описания метода запишите, какое из двух вам нужно и как часто данные должны обновляться.
`
            },
            {
                type: "text",
                text: `
Создаётся представление так: \`CREATE VIEW имя AS SELECT ...\`. Колонки получают имена из \`SELECT\`, поэтому давайте им псевдонимы, которые хотите видеть в методе.
`
            }
        ],
        task: {
            kind: "script",
            prompt: `
Создайте представление \`v_confirmed_bookings\` для метода. Колонки: \`id\` (номер брони), \`guest\` (имя гостя), \`room\` (номер комнаты), \`check_in\`. В нём только брони со статусом \`confirmed\`.
`,
            starter: "CREATE VIEW v_confirmed_bookings AS\nSELECT b.id\nFROM bookings b;",
            solution: `CREATE VIEW v_confirmed_bookings AS
SELECT b.id, g.full_name AS guest, r.number AS room, b.check_in
FROM bookings b
JOIN guests g ON g.id = b.guest_id
JOIN rooms r ON r.id = b.room_id
WHERE b.status = 'confirmed';`,
            wrong: `CREATE VIEW v_confirmed_bookings AS
SELECT b.id, g.full_name AS guest, r.number AS room, b.check_in
FROM bookings b
JOIN guests g ON g.id = b.guest_id
JOIN rooms r ON r.id = b.room_id;`,
            probes: ["SELECT count(*) FROM v_confirmed_bookings"],
            verify(run) {
                const table = tableOf(run, "v_confirmed_bookings");

                if (!table) {
                    return result(["Представление v_confirmed_bookings не найдено. Создайте его командой CREATE VIEW."]);
                }

                const issues = [];

                if (table.kind !== "view") {
                    issues.push("v_confirmed_bookings должно быть обычным представлением (VIEW), а не таблицей.");
                }

                if (!same(table.columns.map(column => column.name), ["id", "guest", "room", "check_in"])) {
                    issues.push("В представлении должны быть ровно колонки id, guest, room и check_in.");
                }

                if (Number(probeValue(run, 0)) !== 162) {
                    issues.push("В представлении должны быть только подтверждённые брони (status = 'confirmed').");
                }

                return result(issues);
            },
            hints: [
                "Представление создаётся командой CREATE VIEW имя AS SELECT ... Внутри обычный запрос с тремя таблицами.",
                "Имена колонок задают псевдонимы: g.full_name AS guest, r.number AS room. Фильтр по статусу пишется в WHERE внутри представления.",
                "CREATE VIEW v_confirmed_bookings AS SELECT b.id, g.full_name AS guest, r.number AS room, b.check_in FROM bookings b JOIN guests g ON g.id = b.guest_id JOIN rooms r ON r.id = b.room_id WHERE b.status = 'confirmed';"
            ],
            afterwards: `
Теперь метод Тимура читает \`SELECT * FROM v_confirmed_bookings\`, и ему не нужно знать про четыре таблицы. Если схема изменится, поправят одно представление, а не все запросы. В описании метода запишите, из чего оно собрано.
`
        },
        cheat: [
            ["CREATE VIEW v AS SELECT …", "сохранённый запрос, данных нет"],
            ["CREATE MATERIALIZED VIEW v AS …", "сохранённый результат запроса"],
            ["REFRESH MATERIALIZED VIEW v", "обновить сохранённый результат"]
        ]
    },

    {
        id: "sqa-ddl",
        title: "CREATE TABLE",
        summary: "Типы, NOT NULL, DEFAULT и первая вставка.",
        story: `
Владелица хочет собирать отзывы гостей. Тимур просит: «Опиши таблицу для отзывов: колонки, типы и что обязательно». Вы описываете её сразу командой \`CREATE TABLE\`: так видно, что получится.
`,
        refs: [["diagrams", "dg-er-to-sql", "От ER к SQL"]],
        theory: [
            {
                type: "why",
                title: "описать таблицу командой",
                text: `
Команда \`CREATE TABLE\` — самое точное описание сущности. В ней записано, какие бывают значения (тип), что обязательно (\`NOT NULL\`) и что подставляется само (\`DEFAULT\`). Разработчик читает её без пояснений.
`
            },
            {
                type: "text",
                text: `
Строение команды: имя таблицы, затем в скобках колонки через запятую. У колонки: имя, тип и необязательные правила.

Типы, которых хватает в большинстве таблиц: \`integer\` (целое), \`numeric(10, 2)\` (деньги), \`text\` (строка), \`boolean\` (да/нет), \`date\` (дата), \`timestamp\` (дата и время).
`
            },
            {
                type: "example",
                sql: "CREATE TABLE demo (\n    id integer NOT NULL,\n    title text NOT NULL,\n    created_at timestamp NOT NULL DEFAULT now()\n);\nINSERT INTO demo (id, title) VALUES (1, 'Первая строка');\nSELECT * FROM demo;",
                note: "Колонку created_at заполнила база, потому что есть DEFAULT."
            },
            {
                type: "text",
                text: `
\`NOT NULL\` запрещает пустое значение. \`DEFAULT\` задаёт значение, если при вставке колонку не указали. Если у колонки нет \`NOT NULL\`, значения может не быть.
`
            },
            {
                type: "trap",
                text: `
Если забыть \`NOT NULL\`, в таблицу попадут строки с пустыми обязательными полями, и это придётся разгребать через несколько месяцев. Для каждой колонки решайте сразу: может ли значения не быть? Если нет, пишите \`NOT NULL\`.
`
            }
        ],
        task: {
            kind: "script",
            prompt: `
Создайте таблицу \`feedback\`: \`id\` (целое, обязательное), \`rating\` (целое, обязательное, оценка), \`comment\` (текст, может быть пустым) и \`created_at\` (дата и время, обязательное, по умолчанию подставляется текущее время).
`,
            starter: "CREATE TABLE feedback (\n    id integer NOT NULL\n);",
            solution: `CREATE TABLE feedback (
    id integer NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp NOT NULL DEFAULT now()
);`,
            wrong: `CREATE TABLE feedback (
    id integer NOT NULL,
    rating integer,
    comment text,
    created_at timestamp NOT NULL DEFAULT now()
);`,
            probes: [
                "INSERT INTO feedback (id, rating) VALUES (1, 5) RETURNING created_at",
                "INSERT INTO feedback (id, comment) VALUES (2, 'без оценки')"
            ],
            verify(run) {
                const table = tableOf(run, "feedback");

                if (!table) {
                    return result(["Таблица feedback не найдена. Создайте её командой CREATE TABLE."]);
                }

                const issues = [
                    ...columnIssues(table, { name: "id", type: /^int/, nullable: false }),
                    ...columnIssues(table, { name: "rating", type: /^int/, nullable: false }),
                    ...columnIssues(table, { name: "comment", type: /^(text|character varying)/, nullable: true }),
                    ...columnIssues(table, { name: "created_at", type: /^timestamp/, nullable: false, hasDefault: true })
                ];

                if (issues.length === 0) {
                    expectInsertOk(run, 0, "строка с id и rating без комментария и без времени", issues);
                    expectInsertRejected(run, 1, "23502", "строка без оценки", issues);
                }

                return result(issues);
            },
            hints: [
                "Четыре колонки. Обязательные: id, rating, created_at. Комментарий может быть пустым, поэтому NOT NULL у него не нужен.",
                "Значение по умолчанию задаётся после типа: created_at timestamp NOT NULL DEFAULT now().",
                "CREATE TABLE feedback (id integer NOT NULL, rating integer NOT NULL, comment text, created_at timestamp NOT NULL DEFAULT now());"
            ],
            afterwards: `
Проверка вставила две пробные строки: с оценкой (время подставилось само) и без оценки (база отказала). Это и есть смысл \`NOT NULL\`: защита работает без участия кода приложения.
`
        },
        cheat: [
            ["CREATE TABLE t (колонка тип, …)", "создать таблицу"],
            ["NOT NULL", "значение обязательно"],
            ["DEFAULT выражение", "значение, если не указали при вставке"]
        ]
    },

    {
        id: "sqa-ids",
        title: "Идентификаторы",
        summary: "identity или uuid: что выбрать и как получить uuid в Postgres.",
        story: `
Для таблицы заметок о гостях Тимур спрашивает: «Какой тип у \`id\`: число по порядку или длинный случайный \`uuid\`? Мобильное приложение хочет создавать заметки без связи с сервером».

Это вопрос аналитика: от него зависят и API, и хранение, и безопасность.
`,
        refs: [["diagrams", "dg-er-keys", "Ключи в ER"]],
        theory: [
            {
                type: "why",
                title: "выбрать тип идентификатора осознанно",
                text: `
Идентификатор попадает в адреса методов (\`/notes/{id}\`), в ссылки между таблицами и в чужие системы. Поменять его потом очень трудно. Поэтому тип выбирают в начале.
`
            },
            {
                type: "text",
                text: `
**Число по порядку** (\`identity\`). База сама выдаёт 1, 2, 3, ... Занимает мало места, читается человеком, просто сортируется. Но ему можно угадать соседа (\`/notes/101\` после \`/notes/100\`), и идентификатор можно получить только у базы. Записывается так: \`id integer GENERATED ALWAYS AS IDENTITY\`.

**Случайный uuid.** Это 128-битное значение, например \`3f2a9c1e-...\`. Его можно создать где угодно: в приложении, на другом сервере, до отправки в базу, и повтор практически невозможен. Угадать соседа нельзя. Минусы: больше места, не читается и не сортируется «по времени создания».
`
            },
            {
                type: "example",
                sql: "SELECT gen_random_uuid() AS id_one, gen_random_uuid() AS id_two;",
                note: "Встроенная функция Postgres. Каждый вызов даёт новое значение."
            },
            {
                type: "text",
                text: `
В Postgres \`uuid\` — обычный тип колонки. Значение по умолчанию подставляет функция \`gen_random_uuid()\`: \`id uuid PRIMARY KEY DEFAULT gen_random_uuid()\`. Расширения подключать не нужно.
`
            },
            {
                type: "example",
                sql: "CREATE TABLE demo_ids (\n    n integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,\n    u uuid DEFAULT gen_random_uuid()\n);\nINSERT INTO demo_ids DEFAULT VALUES;\nINSERT INTO demo_ids DEFAULT VALUES;\nSELECT * FROM demo_ids;",
                note: "Одна колонка считает по порядку, другая выдаёт случайные значения."
            },
            {
                type: "trap",
                text: `
Вопрос «что лучше» без контекста неверен. Если данные создаёт только сервер и идентификаторы не видны наружу, достаточно \`identity\`. Если записи создаются в нескольких местах, склеиваются из разных систем или идентификатор виден в адресах и его нельзя угадывать, берите \`uuid\`. Запишите выбор и причину в описании сущности.
`
            }
        ],
        task: {
            kind: "script",
            prompt: `
Создайте таблицу \`guest_notes\` с колонками: \`id\` — \`uuid\`, первичный ключ, значение подставляется само, и \`note\` — текст, обязательный.
`,
            starter: "CREATE TABLE guest_notes (\n    id integer PRIMARY KEY,\n    note text NOT NULL\n);",
            solution: `CREATE TABLE guest_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    note text NOT NULL
);`,
            wrong: `CREATE TABLE guest_notes (
    id uuid PRIMARY KEY,
    note text NOT NULL
);`,
            probes: [
                "INSERT INTO guest_notes (note) VALUES ('первая') RETURNING id",
                "INSERT INTO guest_notes (note) VALUES ('вторая') RETURNING id"
            ],
            verify(run) {
                const table = tableOf(run, "guest_notes");

                if (!table) {
                    return result(["Таблица guest_notes не найдена. Создайте её командой CREATE TABLE."]);
                }

                const issues = [
                    ...columnIssues(table, { name: "id", type: /^uuid$/, nullable: false, hasDefault: true }),
                    ...columnIssues(table, { name: "note", type: /^(text|character varying)/, nullable: false })
                ];

                if (!same(table.primaryKey, ["id"])) {
                    issues.push("Колонка id должна быть первичным ключом (PRIMARY KEY).");
                }

                if (issues.length === 0) {
                    expectInsertOk(run, 0, "строка с одной заметкой без id", issues);
                    expectInsertOk(run, 1, "вторая строка без id", issues);

                    const first = probeValue(run, 0);
                    const second = probeValue(run, 1);

                    if (issues.length === 0 && (!UUID.test(String(first)) || first === second)) {
                        issues.push("Колонка id должна получать разные значения uuid сама: добавьте DEFAULT gen_random_uuid().");
                    }
                }

                return result(issues);
            },
            hints: [
                "Тип колонки id — uuid. Первичный ключ записывается PRIMARY KEY.",
                "Чтобы id заполнялся сам, нужно значение по умолчанию. Встроенная функция: gen_random_uuid().",
                "CREATE TABLE guest_notes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), note text NOT NULL);"
            ],
            afterwards: `
Пробная вставка не передавала \`id\`, и база сама выдала разные значения. Теперь клиенту можно разрешить создавать записи без запроса к серверу. Для публичных адресов вроде \`/notes/{id}\` такой идентификатор нельзя подобрать перебором.
`
        },
        cheat: [
            ["id integer GENERATED ALWAYS AS IDENTITY", "число по порядку от базы"],
            ["id uuid DEFAULT gen_random_uuid()", "случайный uuid от базы"],
            ["gen_random_uuid()", "встроенная функция, расширение не нужно"]
        ]
    },

    {
        id: "sqa-keys",
        title: "Ключи и связи",
        summary: "PRIMARY KEY, FOREIGN KEY и UNIQUE: как база защищает данные.",
        story: `
Отзыв всегда относится к одной брони, и на одну бронь можно оставить только один отзыв. Тимур просит: «Опиши таблицу \`reviews\` так, чтобы эти правила проверяла сама база, а не только мой код».
`,
        refs: [["diagrams", "dg-er-keys", "Ключи в ER"]],
        theory: [
            {
                type: "why",
                title: "записывать правила данных ключами",
                text: `
Код приложения можно обойти, забыть или сломать при правке. Ключи действуют всегда: любой запрос, любой сервис, любая выгрузка. Правила данных записывают там, где они не нарушатся.
`
            },
            {
                type: "text",
                text: `
Три главных ограничения:

- \`PRIMARY KEY\` — идентификатор строки. Значение уникально и не бывает пустым. Один на таблицу.
- \`FOREIGN KEY\` (в записи \`REFERENCES таблица (колонка)\`) — ссылка на строку другой таблицы. Нельзя сослаться на то, чего нет.
- \`UNIQUE\` — значение не повторяется. Таких ограничений может быть много.
`
            },
            {
                type: "example",
                sql: "CREATE TABLE demo_orders (\n    id integer PRIMARY KEY,\n    booking_id integer NOT NULL REFERENCES bookings (id),\n    number text NOT NULL UNIQUE\n);\nINSERT INTO demo_orders VALUES (1, 1, 'A-1');\nSELECT * FROM demo_orders;",
                note: "Первичный ключ, ссылка на брони и уникальный номер в одной таблице."
            },
            {
                type: "text",
                text: `
У внешнего ключа есть правило, что делать при удалении родительской строки (\`ON DELETE\`). По умолчанию база запретит удалить бронь, на которую есть ссылки. Вариант \`ON DELETE CASCADE\` удалит и зависимые строки. В описании сущности запишите, какое поведение нужно: от него зависят и API, и история данных.
`
            },
            {
                type: "trap",
                text: `
Колонка с внешним ключом сама по себе не уникальна: у одной брони может быть много платежей. Если связь «одна бронь — один отзыв», нужен ещё и \`UNIQUE\` на этой колонке. Без него ограничение «один к одному» превращается в «один ко многим».
`
            }
        ],
        task: {
            kind: "script",
            prompt: `
Создайте таблицу \`reviews\`: \`id\` — целое, первичный ключ; \`booking_id\` — целое, обязательное, ссылка на \`bookings(id)\`, на одну бронь не больше одного отзыва; \`rating\` — целое, обязательное; \`comment\` — текст, может быть пустым.
`,
            starter: "CREATE TABLE reviews (\n    id integer,\n    booking_id integer,\n    rating integer NOT NULL,\n    comment text\n);",
            solution: `CREATE TABLE reviews (
    id integer PRIMARY KEY,
    booking_id integer NOT NULL UNIQUE REFERENCES bookings (id),
    rating integer NOT NULL,
    comment text
);`,
            wrong: `CREATE TABLE reviews (
    id integer PRIMARY KEY,
    booking_id integer NOT NULL REFERENCES bookings (id),
    rating integer NOT NULL,
    comment text
);`,
            probes: [
                "INSERT INTO reviews (id, booking_id, rating) VALUES (1, 1, 5)",
                "INSERT INTO reviews (id, booking_id, rating) VALUES (1, 2, 4)",
                "INSERT INTO reviews (id, booking_id, rating) VALUES (2, 1, 3)",
                "INSERT INTO reviews (id, booking_id, rating) VALUES (3, 999999, 5)"
            ],
            verify(run) {
                const table = tableOf(run, "reviews");

                if (!table) {
                    return result(["Таблица reviews не найдена. Создайте её командой CREATE TABLE."]);
                }

                const issues = [];

                if (!same(table.primaryKey, ["id"])) {
                    issues.push("Колонка id должна быть первичным ключом (PRIMARY KEY).");
                }

                if (!table.foreignKeys.some(item => item.refTable === "bookings" && same(item.cols, ["booking_id"]))) {
                    issues.push("booking_id должна ссылаться на bookings(id): добавьте REFERENCES bookings (id).");
                }

                if (issues.length === 0) {
                    expectInsertOk(run, 0, "первый отзыв на бронь 1", issues);
                    expectInsertRejected(run, 1, "23505", "второй отзыв с тем же id", issues);
                    expectInsertRejected(run, 2, "23505", "второй отзыв на ту же бронь", issues);
                    expectInsertRejected(run, 3, "23503", "отзыв на несуществующую бронь", issues);
                }

                return result(issues);
            },
            hints: [
                "Нужны три ограничения: PRIMARY KEY на id, REFERENCES на booking_id и ещё одно, которое не даёт повторять бронь.",
                "Один отзыв на бронь гарантирует UNIQUE на колонке booking_id.",
                "CREATE TABLE reviews (id integer PRIMARY KEY, booking_id integer NOT NULL UNIQUE REFERENCES bookings (id), rating integer NOT NULL, comment text);"
            ],
            afterwards: `
Проверка пробовала нарушить каждое правило, и база отвечала отказом с названием ограничения. Если в запросе стоит ошибка, это название подсказывает, какое именно правило сработало.
`
        },
        cheat: [
            ["PRIMARY KEY", "уникальный непустой идентификатор строки"],
            ["REFERENCES t (id)", "внешний ключ: значение должно быть в t"],
            ["UNIQUE", "значение не повторяется"]
        ]
    },

    {
        id: "sqa-composite",
        title: "Составные ключи",
        summary: "Ключ из двух колонок: связь «многие ко многим».",
        story: `
У номеров бывают удобства: балкон, камин, кофемашина. У одного номера их несколько, и одно удобство есть у нескольких номеров. Тимур просит: «Опиши связующую таблицу». Справочник удобств \`amenities\` уже есть в базе.
`,
        before: `
CREATE TABLE amenities (
    id integer PRIMARY KEY,
    title text NOT NULL
);
INSERT INTO amenities (id, title) VALUES (1, 'Балкон'), (2, 'Камин'), (3, 'Кофемашина'), (4, 'Сейф');
`,
        refs: [["diagrams", "dg-er-many-many", "Связь «многие ко многим»"]],
        theory: [
            {
                type: "why",
                title: "понимать составные ключи",
                text: `
Связь «многие ко многим» напрямую в таблицах не записать. Её разбивают на две связи «один ко многим» через третью таблицу. Идентифицирует строку в ней не одна колонка, а пара.
`
            },
            {
                type: "text",
                text: `
В базе уже есть такая таблица: [[table:booking_services]]. В ней пара \`booking_id\` и \`service_id\` — **составной первичный ключ**. Пара не повторяется: одну услугу нельзя добавить в бронь дважды. А каждая из колонок по отдельности повторяться может.

Записывается ограничение после списка колонок: \`PRIMARY KEY (колонка1, колонка2)\`. Составными бывают и \`UNIQUE\`, и \`FOREIGN KEY\`: \`UNIQUE (a, b)\`, \`FOREIGN KEY (a, b) REFERENCES t (a, b)\`.
`
            },
            {
                type: "example",
                sql: "CREATE TABLE demo_link (\n    booking_id integer NOT NULL REFERENCES bookings (id),\n    service_id integer NOT NULL REFERENCES services (id),\n    PRIMARY KEY (booking_id, service_id)\n);\nINSERT INTO demo_link VALUES (1, 1), (1, 2), (2, 1);\nSELECT * FROM demo_link;",
                note: "Бронь 1 имеет две услуги, услугу 1 заказали в двух бронях. Пары разные, дублей нет."
            },
            {
                type: "trap",
                text: `
Ошибка новичка — сделать первичным ключом только одну колонку из пары. Тогда у номера будет только одно удобство. Другая ошибка — не поставить ключ вообще: одна и та же пара окажется в таблице два раза, и счёт по ней удвоится.
`
            }
        ],
        task: {
            kind: "script",
            prompt: `
Создайте связующую таблицу \`room_amenities\`: \`room_id\` — ссылка на \`rooms(id)\`, \`amenity_id\` — ссылка на \`amenities(id)\`. Обе колонки обязательные. Пара из этих двух колонок — первичный ключ.
`,
            starter: "CREATE TABLE room_amenities (\n    room_id integer NOT NULL,\n    amenity_id integer NOT NULL\n);",
            solution: `CREATE TABLE room_amenities (
    room_id integer NOT NULL REFERENCES rooms (id),
    amenity_id integer NOT NULL REFERENCES amenities (id),
    PRIMARY KEY (room_id, amenity_id)
);`,
            wrong: `CREATE TABLE room_amenities (
    room_id integer PRIMARY KEY REFERENCES rooms (id),
    amenity_id integer NOT NULL REFERENCES amenities (id)
);`,
            probes: [
                "INSERT INTO room_amenities (room_id, amenity_id) VALUES (1, 1)",
                "INSERT INTO room_amenities (room_id, amenity_id) VALUES (1, 1)",
                "INSERT INTO room_amenities (room_id, amenity_id) VALUES (1, 2)",
                "INSERT INTO room_amenities (room_id, amenity_id) VALUES (2, 1)",
                "INSERT INTO room_amenities (room_id, amenity_id) VALUES (1, 999)",
                "INSERT INTO room_amenities (room_id, amenity_id) VALUES (999, 1)"
            ],
            verify(run) {
                const table = tableOf(run, "room_amenities");

                if (!table) {
                    return result(["Таблица room_amenities не найдена. Создайте её командой CREATE TABLE."]);
                }

                const issues = [];

                if (!same(table.primaryKey, ["room_id", "amenity_id"])) {
                    issues.push("Первичный ключ должен состоять из двух колонок сразу: PRIMARY KEY (room_id, amenity_id).");
                }

                if (!table.foreignKeys.some(item => item.refTable === "rooms") || !table.foreignKeys.some(item => item.refTable === "amenities")) {
                    issues.push("Обе колонки должны быть внешними ключами: на rooms(id) и на amenities(id).");
                }

                if (issues.length === 0) {
                    expectInsertOk(run, 0, "пара «номер 1, удобство 1»", issues);
                    expectInsertRejected(run, 1, "23505", "та же пара во второй раз", issues);
                    expectInsertOk(run, 2, "тот же номер с другим удобством", issues);
                    expectInsertOk(run, 3, "то же удобство в другом номере", issues);
                    expectInsertRejected(run, 4, "23503", "несуществующее удобство", issues);
                    expectInsertRejected(run, 5, "23503", "несуществующий номер", issues);
                }

                return result(issues);
            },
            hints: [
                "Ключ из двух колонок записывается отдельной строкой после колонок: PRIMARY KEY (колонка1, колонка2).",
                "Ссылки задают REFERENCES у каждой колонки: rooms (id) и amenities (id).",
                "CREATE TABLE room_amenities (room_id integer NOT NULL REFERENCES rooms (id), amenity_id integer NOT NULL REFERENCES amenities (id), PRIMARY KEY (room_id, amenity_id));"
            ],
            afterwards: `
Проверка показала три вещи: пара не повторяется, одна колонка может повторяться, а несуществующие номера и удобства база не пропускает. Такую же таблицу вы видели в схеме базы: \`booking_services\`.
`
        },
        cheat: [
            ["PRIMARY KEY (a, b)", "уникальна пара значений"],
            ["UNIQUE (a, b)", "пара не повторяется, но может быть пустой"],
            ["FOREIGN KEY (a, b) REFERENCES t (a, b)", "ссылка по двум колонкам"]
        ]
    },

    {
        id: "sqa-check",
        title: "CHECK и справочники",
        summary: "Допустимые значения: CHECK, enum или отдельная таблица.",
        story: `
Бухгалтерия вводит таблицу возвратов \`refunds\`. Нужно, чтобы сумма была положительной, а статус — одним из трёх: \`new\`, \`approved\`, \`rejected\`. Тимур спрашивает: «Это \`CHECK\`, \`enum\` или справочник?»
`,
        refs: [["sql", "sql-where", "Условия"]],
        theory: [
            {
                type: "why",
                title: "ограничивать допустимые значения в базе",
                text: `
Если в статусе может оказаться любая строка, в отчётах появятся «Approved», «approve» и «одобрено». Допустимые значения должна проверять база: тогда мусор не попадёт в таблицу, а в отчётах будет только то, что вы договорились хранить.
`
            },
            {
                type: "text",
                text: `
Три способа:

- **\`CHECK\`** — условие в таблице: \`CHECK (amount > 0)\` или \`CHECK (status IN ('new', 'approved'))\`. Просто и наглядно. Чтобы добавить значение, нужно менять ограничение.
- **\`enum\`** — отдельный тип: \`CREATE TYPE refund_status AS ENUM ('new', 'approved')\`. Значения зашиты в тип, их порядок фиксирован. Убрать значение из типа трудно.
- **Справочник** — отдельная таблица статусов, а в основной таблице внешний ключ на неё. Новое значение добавляется вставкой строки. К значению можно добавить название, цвет, признак «финальный». Минус: лишнее соединение в запросах.
`
            },
            {
                type: "example",
                sql: "CREATE TABLE demo_pay (\n    id integer PRIMARY KEY,\n    amount numeric(10, 2) NOT NULL CHECK (amount > 0),\n    status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'approved', 'rejected'))\n);\nINSERT INTO demo_pay (id, amount) VALUES (1, 500);\nSELECT * FROM demo_pay;",
                note: "Статус по умолчанию new, сумма положительная. Попробуйте вставить сумму 0."
            },
            {
                type: "trap",
                text: `
Когда значений мало и они редко меняются, хватает \`CHECK\`. Если список растёт или значения нужно показывать людям с названиями, берите справочник. \`enum\` удобен, пока состав статусов не меняется: его труднее править, чем таблицу.
`
            }
        ],
        task: {
            kind: "script",
            prompt: `
Создайте таблицу \`refunds\`: \`id\` — целое, первичный ключ; \`payment_id\` — целое, обязательное, ссылка на \`payments(id)\`; \`amount\` — деньги \`numeric(10, 2)\`, обязательное, строго больше нуля; \`status\` — текст, обязательный, по умолчанию \`'new'\`, допустимы только \`new\`, \`approved\` и \`rejected\`.
`,
            starter: "CREATE TABLE refunds (\n    id integer PRIMARY KEY,\n    payment_id integer NOT NULL REFERENCES payments (id),\n    amount numeric(10, 2) NOT NULL,\n    status text NOT NULL\n);",
            solution: `CREATE TABLE refunds (
    id integer PRIMARY KEY,
    payment_id integer NOT NULL REFERENCES payments (id),
    amount numeric(10, 2) NOT NULL CHECK (amount > 0),
    status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'approved', 'rejected'))
);`,
            wrong: `CREATE TABLE refunds (
    id integer PRIMARY KEY,
    payment_id integer NOT NULL REFERENCES payments (id),
    amount numeric(10, 2) NOT NULL CHECK (amount > 0),
    status text NOT NULL DEFAULT 'new'
);`,
            probes: [
                "INSERT INTO refunds (id, payment_id, amount) VALUES (1, 1, 500) RETURNING status",
                "INSERT INTO refunds (id, payment_id, amount) VALUES (2, 1, 0)",
                "INSERT INTO refunds (id, payment_id, amount, status) VALUES (3, 1, 100, 'maybe')",
                "INSERT INTO refunds (id, payment_id, amount, status) VALUES (4, 1, 100, 'approved')"
            ],
            verify(run) {
                const table = tableOf(run, "refunds");

                if (!table) {
                    return result(["Таблица refunds не найдена. Создайте её командой CREATE TABLE."]);
                }

                const issues = [
                    ...columnIssues(table, { name: "amount", type: /^numeric/, nullable: false }),
                    ...columnIssues(table, { name: "status", nullable: false, hasDefault: true }),
                    ...columnIssues(table, { name: "payment_id", nullable: false })
                ];

                if (issues.length === 0) {
                    expectInsertOk(run, 0, "возврат без статуса", issues);

                    if (probeValue(run, 0) !== "new") {
                        issues.push("Если статус не указан, он должен стать new.");
                    }

                    expectInsertRejected(run, 1, "23514", "возврат на сумму 0", issues);
                    expectInsertRejected(run, 2, "23514", "возврат со статусом «maybe»", issues);
                    expectInsertOk(run, 3, "возврат со статусом approved", issues);
                }

                return result(issues);
            },
            hints: [
                "Для суммы и для статуса нужно по одному условию CHECK. Значение по умолчанию задаёт DEFAULT.",
                "Список допустимых значений: CHECK (status IN ('new', 'approved', 'rejected')). Сумма: CHECK (amount > 0).",
                "CREATE TABLE refunds (id integer PRIMARY KEY, payment_id integer NOT NULL REFERENCES payments (id), amount numeric(10, 2) NOT NULL CHECK (amount > 0), status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'approved', 'rejected')));"
            ],
            afterwards: `
Проверка пробовала вставить нулевую сумму и несуществующий статус, и база отказала. Решение «CHECK, enum или справочник» записывайте в описании сущности вместе с причиной: например, «статусов три и они не меняются, значит CHECK».
`
        },
        cheat: [
            ["CHECK (условие)", "значение должно подходить под условие"],
            ["CREATE TYPE t AS ENUM (…)", "тип с фиксированным списком значений"],
            ["справочник + FOREIGN KEY", "значения лежат в отдельной таблице"]
        ]
    },

    {
        id: "sqa-normal",
        title: "Нормальные формы",
        summary: "Что не так с «плохой» таблицей и как её разделить.",
        story: `
Бухгалтер вёл брони в одной большой таблице и прислал выгрузку \`bookings_flat\`. Тимур просит: «Из этого надо сделать нормальные таблицы. Скажи, что здесь не так».

Выгрузка уже есть в базе. Посмотрите её и найдите проблемы.
`,
        before: `
CREATE TABLE bookings_flat (
    booking_id integer,
    guest_name text,
    guest_email text,
    guest_city text,
    room_number text,
    room_kind text,
    services text,
    total numeric(10, 2)
);
INSERT INTO bookings_flat VALUES
    (1, 'Мария Ковалёва', 'guest1@example.com', 'Казань', '101', 'standard', 'Завтрак, Баня', 9800),
    (2, 'Мария Ковалёва', 'guest1@example.com', 'Казань', '203', 'comfort', 'Завтрак', 13700),
    (3, 'Леонид Крылов', 'guest2@example.com', 'Санкт-Петербург', '101', 'standard', '', 4500),
    (4, 'Леонид Крылов', 'guest2@example.com', 'СПб', '204', 'comfort', 'Трансфер от станции, Парковка', 15300),
    (5, 'Яна Назарова', 'guest3@example.com', 'Казань', '302', 'suite', 'Баня', 21000),
    (6, 'Яна Назарова', 'guest3@example.com', 'Казань', '302', 'suite', 'Завтрак, Баня, Парковка', 28900);
`,
        refs: [["diagrams", "dg-er-review", "Проверка ER"]],
        theory: [
            {
                type: "why",
                title: "понимать нормальные формы",
                text: `
Нормализация — это способ не хранить одно и то же в нескольких местах. Когда факт записан один раз, его нельзя исправить в одном месте и забыть в другом. Для аналитика это проверка схемы: по трём простым вопросам видно, что таблицу нужно разделить.
`
            },
            {
                type: "text",
                text: `
Три нормальные формы простыми словами:

1. **Первая (1НФ).** В ячейке одно значение. Нельзя класть список услуг через запятую в одну колонку.
2. **Вторая (2НФ).** Если ключ составной, каждое поле зависит от всего ключа, а не от его части.
3. **Третья (3НФ).** Поле зависит от ключа, а не от другого поля. Например, тип комнаты зависит от номера комнаты, а не от брони.
`
            },
            {
                type: "example",
                sql: "SELECT guest_email, count(DISTINCT guest_city) AS cities, string_agg(DISTINCT guest_city, ', ') AS spelled_as\nFROM bookings_flat\nGROUP BY guest_email\nORDER BY guest_email;",
                note: "У гостя guest2 город записан двумя способами. Так выглядит аномалия: один факт хранится в нескольких местах."
            },
            {
                type: "text",
                text: `
Лечение одно: каждый факт хранить в своей таблице, а в других местах ссылаться на него ключом. Данные гостя уходят в \`guests\`, данные комнаты в \`rooms\`, услуги брони в связующую таблицу, как \`booking_services\`. В брони остаются \`guest_id\` и \`room_id\`.
`
            },
            {
                type: "trap",
                text: `
Нормализация не самоцель. Для таблиц, по которым считают отчёты, повторы часто оставляют нарочно: так запрос не соединяет пять таблиц и работает быстрее. Это разговор следующей главы про хранилища. Для рабочей базы, где данные постоянно меняются, нормализованная схема надёжнее.
`
            }
        ],
        task: {
            kind: "quiz",
            prompt: "Посмотрите на таблицу bookings_flat во вкладке «Схема» и в примере выше. Ответьте на вопросы.",
            questions: [
                {
                    prompt: "В колонке `services` лежит текст «Завтрак, Баня». Какая нормальная форма нарушена?",
                    options: [
                        "Первая: в одной ячейке несколько значений",
                        "Вторая: ключ составной",
                        "Третья: поле зависит от другого поля",
                        "Никакая, так можно"
                    ],
                    correct: 0,
                    explain: "Список в ячейке нарушает первую форму. Посчитать «сколько раз заказали баню» или присоединить цену услуги такой записью трудно. Услуги нужно вынести в отдельные строки связующей таблицы."
                },
                {
                    prompt: "Имя и город гостя повторяются в каждой его брони. Что может пойти не так?",
                    options: [
                        "Ничего, это просто занимает больше места",
                        "Город запишут по-разному («Санкт-Петербург» и «СПб») и данные разойдутся",
                        "Запрос перестанет выполняться",
                        "Бронь потеряет номер"
                    ],
                    correct: 1,
                    explain: "Когда факт записан много раз, значения расходятся: одну запись поправили, другую забыли. В примере выше это видно у гостя guest2."
                },
                {
                    prompt: "Куда вынести данные гостя?",
                    options: [
                        "Оставить в брони и просто добавить колонку",
                        "В отдельную таблицу guests, а в брони хранить guest_id",
                        "В отдельную колонку bookings.guest_data через запятую",
                        "Не выносить, так быстрее"
                    ],
                    correct: 1,
                    explain: "Один гость — одна строка в guests. В брони остаётся только ссылка (внешний ключ). Исправить город теперь нужно в одном месте."
                },
                {
                    prompt: "Тип комнаты (`room_kind`) определяется номером комнаты, а не бронью. Какая форма нарушена?",
                    options: [
                        "Первая",
                        "Вторая",
                        "Третья: поле зависит от другого поля, а не от ключа",
                        "Все соблюдены"
                    ],
                    correct: 2,
                    explain: "Ключ таблицы — номер брони. Тип комнаты зависит от номера комнаты, а тот — от брони. Это зависимость через другое поле: нарушение третьей формы. Тип нужно хранить в таблице комнат."
                },
                {
                    prompt: "Когда повторы данных в таблице допустимы?",
                    options: [
                        "Никогда",
                        "В таблицах для отчётов (витринах), которые строят из рабочей базы",
                        "В таблицах, где есть первичный ключ",
                        "Только если таблица маленькая"
                    ],
                    correct: 1,
                    explain: "В рабочей базе повторы опасны, потому что данные меняются. В таблице для отчётов данные только читают, а повторы убирают лишние соединения. Об этом следующая глава."
                }
            ],
            afterwards: `
Нормализация отвечает на вопрос «где хранить каждый факт один раз». Проверяйте схему тремя вопросами: нет ли списков в ячейках, всё ли зависит от ключа, нет ли зависимостей между не ключевыми полями.
`
        },
        cheat: [
            ["1НФ", "в ячейке одно значение, без списков"],
            ["2НФ", "поле зависит от всего составного ключа"],
            ["3НФ", "поле зависит от ключа, а не от другого поля"]
        ]
    }
];
