/*
 * Проверка ответа ученика: сравниваем ТАБЛИЦУ результата, а не текст запроса.
 * Один и тот же ответ можно получить разными запросами, и все они верны.
 *
 * Результат запроса: { columns: [{ name, oid }], rows: [[...], ...] }.
 */

const NUMERIC_OIDS = new Set([20, 21, 23, 700, 701, 1700]);

export function normalizeValue(value, oid) {
    if (value === null || value === undefined) {
        return "∅";
    }

    if (value instanceof Date) {
        return `D:${value.toISOString()}`;
    }

    if (typeof value === "bigint") {
        return `N:${value.toString()}`;
    }

    if (typeof value === "number") {
        return `N:${Number(value.toFixed(6))}`;
    }

    if (typeof value === "boolean") {
        return `B:${value}`;
    }

    if (typeof value === "object") {
        return `J:${JSON.stringify(value)}`;
    }

    const text = String(value);

    if (NUMERIC_OIDS.has(oid) && text.trim() !== "" && !Number.isNaN(Number(text))) {
        return `N:${Number(Number(text).toFixed(6))}`;
    }

    return `S:${text}`;
}

function rowKeys(result) {
    return result.rows.map(row =>
        row.map((value, index) => normalizeValue(value, result.columns[index]?.oid)).join("\u0001")
    );
}

function sameMultiset(a, b) {
    if (a.length !== b.length) {
        return false;
    }

    const counts = new Map();

    for (const key of a) {
        counts.set(key, (counts.get(key) || 0) + 1);
    }

    for (const key of b) {
        const left = counts.get(key);

        if (!left) {
            return false;
        }

        counts.set(key, left - 1);
    }

    return true;
}

const plural = (n, one, few, many) => {
    const mod10 = n % 10;
    const mod100 = n % 100;

    if (mod10 === 1 && mod100 !== 11) {
        return one;
    }

    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
        return few;
    }

    return many;
};

export const rowsWord = n => `${n} ${plural(n, "строка", "строки", "строк")}`;
export const columnsWord = n => `${n} ${plural(n, "колонка", "колонки", "колонок")}`;

/*
 * compareResults(actual, expected, { ordered, names }) →
 *   { ok: true } или { ok: false, issues: [текст подсказки, ...] }
 * Подсказки намеренно не раскрывают сам правильный ответ.
 */
export function compareResults(actual, expected, { ordered = false, names = false } = {}) {
    const issues = [];

    if (actual.columns.length !== expected.columns.length) {
        issues.push(
            `Колонок в ответе: ${actual.columns.length}, а нужно ${expected.columns.length}. Проверь, что перечислено после SELECT.`
        );
    } else if (names) {
        const wanted = expected.columns.map(column => column.name.toLowerCase());
        const got = actual.columns.map(column => column.name.toLowerCase());

        if (wanted.join("|") !== got.join("|")) {
            issues.push(
                `Колонки должны называться: ${expected.columns.map(column => column.name).join(", ")}. Переименовать можно через AS.`
            );
        }
    }

    if (actual.rows.length !== expected.rows.length) {
        const more = actual.rows.length > expected.rows.length;

        issues.push(
            `Строк в ответе: ${actual.rows.length}, а нужно ${expected.rows.length}. ${
                more
                    ? "Лишние строки: условие отбора слишком широкое или есть повторы."
                    : "Не хватает строк: условие слишком строгое или потерялись записи при соединении."
            }`
        );
    }

    if (issues.length) {
        return { ok: false, issues };
    }

    const left = rowKeys(actual);
    const right = rowKeys(expected);

    if (!sameMultiset(left, right)) {
        /* Те же значения, но колонки поменяны местами? */
        const sortColumns = result =>
            result.rows
                .map(row =>
                    row
                        .map((value, index) => normalizeValue(value, result.columns[index]?.oid))
                        .sort()
                        .join("\u0001")
                );

        if (sameMultiset(sortColumns(actual), sortColumns(expected))) {
            issues.push("Значения те же, но колонки стоят в другом порядке. Переставь их в SELECT.");
        } else {
            issues.push(
                "Количество строк и колонок совпало, а значения отличаются. Проверь условие отбора и то, какие именно колонки выбраны."
            );
        }

        return { ok: false, issues };
    }

    if (ordered && left.join("\n") !== right.join("\n")) {
        return {
            ok: false,
            issues: ["Строки те же, но порядок другой. Проверь ORDER BY: по какой колонке и в какую сторону сортируем."]
        };
    }

    return { ok: true, issues: [] };
}
