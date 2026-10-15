import { describe, expect, it } from "vitest";

import { renderAuthControls, renderLoginModal } from "./authView.js";
import { Header } from "../components/Header.js";

const count = (html, text) => html.split(text).length - 1;

const PROVIDERS = [
    { id: "google", label: "Google" },
    { id: "yandex", label: "Яндекс" }
];

describe("кнопка входа и меню пользователя", () => {
    it("гость видит «Войти» и не видит «Выйти»", () => {
        const html = renderAuthControls(null);

        expect(count(html, 'data-action="open-login"')).toBe(1);
        expect(count(html, 'data-action="logout"')).toBe(0);
    });

    it("вошедший видит имя и «Выйти», но не «Войти»", () => {
        const html = renderAuthControls({ id: "u1", email: "a@b.c", name: "Иван" });

        expect(html).toContain("Иван");
        expect(count(html, 'data-action="logout"')).toBe(1);
        expect(count(html, 'data-action="open-login"')).toBe(0);
    });

    it("имя пользователя экранируется", () => {
        const html = renderAuthControls({ id: "u1", email: null, name: "<img onerror=x>" });

        expect(html).not.toContain("<img onerror=x>");
        expect(html).toContain("&lt;img onerror=x&gt;");
    });
});

describe("окно входа", () => {
    it("содержит кнопку на каждый провайдер и закрытие", () => {
        const html = renderLoginModal(PROVIDERS);

        expect(count(html, 'data-provider="google"')).toBe(1);
        expect(count(html, 'data-provider="yandex"')).toBe(1);
        expect(html).toContain("Войти через Google");
        expect(html).toContain("Войти через Яндекс");
        expect(count(html, 'data-action="close-login"')).toBeGreaterThan(0);
        expect(html).toContain('role="dialog"');
    });

    it("поясняет, что вход нужен только для сохранения прогресса", () => {
        expect(renderLoginModal(PROVIDERS)).toContain("прогресс");
    });
});

describe("шапка", () => {
    it("содержит контейнер входа с кнопкой для гостя", () => {
        const html = Header();

        expect(count(html, "header__auth")).toBe(1);
        expect(html).toContain('data-action="open-login"');
    });

    it("для вошедшего показывает имя", () => {
        const html = Header({ user: { id: "u1", email: null, name: "Анна" } });

        expect(html).toContain("Анна");
        expect(html).not.toContain('data-action="open-login"');
    });
});
