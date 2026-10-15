import { describe, expect, it } from "vitest";

import { course } from "./course.js";

describe("версии и вложенность адресов", () => {
    it("в практике про каркас объяснены версия OpenAPI и версия API", () => {
        const text = JSON.stringify(course.find(item => item.id === "practice-skeleton").theory);

        expect(text).toContain("Две разные версии");
        expect(text).toContain("/v1/users");
    });

    it("про адрес /users/42 сказано как про вложенность, а не как про жёсткое правило", () => {
        const text = JSON.stringify(course.find(item => item.id === "theory-2").theory);

        expect(text).toContain("Слеш показывает вложенность");
        expect(text).not.toContain("Номер пишется после слеша");
    });
});
