/*
 * Рисует диаграммы настоящим Mermaid. Библиотека тяжёлая, поэтому подключается
 * лениво: только когда на странице курса впервые нужна картинка.
 *
 * Строгий режим (securityLevel: "strict") не даёт тексту ученика выполнить код
 * или вставить HTML: подписи экранируются, а скрипты и обработчики выбрасываются.
 *
 * renderer.render(text) → { ok: true, svg } или { ok: false, error },
 * а если сам Mermaid не загрузился — { ok: false, fatal: true, error }.
 * Приложение принимает любой объект такой формы, поэтому в тестах можно
 * подставить поддельный рисовальщик.
 */

let loading = null;

function loadMermaid() {
    loading =
        loading ||
        import("mermaid").then(module => {
            const mermaid = module.default;

            mermaid.initialize({
                startOnLoad: false,
                securityLevel: "strict",
                suppressErrorRendering: true,
                theme: "neutral",
                fontFamily: "Inter, system-ui, sans-serif",
                sequence: { useMaxWidth: true },
                er: { useMaxWidth: true }
            });

            return mermaid;
        });

    /* Если загрузка не удалась (нет сети), в следующий раз пробуем заново. */
    loading.catch(() => {
        loading = null;
    });

    return loading;
}

export function createMermaidRenderer() {
    let counter = 0;
    let queue = Promise.resolve();

    /* Mermaid рисует по одной диаграмме за раз: параллельные вызовы выстраиваем в очередь. */
    function render(text) {
        const job = queue.then(async () => {
            const id = `dg-render-${++counter}`;

            let mermaid;

            try {
                mermaid = await loadMermaid();
            } catch (error) {
                console.error(error);

                return { ok: false, fatal: true, error: String((error && error.message) || error) };
            }

            try {
                const { svg } = await mermaid.render(id, text);

                return { ok: true, svg };
            } catch (error) {
                return { ok: false, error: String((error && error.message) || error) };
            } finally {
                /* Mermaid мог оставить временные элементы после ошибки. */
                document.getElementById(id)?.remove();
                document.getElementById(`d${id}`)?.remove();
            }
        });

        queue = job.catch(() => {});

        return job;
    }

    return { render };
}
