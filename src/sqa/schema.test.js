import { beforeAll, describe, expect, it } from "vitest";

import { buildSeasonSeedSql } from "./db/seed.js";
import { createEngineCore } from "./engineCore.js";
import { SCHEMA_SQL, buildSchema, countRowsSql, schemaToEr, shortType } from "./schema.js";

let engine;

beforeAll(async () => {
    engine = createEngineCore({
        loadPglite: async () => (await import("@electric-sql/pglite")).PGlite,
        seedSql: buildSeasonSeedSql()
    });
    await engine.init();
}, 60000);

async function schemaOf(sql = "SELECT 1") {
    const result = await engine.run({ sql, probes: [SCHEMA_SQL] });

    return buildSchema(result.probes[0].rows[0][0]);
}

describe("схема из каталога", () => {
    it("находит все семь таблиц курса", async () => {
        const schema = await schemaOf();

        expect(schema.map(table => table.name)).toEqual([
            "booking_services",
            "bookings",
            "guests",
            "payments",
            "rooms",
            "services",
            "staff"
        ]);
    });

    it("ключи: PK, FK со ссылкой, UK; составной PK у booking_services", async () => {
        const schema = await schemaOf();
        const bookings = schema.find(table => table.name === "bookings");
        const guestId = bookings.columns.find(column => column.name === "guest_id");
        const link = schema.find(table => table.name === "booking_services");

        expect(bookings.columns[0]).toMatchObject({ name: "id", keys: ["PK"] });
        expect(guestId).toMatchObject({ keys: ["FK"], ref: "guests.id", nullable: false });
        expect(bookings.columns.find(column => column.name === "staff_id").nullable).toBe(true);
        expect(schema.find(table => table.name === "guests").columns.find(c => c.name === "email").keys).toEqual(["UK"]);
        expect(link.primaryKey).toEqual(["booking_id", "service_id"]);
        expect(link.columns.find(column => column.name === "booking_id").keys).toEqual(["PK", "FK"]);
        expect(bookings.checks[0].definition).toContain("status");
    });

    it("видит таблицу и индекс, созданные запросом ученика", async () => {
        const schema = await schemaOf(
            "CREATE TABLE notes (id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY, body text NOT NULL DEFAULT ''); CREATE INDEX ix_notes ON notes (body)"
        );
        const notes = schema.find(table => table.name === "notes");

        expect(notes.columns.map(column => column.name)).toEqual(["id", "body"]);
        expect(notes.columns[0].identity).toBe("a");
        expect(notes.columns[1].default).toBe("''::text");
        expect(notes.indexes.map(index => index.name)).toEqual(["ix_notes"]);
    });

    it("видит представление", async () => {
        const schema = await schemaOf("CREATE VIEW v_guests AS SELECT id, full_name FROM guests");

        expect(schema.find(table => table.name === "v_guests")).toMatchObject({ kind: "view" });
    });

    it("число строк считается одним запросом", async () => {
        const result = await engine.run({ sql: countRowsSql(["rooms", "guests"]) });

        expect(Object.fromEntries(result.rows)).toEqual({ rooms: 12, guests: 120 });
    });
});

describe("ER-диаграмма", () => {
    it("строится из схемы: сущности, ключи, связи", async () => {
        const text = schemaToEr(await schemaOf());

        expect(text.startsWith("erDiagram")).toBe(true);
        expect(text).toContain("guests ||--o{ bookings");
        expect(text).toContain("bookings ||--o{ payments");
        expect(text).toContain("staff o|--o{ staff");
        expect(text).toContain("int booking_id PK, FK");
        expect(text).not.toMatch(/numeric\(/);
    });

    it("типы сводятся к одному слову", () => {
        expect(shortType("numeric(10,2)")).toBe("numeric");
        expect(shortType("timestamp without time zone")).toBe("timestamp");
        expect(shortType("character varying(50)")).toBe("varchar");
        expect(shortType("double precision")).toBe("double_precision");
    });
});
