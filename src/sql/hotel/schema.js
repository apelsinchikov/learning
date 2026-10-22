import { guests, keyLog, orders, rooms, staff } from "./data.js";

/*
 * Описание таблиц для панели «База отеля»: что в каждой колонке,
 * где первичные ключи (PK) и где внешние (FK) и на что они ссылаются.
 */
export const TABLES = [
    {
        name: "guests",
        title: "Постояльцы",
        rows: guests.length,
        columns: [
            { name: "id", type: "INTEGER", key: "PK" },
            { name: "full_name", type: "TEXT" },
            { name: "room_id", type: "INTEGER", key: "FK", ref: "rooms.room_id" },
            { name: "city", type: "TEXT" },
            { name: "occupation", type: "TEXT", nullable: true },
            { name: "check_in", type: "DATE" },
            { name: "check_out", type: "DATE", nullable: true }
        ]
    },
    {
        name: "rooms",
        title: "Комнаты и служебные помещения",
        rows: rooms.length,
        columns: [
            { name: "room_id", type: "INTEGER", key: "PK" },
            { name: "floor", type: "INTEGER" },
            { name: "kind", type: "TEXT" },
            { name: "title", type: "TEXT" }
        ]
    },
    {
        name: "staff",
        title: "Сотрудники",
        rows: staff.length,
        columns: [
            { name: "id", type: "INTEGER", key: "PK" },
            { name: "full_name", type: "TEXT" },
            { name: "role", type: "TEXT" },
            { name: "hired_on", type: "DATE" },
            { name: "manager_id", type: "INTEGER", key: "FK", ref: "staff.id", nullable: true }
        ]
    },
    {
        name: "key_log",
        title: "Журнал электронных замков",
        rows: keyLog.length,
        columns: [
            { name: "id", type: "INTEGER", key: "PK" },
            { name: "room_id", type: "INTEGER", key: "FK", ref: "rooms.room_id" },
            { name: "guest_id", type: "INTEGER", key: "FK", ref: "guests.id", nullable: true },
            { name: "staff_id", type: "INTEGER", key: "FK", ref: "staff.id", nullable: true },
            { name: "opened_at", type: "TIMESTAMP" }
        ]
    },
    {
        name: "orders",
        title: "Заказы в ресторане и баре",
        rows: orders.length,
        columns: [
            { name: "id", type: "INTEGER", key: "PK" },
            { name: "guest_id", type: "INTEGER", key: "FK", ref: "guests.id" },
            { name: "item", type: "TEXT" },
            { name: "price", type: "INTEGER" },
            { name: "ordered_at", type: "TIMESTAMP" }
        ]
    }
];

export function findTable(name) {
    return TABLES.find(table => table.name === name) || null;
}

/* Какие таблицы упомянуты в тексте запроса (для подсветки в панели схемы). */
export function tablesMentioned(sql) {
    const text = String(sql || "").toLowerCase();

    return TABLES
        .filter(table => new RegExp(`(^|[^a-z0-9_])${table.name}([^a-z0-9_]|$)`).test(text))
        .map(table => table.name);
}
