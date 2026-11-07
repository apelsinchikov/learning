import { describe, expect, it } from "vitest";
import { validateLesson, validateOpenApi, validateTask } from "./validator.js";

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

    it("для пустого paths даёт понятное сообщение", async () => {
        const yamlText = `
openapi: 3.0.3
info:
  title: Test API
  version: 1.0.0
paths:
`;

        const result = await validateLesson({}, yamlText);

        expect(result.openapiErrors).toHaveLength(1);
        expect(result.openapiErrors[0]).toContain(
            "Раздел paths пока пустой"
        );
    });
});


const VALID_SPEC = `
openapi: 3.0.3
info:
  title: Test API
  version: 1.0.0
paths:
  /users:
    get:
      summary: Get users
      responses:
        '200':
          description: ok
`;

describe("validateOpenApi (проверка без условий задания)", () => {
    it("валидная спецификация: ошибок нет, возвращается разобранный объект", async () => {
        const result = await validateOpenApi({ validation: { requiredPath: "/orders", method: "post" } }, VALID_SPEC);

        expect(result.openapiErrors).toEqual([]);
        expect(result.specification.paths["/users"].get.summary).toBe("Get users");
    });

    it("не проверяет условия задания: нужного endpoint нет, но ошибок OpenAPI тоже нет", async () => {
        const result = await validateOpenApi({ validation: { requiredPath: "/orders", method: "post" } }, VALID_SPEC);

        expect(result.openapiErrors).toEqual([]);
    });

    it("сломанный YAML: ошибка и нет спецификации", async () => {
        const result = await validateOpenApi({}, "openapi: [");

        expect(result.openapiErrors[0]).toContain("Ошибка YAML:");
        expect(result.specification).toBeNull();
    });

    it("пустой paths: понятное сообщение", async () => {
        const result = await validateOpenApi({}, "openapi: 3.0.3\ninfo:\n  title: T\n  version: 1.0.0\npaths:\n");

        expect(result.openapiErrors[0]).toContain("Раздел paths пока пустой");
    });

    it("урок с skipSpecValidation пропускает парсер Scalar", async () => {
        const result = await validateOpenApi(
            { validation: { skipSpecValidation: true } },
            "openapi: 3.0.3\ninfo:\n  title: Users API\n  version: 1.0.0\n"
        );

        expect(result.openapiErrors).toEqual([]);
    });
});

describe("validateTask (только условия задания)", () => {
    it("возвращает невыполненные условия", async () => {
        const { specification } = await validateOpenApi({}, VALID_SPEC);

        const errors = validateTask({ validation: { requiredPath: "/orders", method: "post" } }, specification);

        expect(errors).toEqual(["Добавь endpoint POST /orders."]);
    });

    it("пусто, когда условия выполнены", async () => {
        const { specification } = await validateOpenApi({}, VALID_SPEC);

        expect(validateTask({ validation: { requiredPath: "/users", method: "get" } }, specification)).toEqual([]);
    });

    it("у урока без validation условий нет", async () => {
        const { specification } = await validateOpenApi({}, VALID_SPEC);

        expect(validateTask({}, specification)).toEqual([]);
    });
});
