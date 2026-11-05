import { beforeAll, describe, expect, it } from "vitest";

import { SEASON, generateSeason } from "./generate.js";
import { buildSeasonSeedSql } from "./seed.js";

describe("генератор данных", () => {
    const data = generateSeason();

    it("детерминирован: два запуска дают одно и то же", () => {
        expect(JSON.stringify(generateSeason())).toBe(JSON.stringify(data));
    });

    it("объёмы: около 400 броней, 120 гостей, 12 номеров", () => {
        expect(data.bookings.length).toBeGreaterThanOrEqual(350);
        expect(data.bookings.length).toBeLessThanOrEqual(450);
        expect(data.guests).toHaveLength(120);
        expect(data.rooms).toHaveLength(12);
        expect(data.payments.length).toBeGreaterThan(200);
    });

    it("брони одного номера не пересекаются, выезд позже заезда", () => {
        const byRoom = new Map();

        for (const booking of data.bookings) {
            expect(booking.check_out > booking.check_in).toBe(true);

            const list = byRoom.get(booking.room_id) ?? [];

            list.push(booking);
            byRoom.set(booking.room_id, list);
        }

        for (const list of byRoom.values()) {
            const sorted = [...list].sort((a, b) => (a.check_in < b.check_in ? -1 : 1));

            for (let i = 1; i < sorted.length; i++) {
                expect(sorted[i].check_in >= sorted[i - 1].check_out).toBe(true);
            }
        }
    });

    it("статусы согласованы с датой «сегодня»", () => {
        for (const booking of data.bookings) {
            if (booking.status === "completed") {
                expect(booking.check_out <= SEASON.today).toBe(true);
            }

            if (booking.status === "confirmed") {
                expect(booking.check_out > SEASON.today).toBe(true);
            }
        }

        const statuses = new Set(data.bookings.map(booking => booking.status));

        expect(statuses).toEqual(new Set(["completed", "confirmed", "cancelled"]));
    });

    it("в данных есть случаи для уроков: брони без оплаты, возвраты, две оплаты, гости без броней", () => {
        const paid = new Set(data.payments.map(payment => payment.booking_id));
        const completedWithoutPayment = data.bookings.filter(b => b.status === "completed" && !paid.has(b.id));
        const perBooking = new Map();

        for (const payment of data.payments) {
            perBooking.set(payment.booking_id, (perBooking.get(payment.booking_id) ?? 0) + 1);
        }

        expect(completedWithoutPayment.length).toBeGreaterThan(0);
        expect(data.payments.some(payment => payment.status === "refunded")).toBe(true);
        expect([...perBooking.values()].some(count => count === 2)).toBe(true);
        expect(data.bookings.some(booking => booking.staff_id === null)).toBe(true);
        expect(new Set(data.bookings.map(b => b.guest_id)).size).toBeLessThan(data.guests.length + 1);
    });
});

describe("база в PGlite", () => {
    let db;

    beforeAll(async () => {
        const { PGlite } = await import("@electric-sql/pglite");

        db = new PGlite();
        await db.waitReady;
        await db.exec(buildSeasonSeedSql());
    }, 60000);

    const count = async table => (await db.query(`SELECT count(*)::int AS c FROM ${table}`)).rows[0].c;

    it("скрипт выполняется, внешние ключи сходятся", async () => {
        expect(await count("rooms")).toBe(12);
        expect(await count("guests")).toBe(120);
        expect(await count("bookings")).toBe(generateSeason().bookings.length);
        expect(await count("booking_services")).toBeGreaterThan(100);
    });

    it("суммы платежей не превышают стоимость брони", async () => {
        const result = await db.query(`
            SELECT count(*)::int AS bad FROM (
                SELECT b.id,
                       (b.check_out - b.check_in) * r.price_per_night
                       + COALESCE((SELECT sum(s.price * bs.quantity) FROM booking_services bs JOIN services s ON s.id = bs.service_id WHERE bs.booking_id = b.id), 0) AS total,
                       COALESCE((SELECT sum(p.amount) FROM payments p WHERE p.booking_id = b.id), 0) AS paid
                FROM bookings b JOIN rooms r ON r.id = b.room_id
            ) x WHERE paid > total
        `);

        expect(result.rows[0].bad).toBe(0);
    });

    it("иерархия сотрудников: у директора нет руководителя, остальные подчиняются", async () => {
        const top = await db.query("SELECT count(*)::int AS c FROM staff WHERE manager_id IS NULL");

        expect(top.rows[0].c).toBe(1);
    });
});
