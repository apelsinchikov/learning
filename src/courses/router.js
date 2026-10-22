/*
 * Маршруты сайта. Курсов два: OpenAPI (по умолчанию, как раньше) и SQL.
 * Адрес курса SQL — в хеше: #/sql, #/sql/<id урока>, #/sql/sandbox.
 * Хеш не требует настроек сервера, поэтому работает на GitHub Pages.
 */

export const OPENAPI_HASH = "#/";
export const SQL_HASH = "#/sql";

const RETURN_KEY = "learning-return-route";

export function parseRoute(hash = "") {
    const path = String(hash || "").replace(/^#\/?/, "");
    const parts = path.split("/").filter(Boolean);

    if (parts[0] !== "sql") {
        return { course: "openapi", lessonId: null };
    }

    let lessonId = null;

    if (parts[1]) {
        try {
            lessonId = decodeURIComponent(parts[1]);
        } catch {
            lessonId = null;
        }
    }

    return { course: "sql", lessonId };
}

export function sqlHash(lessonId = null) {
    return lessonId ? `${SQL_HASH}/${encodeURIComponent(lessonId)}` : SQL_HASH;
}

export function isSqlRoute(hash = "") {
    return parseRoute(hash).course === "sql";
}

/*
 * Вход идёт через Google/Яндекс и возвращает на главную страницу,
 * где хеша уже нет. Запоминаем, где был человек, и возвращаем его туда.
 */
export function rememberReturnRoute(storage, hash) {
    try {
        if (storage && isSqlRoute(hash)) {
            storage.setItem(RETURN_KEY, hash);
        }
    } catch {
        /* хранилище недоступно — вернёмся на главную */
    }
}

export function takeReturnRoute(storage, currentHash = "") {
    try {
        if (!storage) {
            return null;
        }

        const saved = storage.getItem(RETURN_KEY);

        storage.removeItem(RETURN_KEY);

        if (saved && isSqlRoute(saved) && !isSqlRoute(currentHash)) {
            return saved;
        }
    } catch {
        /* игнорируем */
    }

    return null;
}
