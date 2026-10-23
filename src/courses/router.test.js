import { describe, expect, it } from "vitest";

import {
    courseHash,
    diagramsHash,
    isDiagramsRoute,
    isHashCourseRoute,
    isSqlRoute,
    parseRoute,
    rememberReturnRoute,
    sqlHash,
    takeReturnRoute
} from "./router.js";

function fakeStorage() {
    const data = new Map();

    return {
        getItem: key => (data.has(key) ? data.get(key) : null),
        setItem: (key, value) => data.set(key, String(value)),
        removeItem: key => data.delete(key)
    };
}

describe("router", () => {
    it("пустой хеш и старые адреса — курс OpenAPI", () => {
        expect(parseRoute("")).toEqual({ course: "openapi", lessonId: null });
        expect(parseRoute("#/")).toEqual({ course: "openapi", lessonId: null });
        expect(parseRoute("#/что-то")).toEqual({ course: "openapi", lessonId: null });
    });

    it("#/sql — курс SQL без урока", () => {
        expect(parseRoute("#/sql")).toEqual({ course: "sql", lessonId: null });
        expect(parseRoute("#/sql/")).toEqual({ course: "sql", lessonId: null });
    });

    it("#/sql/<id> — урок, id раскодируется", () => {
        expect(parseRoute("#/sql/sql-select")).toEqual({ course: "sql", lessonId: "sql-select" });
        expect(parseRoute("#/sql/a%20b").lessonId).toBe("a b");
    });

    it("битая кодировка не роняет разбор", () => {
        expect(parseRoute("#/sql/%E0%A4%A")).toEqual({ course: "sql", lessonId: null });
    });

    it("sqlHash собирает адрес и обратно разбирается", () => {
        expect(sqlHash()).toBe("#/sql");
        expect(parseRoute(sqlHash("sql-join")).lessonId).toBe("sql-join");
    });

    it("isSqlRoute", () => {
        expect(isSqlRoute("#/sql/sandbox")).toBe(true);
        expect(isSqlRoute("#/")).toBe(false);
        expect(isSqlRoute(undefined)).toBe(false);
    });

    it("возврат после входа: запомнить и забрать один раз", () => {
        const storage = fakeStorage();

        rememberReturnRoute(storage, "#/sql/sql-join");

        expect(takeReturnRoute(storage, "")).toBe("#/sql/sql-join");
        expect(takeReturnRoute(storage, "")).toBeNull();
    });

    it("адрес не из SQL не запоминается", () => {
        const storage = fakeStorage();

        rememberReturnRoute(storage, "#/");

        expect(takeReturnRoute(storage, "")).toBeNull();
    });

    it("если уже на странице SQL, возвращать не нужно", () => {
        const storage = fakeStorage();

        rememberReturnRoute(storage, "#/sql/x");

        expect(takeReturnRoute(storage, "#/sql")).toBeNull();
    });

    it("без хранилища ничего не падает", () => {
        expect(() => rememberReturnRoute(null, "#/sql")).not.toThrow();
        expect(takeReturnRoute(null, "")).toBeNull();
    });

    it("#/diagrams — курс «Диаграммы», урок и песочница", () => {
        expect(parseRoute("#/diagrams")).toEqual({ course: "diagrams", lessonId: null });
        expect(parseRoute("#/diagrams/dg-er-keys")).toEqual({ course: "diagrams", lessonId: "dg-er-keys" });
        expect(parseRoute(diagramsHash("sandbox")).lessonId).toBe("sandbox");
        expect(courseHash("diagrams", "dg-x")).toBe("#/diagrams/dg-x");
    });

    it("isDiagramsRoute и isHashCourseRoute", () => {
        expect(isDiagramsRoute("#/diagrams/x")).toBe(true);
        expect(isDiagramsRoute("#/sql")).toBe(false);
        expect(isHashCourseRoute("#/sql")).toBe(true);
        expect(isHashCourseRoute("#/diagrams")).toBe(true);
        expect(isHashCourseRoute("#/")).toBe(false);
    });

    it("возврат после входа работает и для «Диаграмм»", () => {
        const storage = fakeStorage();

        rememberReturnRoute(storage, "#/diagrams/dg-er-keys");

        expect(takeReturnRoute(storage, "")).toBe("#/diagrams/dg-er-keys");
        expect(takeReturnRoute(storage, "")).toBeNull();
    });
});
