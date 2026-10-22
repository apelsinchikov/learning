import { describe, expect, it } from "vitest";

import { PASSWORD_SHA256, checkPassword, isUnlocked, sha256Hex, unlock } from "./gate.js";

function fakeStorage() {
    const data = new Map();

    return {
        getItem: key => (data.has(key) ? data.get(key) : null),
        setItem: (key, value) => data.set(key, String(value))
    };
}

describe("gate", () => {
    it("хеш в коде — это SHA-256 пароля", async () => {
        expect(await sha256Hex("Apelsinchikov")).toBe(PASSWORD_SHA256);
    });

    it("верный пароль проходит, пробелы по краям не мешают", async () => {
        expect(await checkPassword("Apelsinchikov")).toBe(true);
        expect(await checkPassword("  Apelsinchikov  ")).toBe(true);
    });

    it("неверный, пустой и с другим регистром не проходят", async () => {
        expect(await checkPassword("apelsinchikov")).toBe(false);
        expect(await checkPassword("")).toBe(false);
        expect(await checkPassword(null)).toBe(false);
    });

    it("после unlock курс открыт, до этого закрыт", () => {
        const storage = fakeStorage();

        expect(isUnlocked(storage)).toBe(false);

        unlock(storage);

        expect(isUnlocked(storage)).toBe(true);
    });

    it("без хранилища закрыто и не падает", () => {
        expect(isUnlocked(null)).toBe(false);
        expect(() => unlock(null)).not.toThrow();
    });

    it("хранилище бросает ошибку — закрыто", () => {
        const broken = {
            getItem() {
                throw new Error("нет доступа");
            }
        };

        expect(isUnlocked(broken)).toBe(false);
    });
});
