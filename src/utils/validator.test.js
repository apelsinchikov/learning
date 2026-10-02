import { describe, expect, it } from "vitest";
import { validateLesson } from "./validator.js";

describe("validateLesson", () => {
    it("возвращает ошибку для некорректного YAML", async () => {
        const lesson = {};

        const result = await validateLesson(
            lesson,
            "openapi: ["
        );

        expect(result.openapiErrors).toHaveLength(1);
        expect(result.openapiErrors[0]).toContain(
            "Ошибка YAML:"
        );
        expect(result.taskErrors).toEqual([]);
    });

    it("возвращает ошибку, если YAML не является объектом", async () => {
        const lesson = {};

        const result = await validateLesson(
            lesson,
            "hello"
        );

        expect(result.openapiErrors).toEqual([
            "OpenAPI-спецификация должна быть YAML-объектом."
        ]);
        expect(result.taskErrors).toEqual([]);
    });

    it("при корректной OpenAPI без validation не содержит ошибок", async () => {
        const lesson = {};

        const yamlText = `
openapi: 3.0.3
info:
  title: Test API
  version: 1.0.0
paths: {}
`;

        const result = await validateLesson(
            lesson,
            yamlText
        );

        expect(result.openapiErrors).toEqual([]);
        expect(result.taskErrors).toEqual([]);
    });

    it("проверяет обязательный endpoint урока", async () => {
        const lesson = {
            validation: {
                requiredPath: "/users",
                method: "get"
            }
        };

        const yamlText = `
openapi: 3.0.3
info:
  title: Test API
  version: 1.0.0
paths: {}
`;

        const result = await validateLesson(
            lesson,
            yamlText
        );

        expect(result.openapiErrors).toEqual([]);
        expect(result.taskErrors).toEqual([
            "Добавь endpoint GET /users."
        ]);
    });
});