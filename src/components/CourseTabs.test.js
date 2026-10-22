import { describe, expect, it } from "vitest";

import { CourseTabs } from "./CourseTabs.js";
import { Header } from "./Header.js";

describe("CourseTabs", () => {
    it("две вкладки со ссылками на хеш-адреса", () => {
        const html = CourseTabs();

        expect(html).toContain('href="#/"');
        expect(html).toContain('href="#/sql"');
    });

    it("активная вкладка отмечена", () => {
        expect(CourseTabs({ active: "sql" })).toContain('course-tab--sql course-tab--active');
        expect(CourseTabs({ active: "openapi" })).not.toContain("course-tab--sql course-tab--active");
    });

    it("замок только пока курс закрыт", () => {
        expect(CourseTabs({ sqlLocked: true })).toContain("course-tab__lock");
        expect(CourseTabs({ sqlLocked: false })).not.toContain("course-tab__lock");
    });
});

describe("Header с вкладками", () => {
    it("по умолчанию это шапка OpenAPI с вкладками", () => {
        const html = Header({});

        expect(html).toContain("OpenAPI Course");
        expect(html).toContain("course-tabs");
        expect(html).not.toContain("header--sql");
    });

    it("для SQL — свой заголовок и свой прогресс", () => {
        const html = Header({ course: "sql", summary: "<div class='my-summary'></div>" });

        expect(html).toContain("header--sql");
        expect(html).toContain("my-summary");
        expect(html).toContain("тайна отеля");
    });

    it("кнопка входа остаётся в шапке обоих курсов", () => {
        expect(Header({ course: "sql", summary: "" })).toContain('data-action="open-login"');
        expect(Header({})).toContain('data-action="open-login"');
    });
});
