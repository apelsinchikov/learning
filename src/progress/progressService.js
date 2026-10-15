import {
    createEmptyProgress,
    markRead as modelMarkRead,
    markSolved as modelMarkSolved,
    mergeProgress,
    saveDraft as modelSaveDraft,
    setCurrentLesson as modelSetCurrentLesson
} from "./progressModel.js";

/*
 * Единая точка работы с прогрессом для интерфейса.
 *
 * - Прогресс всегда пишется в локальное хранилище (мгновенно).
 * - Если пользователь вошёл, изменения уходят и в облако: сразу,
 *   а черновики YAML — с паузой, чтобы не слать запрос на каждую букву.
 * - Ошибки облака не ломают курс: данные остаются локально и
 *   отправляются со следующим действием.
 * - Кэш другого пользователя никогда не попадает в чужой аккаунт.
 */
export function createProgressService({
    localStore,
    cloudStore,
    debounceMs = 1500,
    timers = { setTimeout, clearTimeout }
}) {
    const loaded = localStore.load();

    let progress = loaded.progress;
    let owner = loaded.owner;
    let userId = null;
    let pendingSignIn = null;

    const pendingLessons = new Set();
    let pendingCurrent = false;
    let draftTimer = null;
    let queue = Promise.resolve();

    const changeListeners = new Set();
    const errorListeners = new Set();

    const notify = () => changeListeners.forEach(listener => listener(progress));
    const reportError = error => errorListeners.forEach(listener => listener(error));

    /* Все обращения к облаку идут по очереди, чтобы не обгонять друг друга. */
    function enqueue(task) {
        queue = queue.then(task, task);
        return queue;
    }

    async function sendPending() {
        if (!userId || (pendingLessons.size === 0 && !pendingCurrent)) {
            return;
        }

        const changed = {
            lessonIds: [...pendingLessons],
            currentLesson: pendingCurrent
        };

        pendingLessons.clear();
        pendingCurrent = false;

        try {
            await cloudStore.save(userId, progress, changed);
        } catch (error) {
            changed.lessonIds.forEach(id => pendingLessons.add(id));
            pendingCurrent = pendingCurrent || changed.currentLesson;
            reportError(error);
        }
    }

    async function performSignIn(id) {
        pendingSignIn = id;

        if (owner !== null && owner !== id) {
            progress = createEmptyProgress();
            owner = null;
            localStore.clear();
            notify();
        }

        let cloudProgress;

        try {
            cloudProgress = await cloudStore.load(id);
        } catch (error) {
            reportError(error);
            return;
        }

        pendingSignIn = null;
        userId = id;
        owner = id;
        progress = mergeProgress(progress, cloudProgress);

        localStore.save(progress, owner);

        Object.keys(progress.lessons).forEach(lessonId => pendingLessons.add(lessonId));
        pendingCurrent = true;

        notify();
        await sendPending();
    }

    /* Что делать — решаем уже внутри очереди, когда до задачи дошла очередь. */
    function syncNow() {
        return enqueue(() =>
            pendingSignIn ? performSignIn(pendingSignIn) : sendPending()
        );
    }

    function track({ lessonId = null, current = false }) {
        if (lessonId !== null) {
            pendingLessons.add(lessonId);
        }

        pendingCurrent = pendingCurrent || current;
    }

    function commit(next, tracking, { deferred = false } = {}) {
        progress = next;
        localStore.save(progress, owner);
        notify();

        if (!userId && !pendingSignIn) {
            return;
        }

        track(tracking);

        if (!deferred) {
            syncNow();
            return;
        }

        timers.clearTimeout(draftTimer);
        draftTimer = timers.setTimeout(() => {
            draftTimer = null;
            syncNow();
        }, debounceMs);
    }

    return {
        getProgress: () => progress,

        getUserId: () => userId,

        onChange(listener) {
            changeListeners.add(listener);
            return () => changeListeners.delete(listener);
        },

        onSyncError(listener) {
            errorListeners.add(listener);
            return () => errorListeners.delete(listener);
        },

        markRead(lessonId) {
            if (progress.lessons[lessonId]?.read) {
                return;
            }

            commit(modelMarkRead(progress, lessonId), { lessonId });
        },

        markSolved(lessonId) {
            if (progress.lessons[lessonId]?.solved) {
                return;
            }

            commit(modelMarkSolved(progress, lessonId), { lessonId });
        },

        setCurrentLesson(lessonId) {
            if (progress.currentLesson?.id === lessonId) {
                return;
            }

            commit(modelSetCurrentLesson(progress, lessonId), { current: true });
        },

        saveDraft(lessonId, yaml) {
            commit(
                modelSaveDraft(progress, lessonId, yaml),
                { lessonId },
                { deferred: true }
            );
        },

        signedIn: id => enqueue(() => performSignIn(id)),

        signedOut() {
            if (userId === null && owner === null && pendingSignIn === null) {
                return;
            }

            timers.clearTimeout(draftTimer);
            draftTimer = null;
            pendingLessons.clear();
            pendingCurrent = false;
            pendingSignIn = null;
            userId = null;
            owner = null;
            progress = createEmptyProgress();
            localStore.clear();
            notify();
        },

        /* Вызывается при старте: есть ли уже действующая сессия. */
        async restoreSession(id) {
            if (id) {
                return enqueue(() => performSignIn(id));
            }

            if (owner !== null || userId !== null) {
                this.signedOut();
            }
        },

        flush() {
            timers.clearTimeout(draftTimer);
            draftTimer = null;

            return syncNow();
        }
    };
}
