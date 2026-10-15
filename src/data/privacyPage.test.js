import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("страница политики конфиденциальности", () => {
    const html = readFileSync(new URL("../../public/privacy.html", import.meta.url), "utf8");

    it("описывает, какие данные собираются и где хранятся", () => {
        expect(html).toContain("Политика конфиденциальности");
        expect(html).toContain("Google или Яндекс");
        expect(html).toContain("Supabase");
        expect(html).toContain("Удаление данных");
    });
});
