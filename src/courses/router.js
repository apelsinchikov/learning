/*
 * Маршруты сайта. Курсов три: OpenAPI (по умолчанию, как раньше), SQL и «Диаграммы».
 * Адрес курса — в хеше: #/sql, #/sql/<id урока>, #/sql/sandbox, #/diagrams/...
 * Хеш не требует настроек сервера, поэтому работает на GitHub Pages.
 */

export const OPENAPI_HASH = "#/";
export const SQL_HASH = "#/sql";
export const DIAGRAMS_HASH = "#/diagrams";

/* Курсы, которые живут в хеше (OpenAPI — всё остальное). */
export const HASH_COURSES = ["sql", "diagrams"];

const RETURN_KEY = "learning-return-route";

export function parseRoute(hash = "") {
    const path = String(hash || "").replace(/^#\/?/, "");
    const parts = path.split("/").filter(Boolean);

    if (!HASH_COURSES.includes(parts[0])) {
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

    return { course: parts[0], lessonId };
}

export function courseHash(course, lessonId = null) {
    const base = `#/${course}`;

    return lessonId ? `${base}/${encodeURIComponent(lessonId)}` : base;
}

export function sqlHash(lessonId = null) {
    return courseHash("sql", lessonId);
}

export function diagramsHash(lessonId = null) {
    return courseHash("diagrams", lessonId);
}

export function isSqlRoute(hash = "") {
    return parseRoute(hash).course === "sql";
}

export function isDiagramsRoute(hash = "") {
    return parseRoute(hash).course === "diagrams";
}

/* Любой курс, кроме OpenAPI: его адрес надо запомнить на время входа. */
export function isHashCourseRoute(hash = "") {
    return HASH_COURSES.includes(parseRoute(hash).course);
}

/*
 * Вход идёт через Google/Яндекс и возвращает на главную страницу,
 * где хеша уже нет. Запоминаем, где был человек, и возвращаем его туда.
 */
export function rememberReturnRoute(storage, hash) {
    try {
        if (storage && isHashCourseRoute(hash)) {
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

        if (saved && isHashCourseRoute(saved) && !isHashCourseRoute(currentHash)) {
            return saved;
        }
    } catch {
        /* игнорируем */
    }

    return null;
}
