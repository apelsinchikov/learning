/*
 * Данные учебной базы: отель «Перевал», ночь на 15 февраля 2026 года.
 *
 * Всё детерминировано: «случайные» строки делает генератор с фиксированным
 * зерном, поэтому у каждого ученика и в каждом тесте одна и та же база.
 * Ключевые события ночи (кто открывал кабинет управляющего) записаны вручную.
 */

const pad = n => String(n).padStart(2, "0");

/* Небольшой детерминированный генератор случайных чисел. */
function mulberry32(seed) {
    let a = seed >>> 0;

    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;

        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/* Дни, за которые ведётся журнал (ночь на 15-е добавлена вручную). */
const DAYS = ["2026-02-10", "2026-02-11", "2026-02-12", "2026-02-13", "2026-02-14"];

const at = (day, hours, minutes) => `${day} ${pad(hours)}:${pad(minutes)}:00`;

/* =========================================================
   Комнаты
   ========================================================= */

export const rooms = [
    { room_id: 1, floor: 1, kind: "стандарт", title: "101" },
    { room_id: 2, floor: 1, kind: "стандарт", title: "102" },
    { room_id: 3, floor: 1, kind: "стандарт", title: "103" },
    { room_id: 4, floor: 1, kind: "стандарт", title: "104" },
    { room_id: 5, floor: 2, kind: "стандарт", title: "201" },
    { room_id: 6, floor: 2, kind: "стандарт", title: "202" },
    { room_id: 7, floor: 2, kind: "люкс", title: "203" },
    { room_id: 8, floor: 2, kind: "люкс", title: "204" },
    { room_id: 9, floor: 3, kind: "люкс", title: "301" },
    { room_id: 10, floor: 3, kind: "люкс", title: "302" },
    { room_id: 11, floor: 3, kind: "стандарт", title: "303" },
    { room_id: 12, floor: 3, kind: "стандарт", title: "304" },
    { room_id: 13, floor: 2, kind: "служебное", title: "Кабинет управляющего" },
    { room_id: 14, floor: 1, kind: "служебное", title: "Кухня" },
    { room_id: 15, floor: 1, kind: "служебное", title: "Бар" },
    { room_id: 16, floor: 1, kind: "служебное", title: "Лыжная" }
];

/* =========================================================
   Гости
   ========================================================= */

const g = (id, full_name, room_id, city, occupation, check_in, check_out) => ({
    id, full_name, room_id, city, occupation, check_in, check_out
});

export const guests = [
    g(1, "Анна Левина", 1, "Москва", "редактор", "2026-02-12", "2026-02-17"),
    g(2, "Борис Ковалёв", 1, "Москва", "врач", "2026-02-12", "2026-02-17"),
    g(3, "Вера Лисицына", 1, "Казань", "архитектор", "2026-02-13", null),
    g(4, "Глеб Орлов", 2, "Санкт-Петербург", "юрист", "2026-02-11", "2026-02-16"),
    g(5, "Дарья Миронова", 2, "Санкт-Петербург", "переводчик", "2026-02-11", "2026-02-16"),
    g(6, "Егор Савин", 3, "Новосибирск", "программист", "2026-02-14", "2026-02-18"),
    g(7, "Лев Громов", 3, "Москва", "антиквар", "2026-02-14", "2026-02-18"),
    g(8, "Жанна Белова", 4, "Казань", null, "2026-02-10", "2026-02-16"),
    g(9, "Захар Фомин", 4, "Екатеринбург", "инженер", "2026-02-10", "2026-02-16"),
    g(10, "Инна Крылова", 4, "Москва", "дизайнер", "2026-02-13", "2026-02-19"),
    g(11, "Константин Руднев", 5, "Санкт-Петербург", "финансист", "2026-02-12", "2026-02-18"),
    g(12, "Тимур Назаров", 5, "Екатеринбург", null, "2026-02-14", "2026-02-20"),
    g(13, "Лидия Ермакова", 6, "Москва", "учитель", "2026-02-11", "2026-02-17"),
    g(14, "Михаил Орлов", 6, "Москва", "строитель", "2026-02-11", "2026-02-17"),
    g(15, "Нина Васильева", 7, "Казань", "повар", "2026-02-13", "2026-02-19"),
    g(16, "Олег Прохоров", 7, "Новосибирск", "геолог", "2026-02-13", "2026-02-19"),
    g(17, "Полина Тихонова", 8, "Москва", "журналист", "2026-02-14", "2026-02-18"),
    g(18, "Руслан Гаврилов", 8, "Санкт-Петербург", null, "2026-02-12", null),
    g(19, "Светлана Дьякова", 9, "Екатеринбург", "художник", "2026-02-14", "2026-02-17"),
    g(20, "Ульяна Маслова", 9, "Москва", "врач", "2026-02-14", "2026-02-17"),
    g(21, "Фёдор Субботин", 9, "Казань", "пилот", "2026-02-10", "2026-02-16"),
    g(22, "Эмма Лаптева", 10, "Сочи", "актриса", "2026-02-12", "2026-02-18"),
    g(23, "Юрий Зуев", 10, "Сочи", "тренер", "2026-02-12", "2026-02-18"),
    g(24, "Ян Белкин", 10, "Сочи", "фотограф", "2026-02-14", "2026-02-18")
];

/* =========================================================
   Сотрудники
   ========================================================= */

export const staff = [
    { id: 1, full_name: "Артём Зайцев", role: "управляющий", hired_on: "2019-03-01", manager_id: null },
    { id: 2, full_name: "Ирина Седова", role: "ночной администратор", hired_on: "2021-06-14", manager_id: 1 },
    { id: 3, full_name: "Роман Мельник", role: "шеф-повар", hired_on: "2020-09-01", manager_id: 1 },
    { id: 4, full_name: "Алёна Гусева", role: "официантка", hired_on: "2023-11-20", manager_id: 3 },
    { id: 5, full_name: "Павел Кузин", role: "охранник", hired_on: "2022-02-10", manager_id: 1 },
    { id: 6, full_name: "Максим Орлов", role: "бармен", hired_on: "2024-01-15", manager_id: 3 },
    { id: 7, full_name: "Зоя Прохорова", role: "горничная", hired_on: "2018-05-05", manager_id: 2 },
    { id: 8, full_name: "Нелли Абрамова", role: "горничная", hired_on: "2025-08-18", manager_id: 2 },
    { id: 9, full_name: "Виктор Леонов", role: "истопник", hired_on: "2017-12-01", manager_id: 1 }
];

/* =========================================================
   Журнал электронных замков
   ========================================================= */

/* Гости, чья карта ни разу не открывала дверь (ходят с компаньоном). */
const GHOST_GUESTS = new Set([5, 14, 20]);

/* Гости, которые ни разу ничего не заказывали. */
const NO_ORDER_GUESTS = new Set([5, 10, 18, 24]);

function buildKeyLog() {
    const random = mulberry32(20260215);
    const between = (from, to) => from + Math.floor(random() * (to - from + 1));
    const events = [];

    const add = (room_id, guest_id, staff_id, when) =>
        events.push({ room_id, guest_id, staff_id, opened_at: when });

    /* Гости: свой номер, иногда бар или лыжная. */
    for (const guest of guests) {
        if (GHOST_GUESTS.has(guest.id)) {
            continue;
        }

        for (const day of DAYS) {
            if (day < guest.check_in) {
                continue;
            }

            const count = between(2, 4);

            for (let i = 0; i < count; i++) {
                const roll = random();
                const room = roll < 0.7 ? guest.room_id : roll < 0.9 ? 15 : 16;

                add(room, guest.id, null, at(day, between(7, 23), between(0, 59)));
            }
        }
    }

    /* Сотрудники: обходы, кухня, уборка. */
    for (const day of DAYS) {
        add(13, null, 1, at(day, between(9, 11), between(0, 59)));
        add(13, null, 5, at(day, between(12, 14), between(0, 59)));
        add(13, null, 1, at(day, between(16, 18), between(0, 59)));
        add(14, null, 3, at(day, 6, between(0, 59)));
        add(14, null, 4, at(day, 7, between(0, 59)));
        add(15, null, 6, at(day, 11, between(0, 59)));
        add(15, null, 6, at(day, 18, between(0, 59)));
        add(16, null, 9, at(day, 7, between(0, 59)));

        for (const maid of [7, 8]) {
            for (let i = 0; i < 3; i++) {
                add(between(1, 10), null, maid, at(day, between(10, 13), between(0, 59)));
            }
        }
    }

    /* Ночь на 15 февраля, записано вручную. */
    const night = "2026-02-15";

    add(15, null, 2, at(night, 0, 15));
    add(15, null, 6, at(night, 0, 20));
    add(13, 7, null, at(night, 0, 48));
    add(3, 7, null, at(night, 1, 10));
    add(13, null, 2, at(night, 1, 40));
    add(15, 12, null, at(night, 1, 50));
    add(13, 12, null, at(night, 2, 8));
    add(5, 12, null, at(night, 2, 20));
    add(13, null, 5, at(night, 2, 31));
    add(15, null, 6, at(night, 2, 45));
    add(13, null, 1, at(night, 3, 5));

    events.sort((a, b) => (a.opened_at < b.opened_at ? -1 : a.opened_at > b.opened_at ? 1 : 0));

    return events.map((event, index) => ({ id: index + 1, ...event }));
}

export const keyLog = buildKeyLog();

/* =========================================================
   Заказы в ресторане и баре
   ========================================================= */

const MENU = [
    ["Кофе", 250],
    ["Чай", 200],
    ["Суп", 480],
    ["Стейк", 1450],
    ["Коньяк", 900],
    ["Виски", 1100],
    ["Глинтвейн", 550],
    ["Пирог", 380],
    ["Салат", 420],
    ["Лимонад", 300]
];

function buildOrders() {
    const random = mulberry32(1724);
    const between = (from, to) => from + Math.floor(random() * (to - from + 1));
    const items = [];

    const add = (guest_id, item, price, when) =>
        items.push({ guest_id, item, price, ordered_at: when });

    for (const guest of guests) {
        if (NO_ORDER_GUESTS.has(guest.id) || guest.id === 12) {
            continue;
        }

        const days = DAYS.filter(day => day >= guest.check_in);
        const count = between(2, 5);

        for (let i = 0; i < count; i++) {
            const [item, price] = MENU[between(0, MENU.length - 1)];

            add(guest.id, item, price, at(days[between(0, days.length - 1)], between(12, 23), between(0, 59)));
        }
    }

    /* Тимур Назаров: последний заказ в 01:55, дальше тишина. */
    add(12, "Стейк", 1450, "2026-02-14 20:10:00");
    add(12, "Глинтвейн", 550, "2026-02-14 21:40:00");
    add(12, "Виски", 1100, "2026-02-15 01:55:00");

    /* Лев Громов: коньяк в баре перед тем, как зайти в кабинет. */
    add(7, "Коньяк", 900, "2026-02-15 00:30:00");

    items.sort((a, b) => (a.ordered_at < b.ordered_at ? -1 : a.ordered_at > b.ordered_at ? 1 : 0));

    return items.map((order, index) => ({ id: index + 1, ...order }));
}

export const orders = buildOrders();
