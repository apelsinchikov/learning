/*
 * Данные учебной базы «Перевал: сезон». Порождаются детерминированно:
 * зерно фиксировано, поэтому у всех учеников одни и те же строки,
 * а эталонные ответы уроков стабильны.
 */

export const SEASON = { start: "2025-11-01", end: "2026-04-30", today: "2026-02-15" };

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

const DAY = 86400000;
const toDate = text => new Date(`${text}T00:00:00Z`);
const iso = date => date.toISOString().slice(0, 10);
const addDays = (text, days) => iso(new Date(toDate(text).getTime() + days * DAY));
const pad = n => String(n).padStart(2, "0");

const FIRST_NAMES = [
    "Анна", "Борис", "Вера", "Глеб", "Дарья", "Егор", "Жанна", "Игорь", "Карина", "Леонид", "Мария", "Никита",
    "Ольга", "Павел", "Раиса", "Сергей", "Татьяна", "Ульяна", "Фёдор", "Хельга", "Эмма", "Юрий", "Яна", "Артём"
];
const LAST_NAMES = [
    "Лебедев", "Морозов", "Крылов", "Соколов", "Воронин", "Жуков", "Зайцев", "Ковалёв", "Романов", "Тихонов",
    "Фролов", "Белов", "Гусев", "Данилов", "Ермаков", "Исаев", "Кузнецов", "Лазарев", "Назаров", "Орлов",
    "Петров", "Семёнов", "Титов", "Устинов"
];
const CITIES = ["Москва", "Санкт-Петербург", "Казань", "Сочи", "Екатеринбург", "Новосибирск", "Нижний Новгород", "Самара"];

const ROOM_KINDS = [
    { kind: "standard", capacity: 2, price: 4500 },
    { kind: "comfort", capacity: 3, price: 6500 },
    { kind: "suite", capacity: 4, price: 9500 }
];

const STAFF = [
    [1, "Марина Власова", "director", "2019-03-01", null],
    [2, "Олег Рябов", "manager", "2020-06-15", 1],
    [3, "Инна Громова", "manager", "2021-02-01", 1],
    [4, "Светлана Нестерова", "administrator", "2022-09-10", 2],
    [5, "Андрей Платонов", "administrator", "2022-11-21", 2],
    [6, "Полина Костина", "administrator", "2023-04-03", 3],
    [7, "Виктор Малинин", "administrator", "2023-07-17", 3],
    [8, "Елена Широкова", "cleaner", "2023-10-02", 4],
    [9, "Тимофей Бугров", "cleaner", "2024-01-15", 5],
    [10, "Лидия Осипова", "cleaner", "2024-05-06", 6],
    [11, "Руслан Галиев", "driver", "2024-08-19", 7],
    [12, "Нина Фомина", "chef", "2025-01-13", 3]
];

const SERVICES = [
    [1, "Завтрак", 650],
    [2, "Трансфер от станции", 1500],
    [3, "Баня", 2000],
    [4, "Прокат лыж", 1200],
    [5, "Экскурсия на перевал", 1800],
    [6, "Парковка", 300],
    [7, "Детская кроватка", 400],
    [8, "Поздний выезд", 1000]
];

const NIGHTS = [1, 2, 2, 3, 3, 3, 4, 5, 7];

export function generateSeason(seed = 2026) {
    const random = mulberry32(seed);
    const int = (min, max) => min + Math.floor(random() * (max - min + 1));
    const pick = list => list[int(0, list.length - 1)];

    /* Комнаты: 12 штук, по четыре на этаже. */
    const rooms = Array.from({ length: 12 }, (_, index) => {
        const id = index + 1;
        const spec = ROOM_KINDS[index % 3 === 2 ? 2 : index % 3 === 1 ? 1 : 0];
        const floor = Math.floor(index / 4) + 1;

        return { id, number: `${floor}${pad((index % 4) + 1)}`, floor, kind: spec.kind, capacity: spec.capacity, price_per_night: spec.price };
    });

    /* Гости: 120 разных сочетаний имени и фамилии. */
    const used = new Set();
    const guests = [];

    while (guests.length < 120) {
        const first = pick(FIRST_NAMES);
        const last = pick(LAST_NAMES);
        const key = `${first} ${last}`;

        if (used.has(key)) {
            continue;
        }

        used.add(key);

        const id = guests.length + 1;
        const month = int(10, 12);

        guests.push({
            id,
            full_name: key,
            email: `guest${id}@example.com`,
            phone: random() < 0.25 ? null : `+7 9${int(10, 99)} ${int(100, 999)}-${int(10, 99)}-${int(10, 99)}`,
            city: pick(CITIES),
            created_at: `2025-${pad(month)}-${pad(int(1, 28))} ${pad(int(8, 20))}:${pad(int(0, 59))}:00`
        });
    }

    const staff = STAFF.map(([id, full_name, role, hired_on, manager_id]) => ({ id, full_name, role, hired_on, manager_id }));
    const services = SERVICES.map(([id, title, price]) => ({ id, title, price }));

    /* Брони: у каждой комнаты свои стойки подряд, без пересечений. */
    const bookings = [];
    const bookingServices = [];
    const payments = [];
    const admins = staff.filter(person => person.role === "administrator").map(person => person.id);
    const managers = staff.filter(person => person.role === "manager").map(person => person.id);

    for (const room of rooms) {
        let cursor = addDays(SEASON.start, int(0, 3));

        while (cursor < SEASON.end) {
            const nights = pick(NIGHTS);

            bookings.push({ room, check_in: cursor, check_out: addDays(cursor, nights), nights });
            cursor = addDays(cursor, nights + int(0, 4));
        }
    }

    bookings.sort((a, b) => (a.check_in < b.check_in ? -1 : a.check_in > b.check_in ? 1 : a.room.id - b.room.id));

    const result = bookings.map((raw, index) => {
        const id = index + 1;
        const sourceRoll = random();
        const source = sourceRoll < 0.5 ? "site" : sourceRoll < 0.8 ? "phone" : "agency";
        const staffId = source === "site" ? null : source === "phone" ? pick(admins) : pick(managers);
        const cancelled = random() < 0.08;
        const status = cancelled ? "cancelled" : raw.check_out <= SEASON.today ? "completed" : "confirmed";
        const createdDay = addDays(raw.check_in, -int(3, 60));

        return {
            id,
            guest_id: int(1, guests.length),
            room_id: raw.room.id,
            check_in: raw.check_in,
            check_out: raw.check_out,
            status,
            source,
            staff_id: staffId,
            created_at: `${createdDay} ${pad(int(8, 21))}:${pad(int(0, 59))}:00`,
            nights: raw.nights,
            price: raw.room.price_per_night
        };
    });

    let paymentId = 1;

    for (const booking of result) {
        let total = booking.nights * booking.price;

        if (booking.status !== "cancelled" && random() < 0.55) {
            const count = int(1, 3);
            const chosen = new Set();

            while (chosen.size < count) {
                chosen.add(pick(services).id);
            }

            for (const serviceId of [...chosen].sort((a, b) => a - b)) {
                const quantity = int(1, 3);

                bookingServices.push({ booking_id: booking.id, service_id: serviceId, quantity });
                total += services[serviceId - 1].price * quantity;
            }
        }

        const addPayment = (amount, method, paidAt, status = "paid") => {
            payments.push({ id: paymentId++, booking_id: booking.id, amount, method, paid_at: paidAt, status });
        };

        const method = () => pick(["card", "card", "card", "cash", "transfer"]);
        const prepay = Math.round(total * 0.3);
        const createdDay = booking.created_at.slice(0, 10);
        const roll = random();

        if (booking.status === "completed") {
            if (roll < 0.05) {
                continue;
            }

            if (roll < 0.17) {
                addPayment(prepay, method(), `${addDays(createdDay, 1)} 12:00:00`);
                addPayment(total - prepay, method(), `${booking.check_in} 14:00:00`);
            } else {
                addPayment(total, method(), `${booking.check_in} 14:00:00`);
            }
        } else if (booking.status === "confirmed") {
            if (roll < 0.7) {
                addPayment(prepay, method(), `${addDays(createdDay, 1)} 12:00:00`);
            } else if (roll < 0.85) {
                addPayment(total, method(), `${addDays(createdDay, 1)} 12:00:00`);
            }
        } else if (roll < 0.4) {
            addPayment(prepay, method(), `${addDays(createdDay, 1)} 12:00:00`, "refunded");
        }
    }

    return {
        rooms,
        guests,
        staff,
        services,
        bookings: result.map(({ nights, price, ...booking }) => booking),
        payments,
        bookingServices
    };
}
