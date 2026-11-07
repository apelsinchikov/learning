import { describe, expect, it, vi } from "vitest";
import { createPracticeFlow } from "./practiceFlow.js";

/* Ручные таймеры: паузой управляет тест. */
function manualTimers() {
    let nextId = 1;
    const pending = new Map();

    return {
        setTimeout(callback, ms) {
            const id = nextId++;

            pending.set(id, { callback, ms });

            return id;
        },
        clearTimeout(id) {
            pending.delete(id);
        },
        pendingCount: () => pending.size,
        lastDelay: () => [...pending.values()].at(-1)?.ms,
        async fire() {
            const entries = [...pending.entries()];

            pending.clear();

            for (const [, entry] of entries) {
                await entry.callback();
            }
        }
    };
}

function setup({ taskErrors = [] } = {}) {
    const timers = manualTimers();

    const view = {
        showSwagger: vi.fn(),
        showOpenApiErrors: vi.fn(),
        showTaskResult: vi.fn(),
        clearTaskResult: vi.fn()
    };

    const validateOpenApi = vi.fn(async (_lesson, text) =>
        text.startsWith("bad")
            ? { openapiErrors: [`Ошибка: ${text}`], specification: null }
            : { openapiErrors: [], specification: { text } }
    );

    const validateTask = vi.fn(() => taskErrors);
    const onSolved = vi.fn();

    const flow = createPracticeFlow({
        lesson: { id: "practice-x", successMessage: "Готово!" },
        validateOpenApi,
        validateTask,
        view,
        onSolved,
        timers,
        debounceMs: 700
    });

    return { flow, timers, view, validateOpenApi, validateTask, onSolved };
}

describe("живой Swagger", () => {
    it("валидный YAML сразу после refresh показывает Swagger, условия задания не проверяются", async () => {
        const { flow, view, validateTask } = setup();

        await flow.refresh("openapi: ok");

        expect(view.showSwagger).toHaveBeenCalledWith("openapi: ok");
        expect(view.showOpenApiErrors).not.toHaveBeenCalled();
        expect(validateTask).not.toHaveBeenCalled();
    });

    it("невалидный YAML показывает ошибки OpenAPI вместо Swagger", async () => {
        const { flow, view } = setup();

        await flow.refresh("bad yaml");

        expect(view.showOpenApiErrors).toHaveBeenCalledWith(["Ошибка: bad yaml"]);
        expect(view.showSwagger).not.toHaveBeenCalled();
    });

    it("правка откладывает обновление на паузу и не обновляет сразу", async () => {
        const { flow, timers, view } = setup();

        flow.change("openapi: a");

        expect(view.showSwagger).not.toHaveBeenCalled();
        expect(timers.lastDelay()).toBe(700);

        await timers.fire();

        expect(view.showSwagger).toHaveBeenCalledWith("openapi: a");
    });

    it("быстрые правки подряд дают одно обновление с последним текстом", async () => {
        const { flow, timers, view, validateOpenApi } = setup();

        flow.change("openapi: a");
        flow.change("openapi: ab");
        flow.change("openapi: abc");

        expect(timers.pendingCount()).toBe(1);

        await timers.fire();

        expect(validateOpenApi).toHaveBeenCalledTimes(1);
        expect(view.showSwagger).toHaveBeenCalledTimes(1);
        expect(view.showSwagger).toHaveBeenCalledWith("openapi: abc");
    });

    it("устаревший результат проверки не перезаписывает более свежий", async () => {
        const { flow, view, validateOpenApi } = setup();

        let releaseOld;

        validateOpenApi.mockImplementationOnce(
            () => new Promise(resolve => { releaseOld = () => resolve({ openapiErrors: [], specification: { text: "old" } }); })
        );

        const oldRun = flow.refresh("openapi: old");
        await flow.refresh("openapi: new");

        releaseOld();
        await oldRun;

        expect(view.showSwagger).toHaveBeenCalledTimes(1);
        expect(view.showSwagger).toHaveBeenCalledWith("openapi: new");
    });

    it("правка сразу убирает баннер результата задания", () => {
        const { flow, view } = setup();

        flow.change("openapi: a");

        expect(view.clearTaskResult).toHaveBeenCalledTimes(1);
    });
});

describe("кнопка «Проверить задание»", () => {
    it("условия выполнены: урок отмечается решённым, баннер успеха, Swagger остаётся", async () => {
        const { flow, view, onSolved } = setup({ taskErrors: [] });

        await flow.refresh("openapi: ok");
        view.showSwagger.mockClear();

        const result = await flow.check("openapi: ok");

        expect(result).toEqual({ ok: true });
        expect(onSolved).toHaveBeenCalledTimes(1);
        expect(view.showTaskResult).toHaveBeenCalledWith({ ok: true, successMessage: "Готово!" });
        expect(view.showSwagger).not.toHaveBeenCalled();
    });

    it("условия не выполнены: список условий, урок не решён, Swagger не перерисован", async () => {
        const { flow, view, onSolved } = setup({ taskErrors: ["Добавь endpoint GET /users."] });

        await flow.refresh("openapi: ok");
        view.showSwagger.mockClear();

        const result = await flow.check("openapi: ok");

        expect(result).toEqual({ ok: false });
        expect(onSolved).not.toHaveBeenCalled();
        expect(view.showTaskResult).toHaveBeenCalledWith({ ok: false, errors: ["Добавь endpoint GET /users."] });
        expect(view.showSwagger).not.toHaveBeenCalled();
    });

    it("если Swagger ещё не показан для этого текста, проверка сначала его показывает", async () => {
        const { flow, view } = setup();

        await flow.check("openapi: fresh");

        expect(view.showSwagger).toHaveBeenCalledWith("openapi: fresh");
        expect(view.showTaskResult).toHaveBeenCalled();
    });

    it("невалидный OpenAPI: показываются ошибки OpenAPI, условия задания не проверяются", async () => {
        const { flow, view, validateTask, onSolved } = setup();

        const result = await flow.check("bad yaml");

        expect(result).toEqual({ ok: false });
        expect(view.showOpenApiErrors).toHaveBeenCalledWith(["Ошибка: bad yaml"]);
        expect(validateTask).not.toHaveBeenCalled();
        expect(onSolved).not.toHaveBeenCalled();
        expect(view.showTaskResult).not.toHaveBeenCalled();
    });

    it("проверка отменяет ожидающее обновление, чтобы Swagger не мигнул лишний раз", async () => {
        const { flow, timers } = setup();

        flow.change("openapi: a");
        await flow.check("openapi: a");

        expect(timers.pendingCount()).toBe(0);
    });

    it("после правки баннер снят, но «решено» повторно не вызывается и не снимается", async () => {
        const { flow, view, onSolved } = setup({ taskErrors: [] });

        await flow.check("openapi: ok");
        view.clearTaskResult.mockClear();

        flow.change("openapi: ok2");

        expect(view.clearTaskResult).toHaveBeenCalledTimes(1);
        expect(onSolved).toHaveBeenCalledTimes(1);
    });
});
