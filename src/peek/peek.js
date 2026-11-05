import { renderError, renderPanel } from "./content.js";
import { PEEK_SOURCES } from "./sources.js";

const NARROW_QUERY = "(max-width: 1200px)";

function defaultIsNarrow() {
    return typeof window !== "undefined" && window.matchMedia ? window.matchMedia(NARROW_QUERY).matches : false;
}

/*
 * Панель «Повторить»: урок другого курса выезжает справа и не уводит со страницы.
 * Общий компонент: курс только говорит peek.open("sql:sql-inner-join", кнопка).
 *
 * - не меняет адрес, прогресс и «текущий урок» (мы только читаем уроки другого курса);
 * - закрывается Esc, крестиком, повторным нажатием на ту же ссылку, касанием вне шторки;
 * - на широком экране занимает место правой колонки, на узком — шторка снизу.
 */
export function createPeek({ root, sources = PEEK_SOURCES, host = () => root.querySelector(".sql-layout"), isNarrow = defaultIsNarrow } = {}) {
    let state = null;
    let token = 0;

    const $ = selector => root.querySelector(selector);

    function parse(ref) {
        const [course, ...rest] = String(ref).split(":");

        return { course, id: rest.join(":") };
    }

    function unmount() {
        $("[data-peek-panel]")?.remove();
        $("[data-peek-backdrop]")?.remove();
        host()?.classList.remove("sql-layout--peek");
        document.removeEventListener("keydown", onKey);
        root.removeEventListener("click", onPanelClick);
    }

    function mount(html) {
        const layout = host();

        if (!layout) {
            return false;
        }

        $("[data-peek-panel]")?.remove();
        $("[data-peek-backdrop]")?.remove();
        layout.insertAdjacentHTML("beforeend", html);
        layout.classList.add("sql-layout--peek");
        document.addEventListener("keydown", onKey);
        root.addEventListener("click", onPanelClick);

        return true;
    }

    function close({ restoreFocus = true } = {}) {
        token++;

        const trigger = state?.trigger;

        unmount();
        state = null;

        if (restoreFocus && trigger?.isConnected) {
            trigger.focus();
        }
    }

    function onKey(event) {
        if (event.key === "Escape") {
            close();
            return;
        }

        /* На узком экране панель — диалог: фокус не уходит за её пределы. */
        if (event.key === "Tab" && state?.narrow) {
            const focusable = [...root.querySelectorAll("[data-peek-panel] button, [data-peek-panel] a[href]")];

            if (focusable.length === 0) {
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }
    }

    function onPanelClick(event) {
        if (event.target.closest("[data-peek-close]")) {
            close();
        } else if (event.target.closest("[data-peek-full-toggle]")) {
            toggleFull();
        }
    }

    function toggleFull() {
        const full = $("[data-peek-full]");
        const button = $("[data-peek-full-toggle]");

        if (!full || !button) {
            return;
        }

        full.hidden = !full.hidden;
        button.setAttribute("aria-expanded", String(!full.hidden));
        button.textContent = full.hidden ? "Показать урок целиком ▾" : "Скрыть урок целиком ▴";

        if (!full.hidden) {
            full.scrollIntoView?.({ block: "start", behavior: "smooth" });
        }
    }

    async function open(ref, trigger = null) {
        /* Повторное нажатие на ту же ссылку закрывает панель. */
        if (state && state.ref === ref) {
            close();
            return;
        }

        const { course, id } = parse(ref);
        const source = sources[course];
        const current = ++token;
        const narrow = isNarrow();

        let lesson = null;

        try {
            lesson = source ? await source.load(id) : null;
        } catch (error) {
            console.error(error);
        }

        if (current !== token) {
            return;
        }

        if (!lesson) {
            mount(renderError("Этот урок сейчас недоступен. Попробуйте позже."));
            state = { ref, trigger, narrow };
            return;
        }

        const href = window.location.href.split("#")[0] + source.hash(id);

        if (!mount(renderPanel(lesson, { href, narrow }))) {
            return;
        }

        state = { ref, trigger, narrow };
        $("[data-peek-close]")?.focus({ preventScroll: true });
    }

    return { open, close, isOpen: () => state !== null, current: () => state?.ref ?? null };
}
