import { describe, expect, it } from "vitest";

import { readSidebarScroll, restoreSidebarScroll } from "./sidebarScroll.js";

/* Поддельный сайдбар: высота окна 300, текущий урок на заданной глубине. */
function fakeRoot({ scrollTop = 0, itemTop = 0, itemHeight = 40, present = true } = {}) {
    const sidebar = {
        scrollTop,
        clientHeight: 300,
        getBoundingClientRect: () => ({ top: 0 }),
        querySelector: () =>
            present
                ? {
                      offsetHeight: itemHeight,
                      // положение элемента в окне = его глубина в списке минус текущая прокрутка
                      getBoundingClientRect: () => ({ top: itemTop - sidebar.scrollTop })
                  }
                : null
    };

    return { sidebar, root: { querySelector: () => (present === null ? null : sidebar) } };
}

describe("прокрутка списка уроков", () => {
    it("читает текущую прокрутку, а без списка возвращает null", () => {
        expect(readSidebarScroll(fakeRoot({ scrollTop: 120 }).root)).toBe(120);
        expect(readSidebarScroll({ querySelector: () => null })).toBeNull();
    });

    it("возвращает прежнюю прокрутку, если урок виден", () => {
        const { sidebar, root } = fakeRoot({ scrollTop: 0, itemTop: 150 });

        restoreSidebarScroll(root, 100);

        expect(sidebar.scrollTop).toBe(100);
    });

    it("прокручивает к уроку, если он за краем", () => {
        const { sidebar, root } = fakeRoot({ itemTop: 900 });

        restoreSidebarScroll(root, 0);

        expect(sidebar.scrollTop).toBe(900 - 150);
    });

    it("при первой отрисовке (нет прежней прокрутки) показывает текущий урок", () => {
        const { sidebar, root } = fakeRoot({ itemTop: 700 });

        restoreSidebarScroll(root, null);

        expect(sidebar.scrollTop).toBe(550);
    });

    it("урок в самом начале не уводит список ниже нуля", () => {
        const { sidebar, root } = fakeRoot({ scrollTop: 500, itemTop: 10 });

        restoreSidebarScroll(root, 500);

        expect(sidebar.scrollTop).toBe(0);
    });
});
