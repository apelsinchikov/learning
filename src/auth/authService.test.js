import { describe, expect, it, vi } from "vitest";

import { createAuthService } from "./authService.js";

const REDIRECT = "https://example.test/learning/";

function fakeClient({ session = null } = {}) {
    let listener = null;
    const unsubscribe = vi.fn();

    return {
        emit: (event, newSession) => listener(event, newSession),
        unsubscribe,
        auth: {
            signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
            signOut: vi.fn().mockResolvedValue({ error: null }),
            getSession: vi.fn().mockResolvedValue({ data: { session }, error: null }),
            onAuthStateChange: vi.fn(cb => {
                listener = cb;
                return { data: { subscription: { unsubscribe } } };
            })
        }
    };
}

const sessionOf = user => ({ user });

describe("authService.signIn", () => {
    it("запускает OAuth нужного провайдера с адресом возврата", async () => {
        const client = fakeClient();
        const service = createAuthService(client, { redirectTo: REDIRECT });

        await service.signIn("google");

        expect(client.auth.signInWithOAuth).toHaveBeenCalledWith({
            provider: "google",
            options: { redirectTo: REDIRECT }
        });
    });

    it("двойной клик даёт один вызов клиента", async () => {
        const client = fakeClient();
        const service = createAuthService(client, { redirectTo: REDIRECT });

        await Promise.all([service.signIn("google"), service.signIn("google")]);

        expect(client.auth.signInWithOAuth).toHaveBeenCalledTimes(1);
    });

    it("неизвестный провайдер отклоняется без обращения к Supabase", async () => {
        const client = fakeClient();
        const service = createAuthService(client, { redirectTo: REDIRECT });

        await expect(service.signIn("facebook")).rejects.toThrow("facebook");
        expect(client.auth.signInWithOAuth).toHaveBeenCalledTimes(0);
    });

    it("ошибка Supabase пробрасывается и снимает блокировку повторного входа", async () => {
        const client = fakeClient();
        client.auth.signInWithOAuth.mockResolvedValueOnce({ error: { message: "nope" } });
        const service = createAuthService(client, { redirectTo: REDIRECT });

        await expect(service.signIn("google")).rejects.toThrow("nope");
        await service.signIn("google");

        expect(client.auth.signInWithOAuth).toHaveBeenCalledTimes(2);
    });
});

describe("authService.getUser", () => {
    it("без сессии возвращает null", async () => {
        const service = createAuthService(fakeClient(), { redirectTo: REDIRECT });

        expect(await service.getUser()).toBeNull();
    });

    it.each([
        ["full_name", { full_name: "Иван Петров", name: "ivan" }, "a@b.c", "Иван Петров"],
        ["name", { name: "ivan" }, "a@b.c", "ivan"],
        ["часть email", {}, "anna@mail.ru", "anna"],
        ["запасное имя", {}, null, "Пользователь"]
    ])("имя пользователя: %s", async (_, metadata, email, expectedName) => {
        const client = fakeClient({
            session: sessionOf({ id: "u1", email, user_metadata: metadata })
        });
        const service = createAuthService(client, { redirectTo: REDIRECT });

        expect(await service.getUser()).toEqual({ id: "u1", email, name: expectedName });
    });
});

const nextTick = () => new Promise(resolve => setTimeout(resolve, 0));

describe("authService.onAuthChange", () => {
    it("обработчик вызывается после события, а не внутри него (иначе supabase-js зависает на своей блокировке)", async () => {
        const client = fakeClient();
        const service = createAuthService(client, { redirectTo: REDIRECT });
        const listener = vi.fn();
        service.onAuthChange(listener);

        client.emit("SIGNED_IN", sessionOf({ id: "u1", user_metadata: {} }));

        expect(listener).toHaveBeenCalledTimes(0);

        await nextTick();

        expect(listener).toHaveBeenCalledTimes(1);
    });

    it("сообщает о входе и выходе, остальные события игнорирует", async () => {
        const client = fakeClient();
        const service = createAuthService(client, { redirectTo: REDIRECT });
        const listener = vi.fn();
        service.onAuthChange(listener);

        client.emit("TOKEN_REFRESHED", sessionOf({ id: "u1", user_metadata: {} }));
        client.emit("SIGNED_IN", sessionOf({ id: "u1", email: "a@b.c", user_metadata: { name: "A" } }));
        client.emit("SIGNED_OUT", null);
        await nextTick();

        expect(listener).toHaveBeenCalledTimes(2);
        expect(listener.mock.calls[0][0]).toEqual({ id: "u1", email: "a@b.c", name: "A" });
        expect(listener.mock.calls[1][0]).toBeNull();
    });

    it("после входа очищает адрес от параметров OAuth", async () => {
        const client = fakeClient();
        const cleanUrl = vi.fn();
        const service = createAuthService(client, { redirectTo: REDIRECT, cleanUrl });
        service.onAuthChange(() => {});

        client.emit("SIGNED_IN", sessionOf({ id: "u1", user_metadata: {} }));
        await nextTick();

        expect(cleanUrl).toHaveBeenCalledTimes(1);
    });

    it("отписка снимает подписку Supabase", () => {
        const client = fakeClient();
        const service = createAuthService(client, { redirectTo: REDIRECT });

        service.onAuthChange(() => {})();

        expect(client.unsubscribe).toHaveBeenCalledTimes(1);
    });
});

describe("authService.signOut", () => {
    it("выходит через клиент", async () => {
        const client = fakeClient();
        const service = createAuthService(client, { redirectTo: REDIRECT });

        await service.signOut();

        expect(client.auth.signOut).toHaveBeenCalledTimes(1);
    });

    it("выход только на этом устройстве, другие устройства остаются в системе", async () => {
        const client = fakeClient();
        const service = createAuthService(client, { redirectTo: REDIRECT });

        await service.signOut();

        expect(client.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    });
});


describe("authService: Яндекс", () => {
    it("signIn(\"yandex\") использует идентификатор custom-провайдера Supabase", async () => {
        const client = fakeClient();
        const service = createAuthService(client, { redirectTo: REDIRECT });

        await service.signIn("yandex");

        expect(client.auth.signInWithOAuth).toHaveBeenCalledWith({
            provider: "custom:yandex",
            options: { redirectTo: REDIRECT }
        });
    });
});

describe("список провайдеров", () => {
    it("в окне входа показываются Google и Яндекс", async () => {
        const { ENABLED_PROVIDERS } = await import("./config.js");

        expect(ENABLED_PROVIDERS.map(provider => provider.id)).toEqual(["google", "yandex"]);
    });
});
