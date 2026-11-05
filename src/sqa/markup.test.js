import { describe, expect, it } from "vitest";

import { renderSqaRich } from "./markup.js";

describe("renderSqaRich", () => {
    it("название таблицы становится кнопкой", () => {
        const html = renderSqaRich("Возьмите [[table:bookings]] и [[table:guests]].");

        expect(html).toContain('data-table-ref="bookings"');
        expect(html).toContain('data-table-ref="guests"');
    });

    it("ссылка «Повторить» несёт курс и урок", () => {
        const html = renderSqaRich("Вспомните [[sql:sql-inner-join|INNER JOIN]].");

        expect(html).toContain('data-peek="sql:sql-inner-join"');
        expect(html).toContain(">INNER JOIN</button>");
    });

    it("HTML в тексте экранируется, обычная разметка работает", () => {
        const html = renderSqaRich("<script>x</script> и `код` и **жирный**");

        expect(html).not.toContain("<script>");
        expect(html).toContain("&lt;script&gt;");
        expect(html).toContain("inline-code");
        expect(html).toContain("<strong>жирный</strong>");
    });
});
