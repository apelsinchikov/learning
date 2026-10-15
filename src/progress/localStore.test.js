import { describe, expect, it } from "vitest";

import { createLocalStore } from "./localStore.js";
import { createEmptyProgress, markRead } from "./progressModel.js";

function fakeStorage(initial = {}) {
    const data = new Map(Object.entries(initial));

    return {
        getItem: key => (data.has(key) ? data.get(key) : null),
        setItem: (key, value) => data.set(key, String(value)),
        removeItem: key => data.delete(key),
        data
    };
}

const KEY = "openapi-course-progress-v1";

describe("localStore", () => {
    it("save затем load возвращает тот же прогресс и владельца", () => {
        const store = createLocalStore(fakeStorage());
        const progress = markRead(createEmptyProgress(), "theory-1");

        store.save(progress, "user-1");

        expect(store.load()).toEqual({ progress, owner: "user-1" });
    });

    it("пустое хранилище даёт пустой прогресс гостя", () => {
        const store = createLocalStore(fakeStorage());

        expect(store.load()).toEqual({ progress: createEmptyProgress(), owner: null });
    });

    it.each([
        ["битый JSON", "{not json"],
        ["массив", "[1,2]"],
        ["строка", "\"text\""],
        ["объект без lessons", JSON.stringify({ v: 1, owner: null, progress: {} })]
    ])("%s в хранилище не ломает загрузку", (_, raw) => {
        const store = createLocalStore(fakeStorage({ [KEY]: raw }));

        expect(store.load()).toEqual({ progress: createEmptyProgress(), owner: null });
    });

    it("недоступное хранилище (null) не бросает исключений", () => {
        const store = createLocalStore(null);

        expect(store.load()).toEqual({ progress: createEmptyProgress(), owner: null });
        expect(() => store.save(createEmptyProgress(), null)).not.toThrow();
        expect(() => store.clear()).not.toThrow();
    });

    it("хранилище, которое бросает исключения, не ломает курс", () => {
        const broken = {
            getItem: () => { throw new Error("denied"); },
            setItem: () => { throw new Error("denied"); },
            removeItem: () => { throw new Error("denied"); }
        };
        const store = createLocalStore(broken);

        expect(store.load().progress).toEqual(createEmptyProgress());
        expect(() => store.save(createEmptyProgress(), null)).not.toThrow();
        expect(() => store.clear()).not.toThrow();
    });

    it("clear удаляет сохранённое", () => {
        const storage = fakeStorage();
        const store = createLocalStore(storage);

        store.save(markRead(createEmptyProgress(), "t"), null);
        store.clear();

        expect(storage.data.has(KEY)).toBe(false);
        expect(store.load().progress).toEqual(createEmptyProgress());
    });
});
