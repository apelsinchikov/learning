import { guests, keyLog, orders, rooms, staff } from "./data.js";
import { findTable } from "./schema.js";

const DATA = { guests, rooms, staff, key_log: keyLog, orders };

/*
 * Первые строки таблицы без запуска базы: данные уже лежат в коде.
 * Результат такой же формы, как у запроса: { columns, rows }.
 */
export function peekTable(name, limit = 5) {
    const table = findTable(name);

    if (!table) {
        return null;
    }

    const columns = table.columns.map(column => ({ name: column.name }));
    const rows = DATA[name].slice(0, limit).map(row => columns.map(column => row[column.name] ?? null));

    return { columns, rows };
}

export function findRowById(tableName, idField, id) {
    return (DATA[tableName] || []).find(row => row[idField] === id) || null;
}

export { guests, keyLog, rooms };
