/*
 * Модель прогресса: только чистые функции, ничего не знают про
 * браузер, сеть и Supabase. Каждая функция возвращает НОВЫЙ объект.
 *
 * Progress = {
 *   currentLesson: { id, updatedAt } | null,
 *   lessons: { [lessonId]: { read, solved, draft, draftUpdatedAt } }
 * }
 */

const now = () => new Date().toISOString();

export function createEmptyProgress() {
    return { currentLesson: null, lessons: {} };
}

function emptyEntry() {
    return { read: false, solved: false, draft: null, draftUpdatedAt: null };
}

function updateLesson(progress, lessonId, change) {
    const entry = progress.lessons[lessonId] || emptyEntry();

    return {
        ...progress,
        lessons: {
            ...progress.lessons,
            [lessonId]: { ...entry, ...change }
        }
    };
}

export function markRead(progress, lessonId) {
    return updateLesson(progress, lessonId, { read: true });
}

export function markSolved(progress, lessonId) {
    return updateLesson(progress, lessonId, { solved: true });
}

export function saveDraft(progress, lessonId, yaml, at = now()) {
    return updateLesson(progress, lessonId, { draft: yaml, draftUpdatedAt: at });
}

export function setCurrentLesson(progress, lessonId, at = now()) {
    return { ...progress, currentLesson: { id: lessonId, updatedAt: at } };
}

export function getDraft(progress, lessonId) {
    return progress.lessons[lessonId]?.draft ?? null;
}

function mergeEntries(a = emptyEntry(), b = emptyEntry()) {
    const aHasDraft = a.draft !== null;
    const bHasDraft = b.draft !== null;
    let winner = a;

    if (bHasDraft && !aHasDraft) {
        winner = b;
    } else if (aHasDraft && bHasDraft && b.draftUpdatedAt > a.draftUpdatedAt) {
        winner = b;
    }

    return {
        read: a.read || b.read,
        solved: a.solved || b.solved,
        draft: winner.draft,
        draftUpdatedAt: winner.draftUpdatedAt
    };
}

export function mergeProgress(a, b) {
    const ids = new Set([...Object.keys(a.lessons), ...Object.keys(b.lessons)]);
    const lessons = {};

    for (const id of ids) {
        lessons[id] = mergeEntries(a.lessons[id], b.lessons[id]);
    }

    let currentLesson = a.currentLesson || b.currentLesson;

    if (a.currentLesson && b.currentLesson) {
        currentLesson = b.currentLesson.updatedAt > a.currentLesson.updatedAt
            ? b.currentLesson
            : a.currentLesson;
    }

    return { currentLesson, lessons };
}

export function isLessonDone(lesson, progress) {
    const entry = progress.lessons[lesson.id];

    if (!entry) {
        return false;
    }

    return lesson.type === "practice" ? entry.solved : entry.read;
}

export function countDone(course, progress) {
    return course.filter(lesson => isLessonDone(lesson, progress)).length;
}
