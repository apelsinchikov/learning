import { describe, expect, it } from "vitest";

import { CourseTabs } from "./CourseTabs.js";
import { Header } from "./Header.js";

describe("CourseTabs", () => {
    it("три вкладки со ссылками на хеш-адреса", () => {
        const html = CourseTabs();

        expect(html).toContain('href="#/"');
        expect(html).toContain('href="#/sql"');
        expect(html).toContain('href="#/diagrams"');
        expect(html).toContain(">Диаграммы</a>");
    });

    it("активная вкладка отмечена", () => {
        expect(CourseTabs({ active: "sql" })).toContain('course-tab--sql course-tab--active');
        expect(CourseTabs({ active: "openapi" })).not.toContain("course-tab--sql course-tab--active");
    });

    it("вкладка «Диаграммы» активна на своём курсе", () => {
        expect(CourseTabs({ active: "diagrams" })).toContain("course-tab--diagrams course-tab--active");
        expect(CourseTabs({ active: "sql" })).not.toContain("course-tab--diagrams course-tab--active");
    });

    it("на вкладке SQL нет замка: курс открыт для всех", () => {
        expect(CourseTabs()).not.toContain("course-tab__lock");
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

    it("для «Диаграмм» — свой заголовок и модификатор", () => {
        const html = Header({ course: "diagrams", summary: "" });

        expect(html).toContain("header--diagrams");
        expect(html).toContain("Диаграммы: проект отеля");
        expect(html).not.toContain("header--sql");
    });

    it("кнопка входа остаётся в шапке обоих курсов", () => {
        expect(Header({ course: "sql", summary: "" })).toContain('data-action="open-login"');
        expect(Header({})).toContain('data-action="open-login"');
    });
});
