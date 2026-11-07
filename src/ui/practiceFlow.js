/*
 * Поток практического урока: что происходит, когда ученик пишет YAML
 * и когда нажимает «Проверить задание».
 *
 * - Пока OpenAPI написан верно, Swagger строится по ходу письма (с паузой после
 *   последней правки), и условия задания на это не влияют.
 * - Если OpenAPI с ошибкой, вместо Swagger показываются ошибки OpenAPI.
 * - «Проверить задание» проверяет только условия урока. Результат показывается
 *   баннером над Swagger, сам Swagger остаётся на экране.
 * - Правка текста убирает баннер, но «решено» не снимает.
 *
 * Модуль не знает про DOM: всё показывает переданный view,
 * а таймеры и проверки можно подменить в тестах.
 */

const DEFAULT_DEBOUNCE_MS = 700;

const browserTimers = {
    setTimeout: (callback, ms) => window.setTimeout(callback, ms),
    clearTimeout: id => window.clearTimeout(id)
};

export function createPracticeFlow({
    lesson,
    validateOpenApi,
    validateTask,
    view,
    onSolved,
    timers = browserTimers,
    debounceMs = DEFAULT_DEBOUNCE_MS
}) {
    let timerId = null;

    /* Номер последнего запуска: устаревший ответ проверки игнорируем. */
    let runId = 0;

    /* Для какого текста сейчас показан Swagger (null — не показан). */
    let renderedText = null;

    function cancelPending() {
        if (timerId !== null) {
            timers.clearTimeout(timerId);
            timerId = null;
        }
    }

    /* Проверяет OpenAPI и показывает Swagger или ошибки. Возвращает {current, valid, specification}. */
    async function render(text) {
        const id = ++runId;

        const { openapiErrors, specification } = await validateOpenApi(lesson, text);

        if (id !== runId) {
            return { current: false };
        }

        if (openapiErrors.length > 0) {
            renderedText = null;
            view.showOpenApiErrors(openapiErrors);

            return { current: true, valid: false };
        }

        view.showSwagger(text);
        renderedText = text;

        return { current: true, valid: true, specification };
    }

    return {
        /* Показать результат сразу (при открытии урока). */
        async refresh(text) {
            cancelPending();
            await render(text);
        },

        /* Ученик правит текст: баннер уходит, Swagger обновится после паузы. */
        change(text) {
            view.clearTaskResult();
            cancelPending();

            timerId = timers.setTimeout(() => {
                timerId = null;

                return render(text);
            }, debounceMs);
        },

        /* Кнопка «Проверить задание». */
        async check(text) {
            cancelPending();

            const id = ++runId;

            const { openapiErrors, specification } = await validateOpenApi(lesson, text);

            if (id !== runId) {
                return { ok: false };
            }

            if (openapiErrors.length > 0) {
                renderedText = null;
                view.showOpenApiErrors(openapiErrors);

                return { ok: false };
            }

            /* Swagger уже показан для этого текста — не перерисовываем. */
            if (renderedText !== text) {
                view.showSwagger(text);
                renderedText = text;
            }

            const errors = validateTask(lesson, specification);

            if (errors.length > 0) {
                view.showTaskResult({ ok: false, errors });

                return { ok: false };
            }

            onSolved();
            view.showTaskResult({ ok: true, successMessage: lesson.successMessage });

            return { ok: true };
        }
    };
}
