import { describe, expect, it, vi } from "vitest";

import { createProgressService } from "./progressService.js";
import {
    createEmptyProgress,
    getDraft,
    markRead,
    markSolved,
    saveDraft
} from "./progressModel.js";

const OLD = "2026-01-01T10:00:00.000Z";
const NEW = "2026-01-01T12:00:00.000Z";

function fakeLocalStore(progress = createEmptyProgress(), owner = null) {
    return {
        load: () => ({ progress, owner }),
        save: vi.fn(),
        clear: vi.fn()
    };
}

function fakeCloudStore(cloudProgress = createEmptyProgress()) {
    return {
        load: vi.fn().mockResolvedValue(cloudProgress),
        save: vi.fn().mockResolvedValue(undefined)
    };
}

/* Ручные «часы»: таймеры не идут сами, тест запускает их явно. */
function fakeTimers() {
    const scheduled = new Map();
    let nextId = 1;

    return {
        setTimeout: fn => {
            scheduled.set(nextId, fn);
            return nextId++;
        },
        clearTimeout: id => scheduled.delete(id),
        runAll() {
            const callbacks = [...scheduled.values()];
            scheduled.clear();
            callbacks.forEach(fn => fn());
        }
    };
}

function setup({ local, cloud, owner = null, cloudProgress } = {}) {
    const localStore = local || fakeLocalStore(createEmptyProgress(), owner);
    const cloudStore = cloud || fakeCloudStore(cloudProgress);
    const timers = fakeTimers();
    const service = createProgressService({ localStore, cloudStore, timers });

    return { service, localStore, cloudStore, timers };
}

describe("progressService: гость", () => {
    it("пишет прогресс локально как гостя и не трогает облако", async () => {
        const { service, localStore, cloudStore } = setup();

        service.markSolved("practice-1");
        await service.flush();

        expect(service.getProgress().lessons["practice-1"].solved).toBe(true);
        expect(localStore.save.mock.calls.at(-1)[1]).toBeNull();
        expect(cloudStore.save).not.toHaveBeenCalled();
    });

    it("onChange вызывается при изменениях, отписка работает", () => {
        const { service } = setup();
        const listener = vi.fn();
        const off = service.onChange(listener);

        service.markRead("t1");
        off();
        service.markRead("t2");

        expect(listener).toHaveBeenCalledTimes(1);
    });
});

describe("progressService: вход и слияние", () => {
    it("гостевой прогресс при входе уходит в пустое облако и кэшируется на пользователя", async () => {
        const guest = markSolved(createEmptyProgress(), "practice-1");
        const { service, localStore, cloudStore } = setup({
            local: fakeLocalStore(guest, null)
        });

        await service.signedIn("u1");

        expect(cloudStore.save).toHaveBeenCalledTimes(1);
        const [userId, saved] = cloudStore.save.mock.calls[0];
        expect(userId).toBe("u1");
        expect(saved.lessons["practice-1"].solved).toBe(true);
        expect(localStore.save.mock.calls.at(-1)[1]).toBe("u1");
        expect(service.getUserId()).toBe("u1");
    });

    it("побеждает более свежий черновик: облачный", async () => {
        const local = saveDraft(createEmptyProgress(), "p", "local", OLD);
        const cloud = saveDraft(createEmptyProgress(), "p", "cloud", NEW);
        const { service } = setup({
            local: fakeLocalStore(local, null),
            cloudProgress: cloud
        });

        await service.signedIn("u1");

        expect(getDraft(service.getProgress(), "p")).toBe("cloud");
    });

    it("побеждает более свежий черновик: локальный", async () => {
        const local = saveDraft(createEmptyProgress(), "p", "local", NEW);
        const cloud = saveDraft(createEmptyProgress(), "p", "cloud", OLD);
        const { service } = setup({
            local: fakeLocalStore(local, null),
            cloudProgress: cloud
        });

        await service.signedIn("u1");

        expect(getDraft(service.getProgress(), "p")).toBe("local");
    });

    it("кэш другого пользователя выбрасывается и не уходит в чужой аккаунт", async () => {
        const cacheOfA = markSolved(createEmptyProgress(), "secret-of-A");
        const { service, cloudStore } = setup({
            local: fakeLocalStore(cacheOfA, "userA"),
            cloudProgress: markRead(createEmptyProgress(), "t1")
        });

        await service.signedIn("userB");

        expect(service.getProgress().lessons["secret-of-A"]).toBeUndefined();
        expect(service.getProgress().lessons.t1.read).toBe(true);
        const sent = JSON.stringify(cloudStore.save.mock.calls);
        expect(sent).not.toContain("secret-of-A");
    });

    it("кэш того же пользователя сливается с облаком", async () => {
        const cache = markSolved(createEmptyProgress(), "p1");
        const { service } = setup({
            local: fakeLocalStore(cache, "u1"),
            cloudProgress: markRead(createEmptyProgress(), "t1")
        });

        await service.signedIn("u1");

        expect(service.getProgress().lessons.p1.solved).toBe(true);
        expect(service.getProgress().lessons.t1.read).toBe(true);
    });

    it("если облако недоступно при входе, локальный прогресс цел, ошибка сообщена, следующее действие повторяет загрузку", async () => {
        const guest = markSolved(createEmptyProgress(), "p1");
        const cloud = fakeCloudStore();
        cloud.load.mockRejectedValue(new Error("offline"));
        const { service } = setup({ local: fakeLocalStore(guest, null), cloud });
        const onError = vi.fn();
        service.onSyncError(onError);

        await service.signedIn("u1");

        expect(onError).toHaveBeenCalledTimes(1);
        expect(service.getProgress().lessons.p1.solved).toBe(true);
        expect(cloud.save).not.toHaveBeenCalled();

        cloud.load.mockResolvedValue(createEmptyProgress());
        service.markRead("t1");
        await service.flush();

        expect(cloud.load).toHaveBeenCalledTimes(2);
        expect(cloud.save).toHaveBeenCalled();
    });
});

describe("progressService: синхронизация", () => {
    it("ошибка записи в облако не теряет данные и повторяется со следующим действием", async () => {
        const { service, cloudStore } = setup();
        await service.signedIn("u1");
        cloudStore.save.mockClear();
        /* Нет связи: и первая отправка, и повтор из flush не проходят. */
        cloudStore.save.mockRejectedValueOnce(new Error("offline"));
        cloudStore.save.mockRejectedValueOnce(new Error("offline"));
        const onError = vi.fn();
        service.onSyncError(onError);

        service.markSolved("p1");
        await service.flush();

        expect(onError).toHaveBeenCalledTimes(2);
        expect(service.getProgress().lessons.p1.solved).toBe(true);

        service.markRead("t1");
        await service.flush();

        const lastChanged = cloudStore.save.mock.calls.at(-1)[2];
        expect(lastChanged.lessonIds).toContain("p1");
        expect(lastChanged.lessonIds).toContain("t1");
    });

    it("несколько быстрых правок YAML дают одну запись с последним текстом", async () => {
        const { service, cloudStore, timers } = setup();
        await service.signedIn("u1");
        cloudStore.save.mockClear();

        ["a", "ab", "abc", "abcd", "abcde"].forEach(text =>
            service.saveDraft("p1", text)
        );

        expect(cloudStore.save).not.toHaveBeenCalled();

        timers.runAll();
        await service.flush();

        expect(cloudStore.save).toHaveBeenCalledTimes(1);
        const saved = cloudStore.save.mock.calls[0][1];
        expect(getDraft(saved, "p1")).toBe("abcde");
    });

    it("flush отправляет отложенный черновик сразу", async () => {
        const { service, cloudStore } = setup();
        await service.signedIn("u1");
        cloudStore.save.mockClear();

        service.saveDraft("p1", "text");
        await service.flush();

        expect(cloudStore.save).toHaveBeenCalledTimes(1);
    });
});

describe("progressService: выход", () => {
    it("signedOut очищает локальный кэш и прогресс", async () => {
        const { service, localStore } = setup();
        await service.signedIn("u1");
        service.markSolved("p1");

        service.signedOut();

        expect(localStore.clear).toHaveBeenCalled();
        expect(service.getProgress()).toEqual(createEmptyProgress());
        expect(service.getUserId()).toBeNull();
    });

    it("лишнее событие выхода у гостя не стирает его прогресс", () => {
        const { service, localStore } = setup();
        service.markSolved("p1");

        service.signedOut();

        expect(localStore.clear).not.toHaveBeenCalled();
        expect(service.getProgress().lessons.p1.solved).toBe(true);
    });

    it("restoreSession(null) с чужим кэшем очищает его, у гостя — нет", async () => {
        const cacheOfA = markSolved(createEmptyProgress(), "p1");
        const withOwner = setup({ local: fakeLocalStore(cacheOfA, "userA") });
        await withOwner.service.restoreSession(null);
        expect(withOwner.service.getProgress()).toEqual(createEmptyProgress());

        const guest = setup({ local: fakeLocalStore(cacheOfA, null) });
        await guest.service.restoreSession(null);
        expect(guest.service.getProgress().lessons.p1.solved).toBe(true);
    });

    it("restoreSession(userId) работает как signedIn", async () => {
        const { service } = setup({
            cloudProgress: markRead(createEmptyProgress(), "t1")
        });

        await service.restoreSession("u1");

        expect(service.getUserId()).toBe("u1");
        expect(service.getProgress().lessons.t1.read).toBe(true);
    });
});
