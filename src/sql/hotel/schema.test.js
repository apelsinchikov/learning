import { describe, expect, it } from "vitest";

import { findTable, tablesMentioned, TABLES } from "./schema.js";
import { guests, keyLog, orders, rooms, staff } from "./data.js";

describe("схема отеля", () => {
    it("пять таблиц с числом строк как в данных", () => {
        const counts = Object.fromEntries(TABLES.map(table => [table.name, table.rows]));

        expect(counts).toEqual({
            rooms: rooms.length,
            guests: guests.length,
            staff: staff.length,
            key_log: keyLog.length,
            orders: orders.length
        });
    });

    it("findTable ищет по точному имени", () => {
        expect(findTable("guests").name).toBe("guests");
        expect(findTable("нет")).toBeNull();
    });

    it("tablesMentioned находит таблицы в запросе", () => {
        expect(tablesMentioned("select * from guests g join rooms r using (room_id)")).toEqual([
            "guests",
            "rooms"
        ]);
    });
});

describe("данные отеля согласованы", () => {
    it("у каждого гостя есть комната", () => {
        const ids = new Set(rooms.map(room => room.room_id));

        expect(guests.every(guest => ids.has(guest.room_id))).toBe(true);
    });

    it("записи журнала ссылаются на существующие комнаты и людей", () => {
        const roomIds = new Set(rooms.map(room => room.room_id));
        const guestIds = new Set(guests.map(guest => guest.id));
        const staffIds = new Set(staff.map(person => person.id));

        for (const row of keyLog) {
            expect(roomIds.has(row.room_id)).toBe(true);
            expect(Boolean(row.guest_id) !== Boolean(row.staff_id)).toBe(true);

            if (row.guest_id) {
                expect(guestIds.has(row.guest_id)).toBe(true);
            } else {
                expect(staffIds.has(row.staff_id)).toBe(true);
            }
        }
    });

    it("данные детерминированы: журнал не меняется между сборками", () => {
        expect(keyLog.length).toBe(243);
        expect(orders.length).toBe(68);
    });
});
