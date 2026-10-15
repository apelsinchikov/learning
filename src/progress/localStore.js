import { createEmptyProgress } from "./progressModel.js";

const DEFAULT_KEY = "openapi-course-progress-v1";

function emptyState() {
    return { progress: createEmptyProgress(), owner: null };
}

function isValidProgress(value) {
    return Boolean(
        value &&
        typeof value === "object" &&
        value.lessons &&
        typeof value.lessons === "object" &&
        !Array.isArray(value.lessons)
    );
}

/*
 * Локальное хранилище прогресса. `storage` — объект с getItem/setItem/
 * removeItem (обычно window.localStorage) или null, если он недоступен.
 * Любая ошибка хранилища (приватный режим, запрет, битые данные)
 * превращается в «пустой прогресс»: курс при этом продолжает работать.
 *
 * owner — id пользователя, чей это кэш (null — гость). Нужен, чтобы
 * кэш одного человека не попал в аккаунт другого.
 */
export function createLocalStore(storage, key = DEFAULT_KEY) {
    return {
        load() {
            try {
                const raw = storage ? storage.getItem(key) : null;

                if (!raw) {
                    return emptyState();
                }

                const parsed = JSON.parse(raw);

                if (!parsed || !isValidProgress(parsed.progress)) {
                    return emptyState();
                }

                return {
                    progress: {
                        currentLesson: parsed.progress.currentLesson || null,
                        lessons: parsed.progress.lessons
                    },
                    owner: parsed.owner ?? null
                };
            } catch {
                return emptyState();
            }
        },

        save(progress, owner) {
            try {
                if (storage) {
                    storage.setItem(key, JSON.stringify({ v: 1, owner, progress }));
                }
            } catch {
                /* хранилище недоступно: прогресс живёт только в памяти */
            }
        },

        clear() {
            try {
                if (storage) {
                    storage.removeItem(key);
                }
            } catch {
                /* ничего страшного */
            }
        }
    };
}
