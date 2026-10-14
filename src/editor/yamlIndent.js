/*
 * Правила отступов для «умного» Enter в YAML.
 * Чистая функция без зависимостей — её легко тестировать.
 *
 *   key:|            ->  новая строка с отступом на один уровень глубже
 *   key: value|      ->  новая строка на том же уровне
 *   - name: id|      ->  новая строка выровнена под "name"
 *   - значение|      ->  новая строка начинается с "- "
 *   -|  (пустой)     ->  выход из списка
 */

export const INDENT_SIZE = 2;


function spaces(count) {
    return " ".repeat(Math.max(0, count));
}


/*
 * Принимает текст строки ДО курсора.
 * Возвращает, что вставить после перевода строки.
 */
export function getNextLineIndent(textBeforeCursor) {
    const base = textBeforeCursor.match(/^ */)[0].length;

    /* убираем комментарий в конце строки */
    const code = textBeforeCursor
        .replace(/(^|\s)#.*$/, "")
        .trimEnd();

    const content = code.trim();

    /* пустая строка: сохраняем отступ */
    if (!content) {
        return { indent: spaces(base), exitList: false };
    }

    const isListItem = /^-(\s|$)/.test(content);

    /* "-" без содержимого: выходим из списка */
    if (isListItem && content.replace(/^-\s*/, "") === "") {
        return { indent: spaces(base - INDENT_SIZE), exitList: true };
    }

    const body = isListItem
        ? content.replace(/^-\s+/, "")
        : content;

    /* позиция, где начинается ключ (после "- ") */
    const keyColumn = isListItem ? base + INDENT_SIZE : base;

    /* "key:" или "key: |" — дальше идёт вложенный блок */
    if (/:$/.test(body) || /:\s*[|>][+-]?$/.test(body)) {
        return {
            indent: spaces(keyColumn + INDENT_SIZE),
            exitList: false
        };
    }

    if (isListItem) {
        /* "- key: value": следующая строка — следующий ключ того же элемента */
        if (/^[^\s:][^:]*:\s/.test(body)) {
            return { indent: spaces(keyColumn), exitList: false };
        }

        /* "- value": следующий элемент списка */
        return { indent: spaces(base) + "- ", exitList: false };
    }

    return { indent: spaces(base), exitList: false };
}
