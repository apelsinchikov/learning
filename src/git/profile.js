/*
 * Профиль «Мой проект»: значения ученика, которые курс подставляет в команды.
 * Хранится только в браузере (там почта). В облако не отправляется.
 */

export const PROFILE_KEY = "git-profile-v1";

const LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const REPO = /^[A-Za-z0-9._-]{1,100}$/;
const EMAIL = /^[^\s@'"<>]+@[^\s@'"<>]+\.[^\s@'"<>]+$/;

export const OS_LIST = ["mac", "windows"];
export const MODES = ["terminal", "vscode"];

export const validators = {
    login: value => LOGIN.test(value),
    repo: value => REPO.test(value) && value !== "." && value !== "..",
    name: value => value.length > 0 && value.length <= 100 && !/[\r\n]/.test(value),
    email: value => value.length <= 254 && EMAIL.test(value)
};

export function detectOs(platform = typeof navigator !== "undefined" ? navigator.platform || navigator.userAgent || "" : "") {
    return /mac|iphone|ipad/i.test(platform) ? "mac" : "windows";
}

export function emptyProfile(os = detectOs()) {
    return { login: "", repo: "", name: "", email: "", os, mode: "terminal" };
}

/* Неверные значения превращаются в пустые: в команду попадает только проверенное. */
export function cleanProfile(raw = {}, fallbackOs = detectOs()) {
    const text = key => String(raw?.[key] ?? "").trim();
    const profile = emptyProfile(fallbackOs);

    for (const key of Object.keys(validators)) {
        const value = text(key);

        profile[key] = validators[key](value) ? value : "";
    }

    profile.os = OS_LIST.includes(raw?.os) ? raw.os : fallbackOs;
    profile.mode = MODES.includes(raw?.mode) ? raw.mode : "terminal";

    return profile;
}

export function loadProfile(storage) {
    try {
        const raw = storage ? storage.getItem(PROFILE_KEY) : null;

        return cleanProfile(raw ? JSON.parse(raw) : {});
    } catch {
        return cleanProfile({});
    }
}

export function saveProfile(storage, profile) {
    try {
        if (storage) {
            storage.setItem(PROFILE_KEY, JSON.stringify(profile));
        }
    } catch {
        /* без хранилища значения просто не запомнятся */
    }
}
