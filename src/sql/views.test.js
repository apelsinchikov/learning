import { describe, expect, it } from "vitest";

import { highlightSqlHtml, tokenizeSql } from "./highlight.js";
import { joinRows, renderJoinVisual } from "./joinVisual.js";
import { renderRich } from "./richText.js";
import { sqlLessons } from "./lessons/index.js";
import { createEmptyProgress, markRead, markSolved } from "../progress/progressModel.js";
import { collectCheats, collectClues, renderAside, renderNotebook } from "./views/aside.js";
import { countDone, countSolved, lessonStatus, neighbours, renderSqlProgress, renderSqlSidebar, statusKey } from "./views/nav.js";
import { renderErrorBox, renderResultTable } from "./views/resultTable.js";
import { renderLessonPage, renderSandboxPage, renderSolved, renderVerdict } from "./views/task.js";

describe("подсветка SQL", () => {
    it("склеенные части дают исходный запрос", () => {
        const sql = "SELECT 'а''б', 12 -- ком\nFROM guests";

        expect(tokenizeSql(sql).map(token => token.text).join("")).toBe(sql);
    });

    it("распознаёт ключевые слова, функции, строки, числа, комментарии", () => {
        const types = Object.fromEntries(
            tokenizeSql("select count(*) from t where a = 'x' and b > 3 -- c")
                .filter(token => token.type !== "space" && token.type !== "punct")
                .map(token => [token.text, token.type])
        );

        expect(types.select).toBe("keyword");
        expect(types.count).toBe("function");
        expect(types["'x'"]).toBe("string");
        expect(types["3"]).toBe("number");
        expect(types["-- c"]).toBe("comment");
        expect(types.t).toBe("name");
    });

    it("HTML экранируется", () => {
        const html = highlightSqlHtml("SELECT '<b>' FROM t WHERE a < 3");

        expect(html).not.toContain("<b>");
        expect(html).toContain("&lt;b&gt;");
        expect(html).toContain("&lt; ");
    });
});

describe("richText", () => {
    it("абзацы, списки, код и жирный", () => {
        const html = renderRich("Привет, `код` и **жирный**.\n\n- один\n- два");

        expect(html).toContain("<p>");
        expect(html).toContain("<code");
        expect(html).toContain("<strong>жирный</strong>");
        expect(html).toContain("<ul");
        expect(html.match(/<li>/g).length).toBe(2);
    });

    it("опасный HTML не проходит", () => {
        expect(renderRich("<script>alert(1)</script>")).not.toContain("<script>");
    });
});

describe("joinVisual", () => {
    it("число строк для каждого вида соединения", () => {
        expect(joinRows("cross").length).toBe(9);
        expect(joinRows("inner").length).toBe(2);
        expect(joinRows("left").length).toBe(4);
        expect(joinRows("right").length).toBe(3);
        expect(joinRows("full").length).toBe(5);
    });

    it("в левом соединении у гостя без заказов справа NULL", () => {
        const html = renderJoinVisual("left");

        expect(html).toContain("NULL");
        expect(html).toContain("join-visual__row--left-only");
    });
});

describe("таблица результата", () => {
    const result = { columns: [{ name: "a" }, { name: "b" }], rows: [[1, null], ["<i>", 3]] };

    it("показывает число строк, NULL и экранирует значения", () => {
        const html = renderResultTable(result);

        expect(html).toContain("Найдено: 2 строки");
        expect(html).toContain("NULL");
        expect(html).not.toContain("<i>");
    });

    it("пустой результат объясняется", () => {
        expect(renderResultTable({ columns: [{ name: "a" }], rows: [] })).toContain("Ничего не найдено");
    });

    it("длинный результат обрезается и об этом сказано", () => {
        const rows = Array.from({ length: 250 }, (_, i) => [i]);

        expect(renderResultTable({ columns: [{ name: "n" }], rows })).toContain("ещё 50");
    });

    it("ошибка показывается без разметки из текста", () => {
        expect(renderErrorBox({ title: "<b>", text: "<i>" })).not.toContain("<b>");
    });
});

describe("блокнот, шпаргалка, навигация", () => {
    it("пустой прогресс: улик и шпаргалки нет", () => {
        const progress = createEmptyProgress();

        expect(collectClues(progress)).toEqual([]);
        expect(collectCheats(progress)).toEqual([]);
        expect(renderNotebook(progress)).toContain("Блокнот пуст");
        expect(countSolved(progress)).toBe(0);
    });

    it("решённый урок даёт улику и строки шпаргалки", () => {
        const progress = markSolved(createEmptyProgress(), "sql-where");

        expect(collectClues(progress).map(clue => clue.lessonId)).toEqual(["sql-where"]);
        expect(collectCheats(progress)[0].items.length).toBeGreaterThan(0);
        expect(countSolved(progress)).toBe(1);
        expect(renderAside(progress, { tab: "notebook" })).toContain("Восемь москвичей");
    });

    it("улики идут в порядке уроков, а не решения", () => {
        let progress = createEmptyProgress();
        progress = markSolved(progress, "sql-final");
        progress = markSolved(progress, "sql-select-star");

        expect(collectClues(progress).map(clue => clue.number)).toEqual([2, 28]);
    });

    it("прогресс в шапке и сайдбар отмечают решённые", () => {
        const progress = markSolved(createEmptyProgress(), "sql-select-star");

        expect(renderSqlProgress(progress)).toContain("1 / 28");
        expect(renderSqlSidebar("sql-select-star", progress)).toContain("is-done");
        expect(renderSqlSidebar("sql-select-star", progress)).toContain("is-active");
        expect(renderSqlSidebar("sandbox", progress)).toContain("Песочница");
    });

    it("прочитанный урок: галочка есть, но улик и решённых нет", () => {
        const progress = markRead(createEmptyProgress(), "sql-where");
        const sidebar = renderSqlSidebar("sql-select-star", progress);

        expect(lessonStatus(progress, "sql-where")).toBe("read");
        expect(countSolved(progress)).toBe(0);
        expect(countDone(progress)).toBe(1);
        expect(collectClues(progress)).toEqual([]);
        expect(renderSqlProgress(progress)).toContain("1 / 28");
        expect(sidebar).toContain("is-read");
        expect(sidebar).not.toContain("is-done");
    });

    it("решённый урок важнее прочитанного и считается один раз", () => {
        let progress = markRead(createEmptyProgress(), "sql-where");
        progress = markSolved(progress, "sql-where");

        expect(lessonStatus(progress, "sql-where")).toBe("solved");
        expect(countDone(progress)).toBe(1);
        expect(lessonStatus(progress, "sql-final")).toBeNull();
    });

    it("ключ отметок меняется при чтении и при решении", () => {
        const empty = createEmptyProgress();
        const read = markRead(empty, "sql-where");
        const solved = markSolved(read, "sql-where");

        expect(new Set([statusKey(empty), statusKey(read), statusKey(solved)]).size).toBe(3);
    });

    it("ссылка «дальше» помечена для отметки прочитанного", () => {
        const html = renderLessonPage(sqlLessons[0], { solved: false, hintsShown: 0, chosen: null, verdictChoice: null });

        expect(html).toContain("data-mark-read");
    });

    it("соседние уроки", () => {
        expect(neighbours(sqlLessons[0].id).previous).toBeNull();
        expect(neighbours(sqlLessons[0].id).next.id).toBe(sqlLessons[1].id);
        expect(neighbours(sqlLessons[27].id).next).toBeNull();
    });
});

describe("страницы уроков", () => {
    it("каждый из 28 уроков отрисовывается без ошибок", () => {
        for (const lesson of sqlLessons) {
            const html = renderLessonPage(lesson, { solved: false, hintsShown: 0, chosen: null, verdictChoice: null });

            expect(html).toContain(lesson.title);
            expect(html).toContain("data-feedback");
        }
    });

    it("решённый урок показывает улику и ссылку на следующий", () => {
        const html = renderSolved(sqlLessons[1]);

        expect(html).toContain(sqlLessons[1].task.clue.title);
        expect(html).toContain(sqlLessons[2].id);
    });

    it("у последнего урока вместо «дальше» песочница, а вердикт предлагает выбрать", () => {
        const last = sqlLessons[27];
        const html = renderSolved(last);

        expect(html).toContain("#/sql/sandbox");
        expect(html).toContain("data-verdict-submit");
    });

    it("верный и неверный вердикт", () => {
        const { verdict } = sqlLessons[27].task;
        const rightIndex = verdict.suspects.findIndex(suspect => suspect.correct);
        const wrongIndex = verdict.suspects.findIndex(suspect => !suspect.correct);

        expect(renderVerdict(verdict, rightIndex)).toContain("Дело закрыто");
        expect(renderVerdict(verdict, wrongIndex)).toContain("Не он");
        expect(renderVerdict(verdict, null)).not.toContain("Дело закрыто");
    });

    it("песочница", () => {
        expect(renderSandboxPage()).toContain("data-editor");
    });

    it("урок с выбором не содержит редактор", () => {
        const html = renderLessonPage(sqlLessons[0], { solved: false, hintsShown: 0, chosen: null, verdictChoice: null });

        expect(html).not.toContain("data-editor");
        expect(html).toContain("data-choice-submit");
    });
});
