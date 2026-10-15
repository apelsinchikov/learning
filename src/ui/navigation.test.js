import { describe, expect, it, vi } from "vitest";

import { bindLessonList, initNavigation } from "./navigation.js";
import { course } from "../data/course.js";

/* Поддельный корень страницы: находит «кнопки» по селектору. */
function fakeRoot(buttons) {
    return {
        querySelectorAll: selector => buttons[selector] || []
    };
}

function fakeButton(dataset = {}) {
    const handlers = [];

    return {
        dataset,
        addEventListener: (type, handler) => handlers.push(handler),
        click: () => handlers.forEach(handler => handler())
    };
}

describe("навигация по урокам", () => {
    it("кнопки «Следующий/Предыдущий» переходят на соседние уроки", () => {
        const next = fakeButton();
        const previous = fakeButton();
        const go = vi.fn();
        const root = fakeRoot({
            ".nav-button--next": [next],
            ".nav-button--previous": [previous]
        });

        initNavigation(5, go, { root });
        next.click();
        previous.click();

        expect(go).toHaveBeenCalledWith(6);
        expect(go).toHaveBeenCalledWith(4);
    });

    it("onNext вызывается перед переходом только для кнопки «Следующий урок»", () => {
        const next = fakeButton();
        const previous = fakeButton();
        const order = [];
        const root = fakeRoot({
            ".nav-button--next": [next],
            ".nav-button--previous": [previous]
        });

        initNavigation(5, index => order.push(`go:${index}`), {
            root,
            onNext: () => order.push("next")
        });
        previous.click();
        next.click();

        expect(order).toEqual(["go:4", "next", "go:6"]);
    });

    it("список уроков переходит на выбранный индекс", () => {
        const lesson = fakeButton({ lessonIndex: "7" });
        const go = vi.fn();

        bindLessonList(go, fakeRoot({ ".lesson": [lesson] }));
        lesson.click();

        expect(go).toHaveBeenCalledWith(7);
    });

    it("несуществующий индекс игнорируется", () => {
        const lesson = fakeButton({ lessonIndex: String(course.length) });
        const go = vi.fn();

        bindLessonList(go, fakeRoot({ ".lesson": [lesson] }));
        lesson.click();

        expect(go).toHaveBeenCalledTimes(0);
    });
});
