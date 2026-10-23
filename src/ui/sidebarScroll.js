/*
 * Страница и сайдбар перерисовываются целиком, и список уроков вернулся бы
 * к началу. Эти две функции запоминают, где он был прокручен, и после
 * отрисовки возвращают. Если выбранный урок остался за краем (или страницу
 * только открыли), список прокручивается так, чтобы урок оказался по центру.
 */
export function readSidebarScroll(root, selector = ".sidebar") {
    const sidebar = root.querySelector(selector);

    return sidebar ? sidebar.scrollTop : null;
}

export function restoreSidebarScroll(root, previousTop, { selector = ".sidebar", current = "[aria-current='page']" } = {}) {
    const sidebar = root.querySelector(selector);

    if (!sidebar) {
        return;
    }

    if (previousTop !== null && previousTop !== undefined) {
        sidebar.scrollTop = previousTop;
    }

    const item = sidebar.querySelector(current);

    if (!item) {
        return;
    }

    const top = item.getBoundingClientRect().top - sidebar.getBoundingClientRect().top + sidebar.scrollTop;
    const visible = top >= sidebar.scrollTop && top + item.offsetHeight <= sidebar.scrollTop + sidebar.clientHeight;

    if (!visible) {
        sidebar.scrollTop = Math.max(top - sidebar.clientHeight / 2, 0);
    }
}
