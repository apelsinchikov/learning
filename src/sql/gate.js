/*
 * Временная «калитка» перед курсом SQL.
 *
 * Курс уже выложен, но закрыт для бета-тестеров, у которых доступ только к проду.
 * Пароль один на всех и не связан с аккаунтом или прогрессом: введённый пароль
 * просто запоминается в этом браузере.
 *
 * Это защита от случайных заходов, а не настоящая безопасность: сайт целиком
 * клиентский, поэтому всё, что есть в коде, видно в браузере. Хеш лежит здесь,
 * чтобы пароль не был написан открытым текстом.
 */

export const PASSWORD_SHA256 =
    "bf058c1763336b07ff55d808efd66f7ea7efa704b1b1b4aebfb455258f77d074";

const UNLOCK_KEY = "sql-course-beta-unlocked-v1";

export async function sha256Hex(text) {
    const subtle = globalThis.crypto && globalThis.crypto.subtle;

    if (!subtle) {
        throw new Error("Браузер не умеет считать хеши (нужен https).");
    }

    const bytes = new TextEncoder().encode(text);
    const digest = await subtle.digest("SHA-256", bytes);

    return [...new Uint8Array(digest)]
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}

export async function checkPassword(input, expected = PASSWORD_SHA256) {
    const text = String(input ?? "").trim();

    if (!text) {
        return false;
    }

    return (await sha256Hex(text)) === expected;
}

export function isUnlocked(storage) {
    try {
        return Boolean(storage) && storage.getItem(UNLOCK_KEY) === "1";
    } catch {
        return false;
    }
}

export function unlock(storage) {
    try {
        if (storage) {
            storage.setItem(UNLOCK_KEY, "1");
        }
    } catch {
        /* без хранилища доступ живёт до перезагрузки страницы */
    }
}

export function lock(storage) {
    try {
        if (storage) {
            storage.removeItem(UNLOCK_KEY);
        }
    } catch {
        /* ничего страшного */
    }
}
