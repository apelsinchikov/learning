import { TABLES } from "./hotel/schema.js";

/*
 * Ошибки Postgres написаны для разработчиков и по-английски.
 * Здесь они превращаются в человеческие объяснения: что не так,
 * какие бывают названия и что попробовать.
 *
 * humanizeError(message) → { title, text }
 */

const KEYWORDS = [
    "SELECT", "FROM", "WHERE", "GROUP", "BY", "HAVING", "ORDER", "LIMIT", "DISTINCT",
    "JOIN", "INNER", "LEFT", "RIGHT", "FULL", "OUTER", "ON", "USING", "AS", "AND",
    "OR", "NOT", "IN", "BETWEEN", "LIKE", "IS", "NULL", "COUNT", "SUM", "AVG",
    "MIN", "MAX", "CASE", "WHEN", "THEN", "ELSE", "END", "UNION", "ASC", "DESC"
];

export function distance(a, b) {
    const x = String(a).toLowerCase();
    const y = String(b).toLowerCase();
    const row = Array.from({ length: y.length + 1 }, (_, i) => i);

    for (let i = 1; i <= x.length; i++) {
        let previous = row[0];

        row[0] = i;

        for (let j = 1; j <= y.length; j++) {
            const current = row[j];

            row[j] = Math.min(
                row[j] + 1,
                row[j - 1] + 1,
                previous + (x[i - 1] === y[j - 1] ? 0 : 1)
            );

            previous = current;
        }
    }

    return row[y.length];
}

/* Самое похожее слово из списка, если оно достаточно близко. */
export function closest(word, candidates, maxDistance = 3) {
    let best = null;
    let bestDistance = Infinity;

    for (const candidate of candidates) {
        const d = distance(word, candidate);

        if (d < bestDistance) {
            best = candidate;
            bestDistance = d;
        }
    }

    const limit = Math.min(maxDistance, Math.max(1, Math.floor(String(word).length / 2)));

    return bestDistance <= limit ? best : null;
}

function allColumns() {
    const names = new Set();

    for (const table of TABLES) {
        for (const column of table.columns) {
            names.add(column.name);
        }
    }

    return [...names];
}

function tableOf(columnName) {
    return TABLES.filter(table => table.columns.some(column => column.name === columnName))
        .map(table => table.name);
}

const tableList = () => TABLES.map(table => table.name).join(", ");

const SQL_WORDS = ["from", "select", "where", "group", "order", "having", "limit", "distinct", "join"];

function columnError(message) {
    const match = message.match(/column "?([\w.]+)"? does not exist/i);

    if (!match) {
        return null;
    }

    const written = match[1];
    const bare = written.includes(".") ? written.split(".").pop() : written;
    const guess = closest(bare, allColumns());

    if (guess) {
        return {
            title: `Не нашёл колонку ${bare}`,
            text: `Возможно, ты имел в виду ${guess} (есть в таблицах: ${tableOf(guess).join(", ")}). Проверь написание: регистр не важен, но каждая буква и нижнее подчёркивание должны совпадать.`
        };
    }

    const keyword = closest(bare.toLowerCase(), SQL_WORDS);

    if (keyword) {
        return {
            title: `Не нашёл колонку ${bare}`,
            text: `Похоже на опечатку в слове ${keyword.toUpperCase()}: база приняла «${bare}» за название колонки. Проверьте написание ключевых слов.`
        };
    }

    return {
        title: `Не нашёл колонку ${bare}`,
        text: `Такой колонки нет. Загляни во вкладку «База» справа: там перечислены все колонки каждой таблицы. Если это текст, возьми его в одинарные кавычки: 'Москва'.`
    };
}

function relationError(message) {
    const match = message.match(/relation "([^"]+)" does not exist/i);

    if (!match) {
        return null;
    }

    const written = match[1];
    const guess = closest(written, TABLES.map(table => table.name));

    return {
        title: `Не нашёл таблицу ${written}`,
        text: guess
            ? `Возможно, ты имел в виду ${guess}. Все таблицы: ${tableList()}.`
            : `Такой таблицы нет. Все таблицы: ${tableList()}.`
    };
}

function syntaxError(message) {
    if (/syntax error at end of input/i.test(message)) {
        return {
            title: "Запрос оборван",
            text: "Запрос закончился раньше, чем нужно. Чаще всего после FROM не указана таблица, после WHERE нет условия или после запятой нет колонки."
        };
    }

    const match = message.match(/syntax error at or near "([^"]*)"/i);

    if (!match) {
        return null;
    }

    const near = match[1];
    const keyword = closest(near, KEYWORDS, 2);

    if (keyword && keyword.toLowerCase() !== near.toLowerCase()) {
        return {
            title: "Опечатка в запросе",
            text: `Рядом с «${near}» ошибка. Возможно, ты хотел написать ${keyword}.`
        };
    }

    return {
        title: "Запрос записан неверно",
        text: `Рядом с «${near}» что-то не так. Проверь по порядку: нет ли лишней запятой перед FROM, на месте ли все кавычки и скобки, не пропущено ли ключевое слово.`
    };
}

const RULES = [
    {
        test: /cannot execute [\w-]+( statement)? in a read-only transaction/i,
        make: () => ({
            title: "Менять данные нельзя",
            text: "В этом курсе запросы только на чтение: SELECT. Данные отеля менять не нужно, достаточно их читать."
        })
    },
    {
        test: /cannot insert multiple commands/i,
        make: () => ({
            title: "Запрос должен быть один",
            text: "Здесь выполняется один запрос за раз. Убери лишние команды после точки с запятой."
        })
    },
    {
        test: /column reference "([^"]+)" is ambiguous/i,
        make: message => {
            const name = message.match(/column reference "([^"]+)"/i)[1];

            return {
                title: `Колонка ${name} неоднозначна`,
                text: `Колонка ${name} есть сразу в нескольких таблицах запроса, и база не знает, какую взять. Допиши перед ней имя таблицы или псевдоним: guests.${name} или g.${name}.`
            };
        }
    },
    {
        test: /must appear in the GROUP BY clause or be used in an aggregate function/i,
        make: message => {
            const column = (message.match(/column "([^"]+)"/i) || [])[1] || "эта колонка";

            return {
                title: "Колонку нужно сгруппировать или посчитать",
                text: `Когда в запросе есть GROUP BY или COUNT/SUM, каждая колонка в SELECT должна быть либо в GROUP BY, либо внутри функции (COUNT, SUM, MAX…). Сейчас такой не хватает: ${column}.`
            };
        }
    },
    {
        test: /aggregate functions are not allowed in WHERE/i,
        make: () => ({
            title: "COUNT и SUM нельзя в WHERE",
            text: "WHERE отбирает отдельные строки ещё до подсчёта, поэтому итогов он не знает. Условие по результату подсчёта пишется в HAVING после GROUP BY."
        })
    },
    {
        test: /missing FROM-clause entry for table "([^"]+)"/i,
        make: message => {
            const alias = message.match(/table "([^"]+)"/i)[1];

            return {
                title: `Не объявлен псевдоним ${alias}`,
                text: `Ты используешь ${alias}., но такого имени нет в FROM или JOIN. Объяви его: FROM guests ${alias}.`
            };
        }
    },
    {
        test: /table name "([^"]+)" specified more than once/i,
        make: message => {
            const name = message.match(/table name "([^"]+)"/i)[1];

            return {
                title: `Таблица ${name} указана дважды`,
                text: `Одну таблицу можно соединить с собой, но тогда каждому экземпляру нужен свой псевдоним: FROM ${name} a JOIN ${name} b …`
            };
        }
    },
    {
        test: /invalid input syntax for type (date|timestamp)/i,
        make: () => ({
            title: "Дата записана неверно",
            text: "Даты пишут в одинарных кавычках в формате год-месяц-день: '2026-02-14'. Со временем: '2026-02-15 01:30'."
        })
    },
    {
        test: /invalid input syntax for type (integer|bigint|numeric)/i,
        make: () => ({
            title: "Ожидалось число",
            text: "Здесь нужно число, а получен текст. Числа пишут без кавычек, а текст берут в одинарные кавычки."
        })
    },
    {
        test: /operator does not exist: ([\w ]+) ([=<>!~]+) ([\w ]+)/i,
        make: message => {
            const found = message.match(/operator does not exist: ([\w ]+) ([=<>!~]+) ([\w ]+)/i);

            return {
                title: "Сравниваются разные типы",
                text: `Нельзя сравнить ${found[1]} и ${found[3]}. Проверь, не взято ли число в кавычки, а текст без них.`
            };
        }
    },
    {
        test: /division by zero/i,
        make: () => ({
            title: "Деление на ноль",
            text: "Где-то в запросе делишь на ноль. Исключи такие строки условием в WHERE."
        })
    },
    {
        test: /more than one row returned by a subquery/i,
        make: () => ({
            title: "Подзапрос вернул несколько строк",
            text: "Здесь нужен ровно один ответ, а подзапрос вернул несколько строк. Используй IN вместо = или добавь LIMIT 1."
        })
    },
    {
        test: /does not exist/i,
        make: message => columnError(message) || relationError(message)
    }
];

export function humanizeError(rawMessage) {
    const message = String(rawMessage || "").replace(/^error:\s*/i, "").trim();

    if (!message) {
        return { title: "Что-то пошло не так", text: "База вернула ошибку без описания. Попробуй упростить запрос." };
    }

    for (const rule of RULES) {
        if (rule.test.test(message)) {
            const result = rule.make(message);

            if (result) {
                return result;
            }
        }
    }

    const syntax = syntaxError(message);

    if (syntax) {
        return syntax;
    }

    return {
        title: "База вернула ошибку",
        text: `Текст ошибки: ${message}`
    };
}
