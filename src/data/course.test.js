import { describe, expect, it } from "vitest";
import { parse } from "yaml";

import { course } from "./course.js";
import { Theory } from "../components/Theory.js";
import { validateLesson } from "../utils/validator.js";

const practiceLessons = course.filter(lesson => lesson.type === "practice");

describe("структура курса", () => {
    it("у всех уроков уникальный id", () => {
        const ids = course.map(lesson => lesson.id);

        expect(new Set(ids).size).toBe(ids.length);
    });

    it.each(course.map(lesson => [lesson.id, lesson]))(
        "урок %s содержит обязательные поля",
        (_, lesson) => {
            for (const field of ["type", "icon", "title", "subtitle", "sidebarDescription"]) {
                expect(lesson[field], field).toBeTruthy();
            }

            expect(["theory", "practice"]).toContain(lesson.type);
        }
    );

    it.each(course.map(lesson => [lesson.id, lesson]))(
        "урок %s отображается без ошибок",
        (_, lesson) => {
            expect(() => Theory(lesson)).not.toThrow();
        }
    );

    it("ссылки theoryLinks указывают на существующие уроки", () => {
        for (const lesson of practiceLessons) {
            for (const id of lesson.theoryLinks || []) {
                expect(course.some(item => item.id === id), id).toBe(true);
            }
        }
    });
});

describe("практические уроки", () => {
    it.each(practiceLessons.map(lesson => [lesson.id, lesson]))(
        "%s: есть стартовый YAML, проверка и сообщение об успехе",
        (_, lesson) => {
            expect(lesson.initialYaml).toBeTruthy();
            expect(lesson.validation).toBeTruthy();
            expect(lesson.successMessage).toBeTruthy();
        }
    );

    it.each(practiceLessons.map(lesson => [lesson.id, lesson]))(
        "%s: стартовый YAML читается как YAML",
        (_, lesson) => {
            expect(() => parse(lesson.initialYaml)).not.toThrow();
        }
    );

    it.each(practiceLessons.map(lesson => [lesson.id, lesson]))(
        "%s: стартовый YAML ещё не решает задание",
        async (_, lesson) => {
            const result = await validateLesson(lesson, lesson.initialYaml);

            expect(
                result.openapiErrors.length + result.taskErrors.length
            ).toBeGreaterThan(0);
        }
    );

    it.each(practiceLessons.map(lesson => [lesson.id, lesson]))(
        "%s: в стартовом YAML нет пустых скобок {} и []",
        (_, lesson) => {
            expect(lesson.initialYaml).not.toMatch(/:\s*(\{\}|\[\])\s*$/m);
        }
    );
});

describe("порядок уроков", () => {
    it("практика идёт после всех теорий, на которые ссылается", () => {
        course.forEach((lesson, index) => {
            for (const id of lesson.theoryLinks || []) {
                const linkedIndex = course.findIndex(item => item.id === id);

                expect(
                    linkedIndex,
                    `${lesson.id} ссылается на ${id}, который стоит позже`
                ).toBeLessThan(index);
            }
        });
    });

    it("курс начинается с теории про API, а заканчивается best practices", () => {
        expect(course[0].id).toBe("theory-api-basics");
        expect(course[course.length - 1].id).toBe("theory-10");
    });
});

describe("новые практики принимают правильное решение", () => {
    const byId = id => course.find(lesson => lesson.id === id);

    it("practice-skeleton: openapi и info", async () => {
        const result = await validateLesson(
            byId("practice-skeleton"),
            "openapi: 3.0.3\ninfo:\n  title: Users API\n  version: 1.0.0\n"
        );

        expect(result.openapiErrors).toEqual([]);
        expect(result.taskErrors).toEqual([]);
    });

    it("practice-users-list: GET /users возвращает массив User", async () => {
        const lesson = byId("practice-users-list");

        const solved = lesson.initialYaml.replace(
            `          description: Users endpoint works`,
            `          description: Users found
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'`
        );

        const result = await validateLesson(lesson, solved);

        expect(result.openapiErrors).toEqual([]);
        expect(result.taskErrors).toEqual([]);
    });
});

describe("разделы заданий практики", () => {
    const SUPPORTED = [
        "code",
        "endpoint",
        "responses",
        "schema-table",
        "warning",
        "checklist",
        "goal",
        "text",
        "table",
        "highlight"
    ];

    const tasksWithSections = practiceLessons.filter(
        lesson => lesson.theory?.task?.sections
    );

    it.each(tasksWithSections.map(lesson => [lesson.id, lesson]))(
        "%s: все разделы задания умеют отображаться",
        (_, lesson) => {
            for (const section of lesson.theory.task.sections) {
                expect(SUPPORTED, section.title).toContain(section.type);
            }
        }
    );

    it("practice-9: в описании задания нет готового решения для User", () => {
        const lesson = practiceLessons.find(item => item.id === "practice-9");
        const html = Theory(lesson);

        expect(html).not.toContain("#/components/schemas/UserPhone");
        expect(html).not.toContain("#/components/schemas/UserDevice");
        expect(html).toContain("orders");
    });

    it("practice-9: ТЗ достаточно, чтобы решить задание", async () => {
        const lesson = practiceLessons.find(item => item.id === "practice-9");

        const solved = `openapi: 3.0.3
info:
  title: Users API
  version: 1.0.0
paths:
  /users/{id}:
    get:
      summary: Get user
      operationId: getUser
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: User found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
              example:
                id: 1
                firstName: Ivan
                lastName: Ivanov
                phones: []
                address: []
                devices: []
        '404':
          description: User not found
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
        firstName:
          type: string
        lastName:
          type: string
        phones:
          type: array
          items:
            $ref: '#/components/schemas/UserPhone'
        address:
          type: array
          items:
            $ref: '#/components/schemas/UserAddress'
        devices:
          type: array
          items:
            $ref: '#/components/schemas/UserDevice'
      required: [id, firstName, lastName, phones, address, devices]
    UserPhone:
      type: object
      properties:
        phone:
          type: string
        type:
          type: string
      required: [phone, type]
    UserAddress:
      type: object
      properties:
        city:
          type: string
        street:
          type: string
        house:
          type: string
        apartment:
          type: string
      required: [city, street, house, apartment]
    UserDevice:
      type: object
      properties:
        name:
          type: string
        operatingSystem:
          type: string
        inventoryNumber:
          type: string
      required: [name, operatingSystem, inventoryNumber]
`;

        const result = await validateLesson(lesson, solved);

        expect(result.openapiErrors).toEqual([]);
        expect(result.taskErrors).toEqual([]);
    });
});
