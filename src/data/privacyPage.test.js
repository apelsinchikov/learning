import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("страница политики конфиденциальности", () => {
    const html = readFileSync(new URL("../../public/privacy.html", import.meta.url), "utf8");

    it("описывает, какие данные собираются и где хранятся", () => {
        expect(html).toContain("Политика конфиденциальности");
        expect(html).toContain("Google или Яндекс");
        expect(html).toContain("Supabase");
        expect(html).toContain("Ваши права");
    });
});

describe("политика конфиденциальности для проверки Google", () => {
    const html = readFileSync(new URL("../../public/privacy.html", import.meta.url), "utf8");
    const index = readFileSync(new URL("../../index.html", import.meta.url), "utf8");

    it("главная страница в статическом HTML ссылается на политику", () => {
        expect(index).toContain('href="privacy.html"');
    });

    it.each([
        "Какие данные мы получаем",
        "Как мы используем данные",
        "Кому мы передаём данные",
        "Срок хранения",
        "Ваши права",
        "Файлы cookie и localStorage",
        "Google API Services User Data Policy",
        "Limited Use",
        "Supabase",
        "evgenyassylov@gmail.com"
    ])("в политике есть раздел или упоминание: %s", text => {
        expect(html).toContain(text);
    });

    it("политика достаточно подробная", () => {
        const text = html.replace(/<[^>]+>/g, " ");

        expect(text.length).toBeGreaterThan(2500);
    });
});

describe("подтверждение владения сайтом в Google Search Console", () => {
    it("файл подтверждения лежит в public с точным содержимым", () => {
        const file = readFileSync(
            new URL("../../public/google6b14ffeb5266d7f6.html", import.meta.url),
            "utf8"
        );

        expect(file.trim()).toBe(
            "google-site-verification: google6b14ffeb5266d7f6.html"
        );
    });
});
