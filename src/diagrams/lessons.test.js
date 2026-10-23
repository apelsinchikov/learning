import { describe, expect, it } from "vitest";

import { checkDiagram, parseDiagram } from "./compare/index.js";
import { CHAPTERS, diagramLessons, findDiagramLesson, isDiagramTask, lessonNumber } from "./lessons/index.js";

describe("структура курса «Диаграммы»", () => {
    it("пять глав, 23 урока, идентификаторы dg- и уникальные", () => {
        const ids = diagramLessons.map(lesson => lesson.id);

        expect(CHAPTERS).toHaveLength(5);
        expect(diagramLessons).toHaveLength(23);
        expect(new Set(ids).size).toBe(ids.length);
        expect(ids.every(id => id.startsWith("dg-"))).toBe(true);
    });

    it("поиск урока и номер", () => {
        expect(findDiagramLesson("dg-why").title).toBe("Зачем аналитику диаграммы");
        expect(findDiagramLesson("нет")).toBeNull();
        expect(lessonNumber("dg-why")).toBe(1);
        expect(lessonNumber("dg-case-seq")).toBe(23);
    });

    for (const lesson of diagramLessons) {
        describe(lesson.id, () => {
            it("есть сюжет, название, краткое описание и шпаргалка", () => {
                expect(lesson.title.length).toBeGreaterThan(3);
                expect(lesson.summary.length).toBeGreaterThan(3);
                expect(lesson.story.trim().length).toBeGreaterThan(50);
                expect(lesson.cheat.length).toBeGreaterThan(0);
                expect(lesson.cheat.every(pair => pair.length === 2 && pair[0] && pair[1])).toBe(true);
            });

            it("в теории есть блок «Зачем»", () => {
                expect(lesson.theory.some(block => block.type === "why")).toBe(true);
            });

            it("диаграммы в теории разбираются без ошибок", () => {
                for (const block of lesson.theory.filter(item => item.type === "diagram" || item.type === "tryit")) {
                    const parsed = parseDiagram(block.kind, block.code);

                    expect(parsed.errors, block.code).toEqual([]);
                    expect(parsed.warnings, block.code).toEqual([]);
                    expect(parsed.unknown, block.code).toEqual([]);
                }
            });

            it("задача устроена правильно", () => {
                const { task } = lesson;

                expect(task.prompt.trim().length).toBeGreaterThan(10);

                if (isDiagramTask(lesson)) {
                    expect(["er", "sequence"]).toContain(task.diagram);
                    expect(task.hints).toHaveLength(3);
                    expect(task.starter).toBeTruthy();
                    expect(task.solution).toBeTruthy();
                } else {
                    expect(task.kind).toBe("quiz");
                    expect(task.questions.length).toBeGreaterThan(0);

                    for (const question of task.questions) {
                        expect(question.explain.length).toBeGreaterThan(5);

                        if (question.type === "order") {
                            expect(question.items.length).toBeGreaterThan(2);
                            expect([...question.shuffle].sort()).toEqual(question.items.map((_, index) => index));
                            expect(question.shuffle.some((value, index) => value !== index)).toBe(true);
                        } else {
                            expect(question.type).toBe("choice");
                            expect(question.options.length).toBeGreaterThan(1);
                            expect(question.correct).toBeGreaterThanOrEqual(0);
                            expect(question.correct).toBeLessThan(question.options.length);
                        }
                    }
                }
            });

            if (isDiagramTask(lesson)) {
                it("эталон разбирается без ошибок и принимается", () => {
                    const { task } = lesson;
                    const parsed = parseDiagram(task.diagram, task.solution);

                    expect(parsed.errors).toEqual([]);
                    expect(parsed.warnings).toEqual([]);
                    expect(parsed.unknown).toEqual([]);
                    expect(checkDiagram(task.diagram, task.solution, task.solution, task.check).ok).toBe(true);
                });

                it("заготовка не проходит проверку, но сама без синтаксических ошибок", () => {
                    const { task } = lesson;
                    const parsed = parseDiagram(task.diagram, task.starter);

                    expect(parsed.errors).toEqual([]);
                    expect(checkDiagram(task.diagram, task.starter, task.solution, task.check).ok).toBe(false);
                });

                it("подсказки растут и не содержат эталон целиком", () => {
                    const { task } = lesson;

                    expect(task.hints.every(hint => hint.length > 10)).toBe(true);
                    expect(task.hints.some(hint => hint.includes(task.solution.trim()))).toBe(false);
                });
            }
        });
    }
});

describe("задачи с эталоном принимают разумные варианты", () => {
    it("другой порядок атрибутов и сущностей, регистр и подписи в ER", () => {
        const lesson = findDiagramLesson("dg-er-one-many");
        const student = `erDiagram
    booking {
        date check_out
        int guest_id FK
        date check_in
        int id PK
    }
    guest {
        string full_name
        int id PK
    }
    booking }o--|| guest : "относится"`;

        expect(checkDiagram("er", student, lesson.task.solution, lesson.task.check).ok).toBe(true);
    });

    it("sequence: русские идентификаторы и другой текст сообщений", () => {
        const lesson = findDiagramLesson("dg-seq-arrows");
        const student = `sequenceDiagram
    participant Гость
    participant Сайт
    participant Сервис бронирования
    participant Очередь писем
    Гость->>Сайт: 1
    Сайт->>Сервис бронирования: 2
    Сервис бронирования-->>Сайт: 3
    Сайт-)Очередь писем: 4
    Сайт-->>Гость: 5`;

        expect(checkDiagram("sequence", student, lesson.task.solution, lesson.task.check).ok).toBe(true);
    });

    it("типичные ошибки отклоняются: связь без связующей сущности в уроке про «многие ко многим»", () => {
        const lesson = findDiagramLesson("dg-er-many-many");
        const wrong = `erDiagram
    BOOKING }o--o{ SERVICE : "включает"
    BOOKING {
        int id PK
    }
    SERVICE {
        int id PK
        string title
        decimal price
    }`;

        expect(checkDiagram("er", wrong, lesson.task.solution, lesson.task.check).ok).toBe(false);
    });

    it("урок про транзакцию: нет ROLLBACK в ветке конфликта — отклонено", () => {
        const lesson = findDiagramLesson("dg-method-db");
        const wrong = lesson.task.solution.replace("API->>DB: ROLLBACK\n        API-->>Client: 409 Conflict", "API-->>Client: 409 Conflict");

        expect(wrong).not.toBe(lesson.task.solution);
        expect(checkDiagram("sequence", wrong, lesson.task.solution, lesson.task.check).ok).toBe(false);
    });
});
