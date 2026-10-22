import { guests, keyLog, orders, rooms, staff } from "./data.js";

/*
 * Схема учебной базы. Имена колонок выбраны специально:
 * - guests.room_id и rooms.room_id называются одинаково — для USING;
 * - guests.id и key_log.guest_id называются по-разному — для ON.
 */
export const DDL = `
CREATE TABLE rooms (
    room_id INTEGER PRIMARY KEY,
    floor INTEGER NOT NULL,
    kind TEXT NOT NULL,
    title TEXT NOT NULL
);

CREATE TABLE guests (
    id INTEGER PRIMARY KEY,
    full_name TEXT NOT NULL,
    room_id INTEGER NOT NULL REFERENCES rooms (room_id),
    city TEXT NOT NULL,
    occupation TEXT,
    check_in DATE NOT NULL,
    check_out DATE
);

CREATE TABLE staff (
    id INTEGER PRIMARY KEY,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL,
    hired_on DATE NOT NULL,
    manager_id INTEGER REFERENCES staff (id)
);

CREATE TABLE key_log (
    id INTEGER PRIMARY KEY,
    room_id INTEGER NOT NULL REFERENCES rooms (room_id),
    guest_id INTEGER REFERENCES guests (id),
    staff_id INTEGER REFERENCES staff (id),
    opened_at TIMESTAMP NOT NULL
);

CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    guest_id INTEGER NOT NULL REFERENCES guests (id),
    item TEXT NOT NULL,
    price INTEGER NOT NULL,
    ordered_at TIMESTAMP NOT NULL
);
`;

function literal(value) {
    if (value === null || value === undefined) {
        return "NULL";
    }

    if (typeof value === "number") {
        return String(value);
    }

    return `'${String(value).replace(/'/g, "''")}'`;
}

function insert(table, columns, rows) {
    const values = rows
        .map(row => `(${columns.map(column => literal(row[column])).join(", ")})`)
        .join(",\n    ");

    return `INSERT INTO ${table} (${columns.join(", ")}) VALUES\n    ${values};`;
}

/* Полный SQL-скрипт: таблицы и данные. Порядок важен из-за внешних ключей. */
export function buildSeedSql() {
    return [
        DDL,
        insert("rooms", ["room_id", "floor", "kind", "title"], rooms),
        insert("guests", ["id", "full_name", "room_id", "city", "occupation", "check_in", "check_out"], guests),
        insert("staff", ["id", "full_name", "role", "hired_on", "manager_id"], staff),
        insert("key_log", ["id", "room_id", "guest_id", "staff_id", "opened_at"], keyLog),
        insert("orders", ["id", "guest_id", "item", "price", "ordered_at"], orders)
    ].join("\n\n");
}
