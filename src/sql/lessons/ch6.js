/* Глава 6. Кого не хватает: LEFT, RIGHT, FULL, self-join. */

export const chapter6 = [
    {
        id: "sql-left-join",
        title: "LEFT JOIN: никого не потерять",
        summary: "Сохраняем все строки левой таблицы.",
        story: `
«Составьте мне список всех гостей и числа их заказов, — просит инспектор. — Даже тех, кто ничего не заказывал. Двадцать четыре человека».

Помощник попробовал. Получил двадцать.
`,
        theory: [
            {
                type: "why",
                title: "Что теряет обычный JOIN",
                text: `
Обычный \`JOIN\` оставляет только пары. Гость без заказов не нашёл пару и исчез из результата. Для списка «все гости» это ошибка. \`LEFT JOIN\` говорит: оставь все строки левой таблицы, а если пары нет, подставь \`NULL\`.
`
            },
            {
                type: "join-visual",
                kind: "left"
            },
            {
                type: "example",
                sql: "SELECT g.full_name, o.item\nFROM guests g\nLEFT JOIN orders o ON o.guest_id = g.id\nWHERE g.id IN (5, 12)\nORDER BY g.id;",
                note: "Дарья Миронова ничего не заказывала: в колонке item у неё NULL."
            },
            {
                type: "text",
                text: `
\`COUNT(o.id)\` считает только непустые значения, поэтому для гостя без заказов даёт 0. А \`COUNT(*)\` дал бы 1: строка гостя есть, хоть и без заказа.
`
            },
            {
                type: "trap",
                text: `
Левая и правая таблицы определяются порядком в запросе: та, что стоит **до** слова JOIN, левая. Если поменять их местами, результат изменится.
`
            }
        ],
        task: {
            kind: "fix",
            prompt: `
Нужно показать всех 24 гостей и число их заказов (\`orders_count\`). Запрос ниже теряет четверых гостей. Исправьте его.
`,
            starter:
                "SELECT g.full_name, COUNT(o.id) AS orders_count\nFROM guests g\nJOIN orders o ON o.guest_id = g.id\nGROUP BY g.full_name",
            solution:
                "SELECT g.full_name, COUNT(o.id) AS orders_count FROM guests g LEFT JOIN orders o ON o.guest_id = g.id GROUP BY g.full_name",
            names: true,
            expectRows: 24,
            expectCols: 2,
            hints: [
                "Прочитайте урок: какой вид JOIN сохраняет все строки левой таблицы?",
                "Нужно слово LEFT перед JOIN.",
                "FROM guests g LEFT JOIN orders o ON o.guest_id = g.id"
            ],
            clue: {
                title: "Четверо ничего не заказывали",
                text: "Четыре гостя не сделали ни одного заказа за всё время: Дарья Миронова, Инна Крылова, Руслан Гаврилов и Ян Белкин. Обычный JOIN их потерял бы."
            }
        },
        cheat: [["LEFT JOIN", "все строки левой таблицы, пары нет — NULL"]]
    },

    {
        id: "sql-anti-join",
        title: "Поиск отсутствующих",
        summary: "LEFT JOIN + IS NULL: у кого нет записей.",
        story: `
Трое гостей уверяют: «Всю ночь сидели в номере». Но карта ни разу не открывала дверь.

«Кто это? — спрашивает инспектор. — Мне нужны гости, которых вообще нет в журнале замков».
`,
        theory: [
            {
                type: "why",
                title: "Как найти то, чего нет",
                text: `
Искать отсутствие напрямую нельзя: в таблице нет строки «ничего не было». Но \`LEFT JOIN\` создаёт её сам, подставляя \`NULL\` туда, где пары нет. Остаётся оставить только такие строки.
`
            },
            {
                type: "example",
                sql: "SELECT g.full_name\nFROM guests g\nLEFT JOIN orders o ON o.guest_id = g.id\nWHERE o.id IS NULL;",
                note: "Гости, которые ничего не заказывали."
            },
            {
                type: "text",
                text: `
Приём из двух шагов: сначала \`LEFT JOIN\`, затем \`WHERE\` по правой таблице \`IS NULL\`. Для проверки берите колонку, которая в настоящих данных никогда не пуста, например \`id\`.
`
            },
            {
                type: "trap",
                text: `
Проверять на \`NULL\` нужно колонку правой таблицы. Если проверить колонку левой, условие не сработает. И не ставьте условие на правую таблицу в \`WHERE\` (кроме \`IS NULL\`): оно превратит \`LEFT JOIN\` обратно в обычный.
`
            }
        ],
        task: {
            prompt: `
Найдите гостей, которых нет в журнале замков: ни одной записи с их \`guest_id\`. Покажите \`full_name\`.
`,
            starter:
                "SELECT g.full_name\nFROM guests g\nLEFT JOIN key_log k ON k.guest_id = g.id\nWHERE ",
            solution:
                "SELECT g.full_name FROM guests g LEFT JOIN key_log k ON k.guest_id = g.id WHERE k.id IS NULL",
            expectRows: 3,
            expectCols: 1,
            hints: [
                "Нужны те гости, к которым в журнале не нашлось пары.",
                "Пары нет — значит, в колонке правой таблицы лежит NULL.",
                "WHERE k.id IS NULL"
            ],
            clue: {
                title: "Три молчащие карты",
                text: "Ключ ни разу не открывал дверь у Дарьи Мироновой, Михаила Орлова и Ульяны Масловой. Но все трое живут в номерах с другими гостями и ходят вместе с ними. Алиби не доказано, но и подозрений нет."
            }
        },
        cheat: [["LEFT JOIN … WHERE b.id IS NULL", "строки левой, у которых нет пары"]]
    },

    {
        id: "sql-self-join",
        title: "Таблица сама с собой",
        summary: "Сотрудник и его начальник в одной таблице.",
        story: `
«Кому подчиняется ночной администратор? — спрашивает инспектор. — И охранник? Мне нужна вся иерархия».

Начальник тоже сотрудник. Он записан в той же таблице.
`,
        theory: [
            {
                type: "why",
                title: "Зачем соединять таблицу с собой",
                text: `
В таблице \`staff\` у каждого сотрудника есть \`manager_id\`. Это номер другого сотрудника из той же таблицы. Чтобы вместо номера увидеть имя начальника, таблицу нужно взять **дважды**: один раз как сотрудников, другой как начальников.
`
            },
            {
                type: "text",
                text: `
Для этого нужны псевдонимы. Без них база не поймёт, где какая «копия» таблицы.
`
            },
            {
                type: "example",
                sql: "SELECT s.full_name AS employee, m.full_name AS manager\nFROM staff s\nLEFT JOIN staff m ON s.manager_id = m.id\nORDER BY s.id;",
                note: "s — сотрудник, m — его начальник. У управляющего начальника нет, поэтому LEFT JOIN."
            },
            {
                type: "trap",
                text: `
Если написать \`JOIN\` вместо \`LEFT JOIN\`, управляющий пропадёт из списка: у него нет начальника, и пары не нашлось. Подумайте заранее, нужен ли вам тот, у кого связи нет.
`
            }
        ],
        task: {
            prompt: `
Покажите всех сотрудников и их начальников. Колонки \`employee\` (имя сотрудника) и \`manager\` (имя начальника). У управляющего начальника нет, он должен остаться в списке. По номеру сотрудника.
`,
            starter:
                "SELECT s.full_name AS employee, m.full_name AS manager\nFROM staff s\n\nORDER BY s.id",
            solution:
                "SELECT s.full_name AS employee, m.full_name AS manager FROM staff s LEFT JOIN staff m ON s.manager_id = m.id ORDER BY s.id",
            ordered: true,
            names: true,
            expectRows: 9,
            expectCols: 2,
            hints: [
                "Таблица staff берётся два раза: s и m.",
                "Связь: manager_id сотрудника равен id начальника. И нужен LEFT JOIN.",
                "LEFT JOIN staff m ON s.manager_id = m.id"
            ],
            clue: {
                title: "Кто кому подчиняется",
                text: "Ночной администратор Ирина Седова и охранник Павел Кузин подчиняются напрямую управляющему Артёму Зайцеву. Выше Зайцева в отеле никого нет."
            }
        },
        cheat: [["FROM t a JOIN t b ON …", "таблица, соединённая сама с собой"]]
    },

    {
        id: "sql-right-full",
        title: "RIGHT и FULL JOIN",
        summary: "Зеркальный вариант и «оставить всё с обеих сторон».",
        story: `
«Сколько помещений пустует? — интересуется инспектор. — Если вор прятался, то, возможно, в пустой комнате».

Нужны комнаты, в которых никто не живёт.
`,
        theory: [
            {
                type: "why",
                title: "Зачем остальные виды",
                text: `
\`LEFT JOIN\` сохраняет левую таблицу. Когда нужно сохранить правую, есть \`RIGHT JOIN\`. А если важны обе, есть \`FULL JOIN\`.
`
            },
            { type: "join-visual", kind: "right" },
            {
                type: "text",
                text: `
\`RIGHT JOIN\` — это тот же \`LEFT JOIN\`, но с таблицами, поменянными местами. На практике почти всегда пишут \`LEFT\` и меняют порядок таблиц. Но читать \`RIGHT\` в чужих запросах нужно уметь.
`
            },
            {
                type: "example",
                sql: "SELECT r.title, g.full_name\nFROM guests g\nRIGHT JOIN rooms r USING (room_id)\nWHERE r.floor = 3;",
                note: "Все комнаты третьего этажа, даже те, в которых никто не живёт."
            },
            {
                type: "join-visual",
                kind: "full"
            },
            {
                type: "text",
                text: `
\`FULL JOIN\` оставляет строки из обеих таблиц, даже без пары. Нужен он редко: например, чтобы сверить два списка и увидеть расхождения в обе стороны.
`
            },
            {
                type: "trap",
                text: `
После \`RIGHT JOIN\` колонки левой таблицы могут быть \`NULL\`. Обращайтесь к ним осторожно.
`
            }
        ],
        task: {
            prompt: `
Найдите помещения, в которых никто не живёт. Покажите название (\`title\`) и вид (\`kind\`) комнаты, по возрастанию \`room_id\`. Используйте \`RIGHT JOIN\` от гостей к комнатам.
`,
            starter:
                "SELECT r.title, r.kind\nFROM guests g\nRIGHT JOIN rooms r USING (room_id)\nWHERE \nORDER BY r.room_id",
            solution:
                "SELECT r.title, r.kind FROM guests g RIGHT JOIN rooms r USING (room_id) WHERE g.id IS NULL ORDER BY r.room_id",
            ordered: true,
            expectRows: 6,
            expectCols: 2,
            hints: [
                "Те же рассуждения, что с левым соединением: пары нет — значит, NULL.",
                "Проверять нужно колонку таблицы гостей, потому что мы ищем комнаты без гостей.",
                "WHERE g.id IS NULL"
            ],
            clue: {
                title: "Шесть пустых помещений",
                text: "Пустуют два гостевых номера (303 и 304) и четыре служебных помещения: кабинет управляющего, кухня, бар и лыжная. Спрятаться вору было где."
            }
        },
        cheat: [
            ["RIGHT JOIN", "все строки правой таблицы"],
            ["FULL JOIN", "все строки обеих таблиц"]
        ]
    }
];
