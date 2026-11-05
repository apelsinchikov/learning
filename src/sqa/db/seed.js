import { generateSeason } from "./generate.js";

/*
 * Схема и данные учебной базы «Перевал: сезон».
 * Колонка bookings.extras (jsonb) есть в схеме, но в уроках не используется.
 */
export const DDL = `
CREATE TABLE rooms (
    id INTEGER PRIMARY KEY,
    number TEXT NOT NULL UNIQUE,
    floor INTEGER NOT NULL,
    kind TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    price_per_night NUMERIC(10, 2) NOT NULL
);

CREATE TABLE guests (
    id INTEGER PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    city TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE staff (
    id INTEGER PRIMARY KEY,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL,
    hired_on DATE NOT NULL,
    manager_id INTEGER REFERENCES staff (id)
);

CREATE TABLE services (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL
);

CREATE TABLE bookings (
    id INTEGER PRIMARY KEY,
    guest_id INTEGER NOT NULL REFERENCES guests (id),
    room_id INTEGER NOT NULL REFERENCES rooms (id),
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('confirmed', 'completed', 'cancelled')),
    source TEXT NOT NULL,
    staff_id INTEGER REFERENCES staff (id),
    created_at TIMESTAMP NOT NULL,
    extras JSONB
);

CREATE TABLE payments (
    id INTEGER PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings (id),
    amount NUMERIC(10, 2) NOT NULL,
    method TEXT NOT NULL,
    paid_at TIMESTAMP NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('paid', 'refunded'))
);

CREATE TABLE booking_services (
    booking_id INTEGER NOT NULL REFERENCES bookings (id),
    service_id INTEGER NOT NULL REFERENCES services (id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    PRIMARY KEY (booking_id, service_id)
);
`;

/* Описание таблиц для панели схемы: порядок показа и пояснение «что это». */
export const TABLE_INFO = [
    { name: "guests", title: "Гости" },
    { name: "bookings", title: "Брони" },
    { name: "rooms", title: "Номера" },
    { name: "payments", title: "Платежи" },
    { name: "services", title: "Услуги" },
    { name: "booking_services", title: "Услуги в брони" },
    { name: "staff", title: "Сотрудники" }
];

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
    const values = rows.map(row => `(${columns.map(column => literal(row[column])).join(", ")})`).join(",\n    ");

    return `INSERT INTO ${table} (${columns.join(", ")}) VALUES\n    ${values};`;
}

/* Полный SQL-скрипт: таблицы и данные. Порядок важен из-за внешних ключей. */
export function buildSeasonSeedSql() {
    const data = generateSeason();

    return [
        DDL,
        insert("rooms", ["id", "number", "floor", "kind", "capacity", "price_per_night"], data.rooms),
        insert("guests", ["id", "full_name", "email", "phone", "city", "created_at"], data.guests),
        insert("staff", ["id", "full_name", "role", "hired_on", "manager_id"], data.staff),
        insert("services", ["id", "title", "price"], data.services),
        insert(
            "bookings",
            ["id", "guest_id", "room_id", "check_in", "check_out", "status", "source", "staff_id", "created_at"],
            data.bookings
        ),
        insert("payments", ["id", "booking_id", "amount", "method", "paid_at", "status"], data.payments),
        insert("booking_services", ["booking_id", "service_id", "quantity"], data.bookingServices)
    ].join("\n\n");
}
