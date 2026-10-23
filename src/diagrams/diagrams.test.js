import { describe, expect, it } from "vitest";

import { checkDiagram, parseDiagram } from "./compare/index.js";
import { humanizeDiagramError, lineFromError } from "./errors.js";
import { parseEr } from "./parse/er.js";
import { parseSequence } from "./parse/sequence.js";
import { closestWord, meaningfulLines } from "./parse/text.js";

const ER = `erDiagram
    GUEST ||--o{ BOOKING : "делает"
    GUEST {
        int id PK
        string full_name
    }
    BOOKING {
        int id PK
        int guest_id FK
    }`;

describe("meaningfulLines", () => {
    it("пропускает пустые строки, комментарии и блок настроек", () => {
        const lines = meaningfulLines("---\ntitle: x\n---\n\n%% заметка\nerDiagram\n  A\n");

        expect(lines.map(item => item.text)).toEqual(["erDiagram", "A"]);
        expect(lines[0].line).toBe(6);
    });

    it("closestWord находит опечатку, но не придумывает похожее", () => {
        expect(closestWord("erDiagrm", ["erDiagram"])).toBe("erDiagram");
        expect(closestWord("qwerty", ["erDiagram"])).toBeNull();
    });
});

describe("parseEr", () => {
    it("разбирает сущности, атрибуты, ключи и связи", () => {
        const result = parseEr(ER);

        expect(result.ok).toBe(true);
        expect(Object.keys(result.model.entities)).toEqual(["guest", "booking"]);
        expect(result.model.entities.booking.attrs[1]).toMatchObject({ name: "guest_id", type: "int", keys: ["FK"] });
        expect(result.model.relations).toHaveLength(1);
        expect(result.model.relations[0].aCard).toEqual({ min: 1, max: 1 });
        expect(result.model.relations[0].bCard).toEqual({ min: 0, max: "n" });
    });

    it("опечатка в первой строке", () => {
        const result = parseEr("erDiagrm\n A ||--o{ B : x");

        expect(result.ok).toBe(false);
        expect(result.errors[0].code).toBe("header-typo");
    });

    it("не хватает подписи у связи", () => {
        const result = parseEr("erDiagram\n A ||--o{ B");

        expect(result.errors.map(item => item.code)).toContain("relation-label");
    });

    it("неверно записанная связь", () => {
        const result = parseEr("erDiagram\n A ||-o{ B : x");

        expect(result.errors[0].code).toBe("bad-relation");
    });

    it("не закрыт блок сущности", () => {
        const result = parseEr("erDiagram\n A {\n int id PK");

        expect(result.errors.map(item => item.code)).toContain("unclosed-entity");
    });

    it("ключи пишутся заглавными, неизвестный ключ — ошибка", () => {
        expect(parseEr("erDiagram\n A {\n int id pk\n }").errors[0].message).toContain("заглавными");
        expect(parseEr("erDiagram\n A {\n int id XX\n }").errors[0].code).toBe("bad-key");
    });

    it("предупреждает о русском тексте без кавычек, но это не ошибка", () => {
        const result = parseEr("erDiagram\n A ||--o{ B : делает");

        expect(result.ok).toBe(true);
        expect(result.warnings.map(item => item.code)).toEqual(["label-quotes"]);
    });

    it("сущность без атрибутов, имя в кавычках, комментарии", () => {
        const result = parseEr('erDiagram\n %% тут\n "ROOM TYPE"\n A');

        expect(Object.values(result.model.entities).map(item => item.name)).toEqual(["ROOM TYPE", "A"]);
    });
});

describe("сравнение ER", () => {
    const solution = ER;

    it("то же самое другими словами и в другом порядке — верно", () => {
        const student = `erDiagram
    BOOKING {
        int id PK
        int guest_id FK
        date check_in
    }
    GUEST {
        string full_name
        int id PK
    }
    booking }o--|| guest : "принадлежит"`;

        expect(checkDiagram("er", student, solution).ok).toBe(true);
    });

    it("не та кратность: указывает сторону, но не ответ", () => {
        const result = checkDiagram("er", ER.replace("||--o{", "||--||"), solution);

        expect(result.ok).toBe(false);
        expect(result.issues[0].code).toBe("wrong-cardinality");
        expect(result.issues[0].message).toContain("BOOKING");
        expect(result.issues[0].message).not.toContain("o{");
    });

    it("нет связи, нет сущности, лишняя сущность", () => {
        const noRelation = checkDiagram("er", "erDiagram\n GUEST {\n int id PK\n string full_name\n }\n BOOKING {\n int id PK\n int guest_id FK\n }", solution);
        const noEntity = checkDiagram("er", "erDiagram\n GUEST { }", solution);
        const extra = checkDiagram("er", ER + '\n ROOM ||--o{ BOOKING : "для"', solution);

        expect(noRelation.issues.map(item => item.code)).toContain("missing-relation");
        expect(noEntity.issues.map(item => item.code)).toContain("missing-entity");
        expect(extra.issues.map(item => item.code)).toContain("extra-entity");
        expect(extra.issues.map(item => item.code)).toContain("extra-relation");
    });

    it("атрибуты: не хватает, неверный ключ, лишние только при exact", () => {
        const noAttr = ER.replace("string full_name", "");
        const wrongKey = ER.replace("int guest_id FK", "int guest_id");
        const extra = ER.replace("string full_name", "string full_name\n        string city");

        expect(checkDiagram("er", noAttr, solution).issues[0].code).toBe("missing-attribute");
        expect(checkDiagram("er", wrongKey, solution).issues[0].code).toBe("wrong-key");
        expect(checkDiagram("er", extra, solution).ok).toBe(true);
        expect(checkDiagram("er", extra, solution, { exact: true }).issues[0].code).toBe("extra-attribute");
    });

    it("типы сравниваются только по требованию урока", () => {
        const other = ER.replace("string full_name", "text full_name");

        expect(checkDiagram("er", other, solution).ok).toBe(true);
        expect(checkDiagram("er", other, solution, { types: true }).issues[0].code).toBe("wrong-type");
    });

    it("две связи между одной парой сущностей считаются отдельно", () => {
        const two = 'erDiagram\n A ||--o{ B : "p"\n A |o--o{ B : "q"';

        expect(checkDiagram("er", two, two).ok).toBe(true);
        expect(checkDiagram("er", 'erDiagram\n A ||--o{ B : "p"', two).issues.length).toBeGreaterThan(0);
    });

    it("пунктир и сплошная линия различаются только при identifying", () => {
        const dotted = 'erDiagram\n A ||..o{ B : "p"';
        const solid = 'erDiagram\n A ||--o{ B : "p"';

        expect(checkDiagram("er", dotted, solid).ok).toBe(true);
        expect(checkDiagram("er", dotted, solid, { identifying: true }).ok).toBe(false);
    });
});

const SEQ = `sequenceDiagram
    participant C as Клиент
    participant API
    participant DB as База
    C->>API: POST /bookings
    alt токен действителен
        API->>DB: INSERT
        DB-->>API: ok
        API-->>C: 204
    else токен просрочен
        API-->>C: 401
    end`;

describe("parseSequence", () => {
    it("участники, сообщения, блок с двумя ветками", () => {
        const result = parseSequence(SEQ);

        expect(result.ok).toBe(true);
        expect(result.model.participants.map(item => item.label)).toEqual(["Клиент", "API", "База"]);
        expect(result.model.events[0]).toMatchObject({ type: "message", from: "C", to: "API", kind: "sync" });

        const block = result.model.events[1];

        expect(block.kind).toBe("alt");
        expect(block.branches.map(branch => branch.events.length)).toEqual([3, 1]);
        expect(block.branches[1].label).toBe("токен просрочен");
    });

    it("вид стрелок", () => {
        const kinds = parseSequence("sequenceDiagram\n A->>B: 1\n A-->>B: 2\n A-)B: 3\n A-xB: 4\n A->B: 5").model.events.map(event => event.kind);

        expect(kinds).toEqual(["sync", "reply", "async", "lost", "line"]);
    });

    it("активации, заметки, loop и par", () => {
        const result = parseSequence(`sequenceDiagram
    A->>+B: запрос
    Note over A,B: пояснение
    loop раз в минуту
        A-)B: ping
    end
    par первая
        A->>B: x
    and вторая
        A->>B: y
    end
    B-->>-A: ответ
    activate A
    deactivate A`);

        const [first, note, loop, par] = result.model.events;

        expect(result.ok).toBe(true);
        expect(first.activate).toBe(true);
        expect(note).toMatchObject({ type: "note", targets: ["A", "B"] });
        expect(loop.kind).toBe("loop");
        expect(par.branches).toHaveLength(2);
        expect(result.model.events.at(-3).deactivate).toBe(true);
    });

    it("ошибки: нет end, лишний end, неверный else, нет текста, плохая стрелка", () => {
        expect(parseSequence("sequenceDiagram\n alt a\n A->>B: x").errors[0].code).toBe("unclosed-block");
        expect(parseSequence("sequenceDiagram\n end").errors[0].code).toBe("stray-end");
        expect(parseSequence("sequenceDiagram\n opt a\n else b\n end").errors[0].code).toBe("bad-branch");
        expect(parseSequence("sequenceDiagram\n A->>B").errors[0].code).toBe("message-text");
        expect(parseSequence("sequenceDiagram\n A=>B: x").errors[0].code).toBe("bad-arrow");
    });

    it("метка блока может содержать стрелку и русские слова", () => {
        const result = parseSequence("sequenceDiagram\n alt токен -> просрочен\n A->>B: x\n end");

        expect(result.ok).toBe(true);
        expect(result.model.events[0].kind).toBe("alt");
    });

    it("опечатка в первой строке", () => {
        expect(parseSequence("sequenceDiagrm\n A->>B: x").errors[0].code).toBe("header-typo");
    });
});

describe("сравнение sequence", () => {
    it("тот же сценарий с другими id, текстом и заметкой — верно", () => {
        const student = `sequenceDiagram
    participant Клиент
    participant API
    participant База
    Клиент->>API: создай бронь
    alt всё хорошо
        API->>База: записать
        База-->>API: готово
        API-->>Клиент: нет содержимого
    else не то
        Note right of API: ошибка
        API-->>Клиент: отказ
    end`;

        expect(checkDiagram("sequence", student, SEQ).ok).toBe(true);
    });

    it("ответ не в ту сторону: номер шага, без ответа", () => {
        const result = checkDiagram("sequence", SEQ.replace("DB-->>API: ok", "API-->>DB: ok"), SEQ);

        expect(result.ok).toBe(false);
        expect(result.issues[0].code).toBe("wrong-direction");
        expect(result.issues[0].message).toContain("Шаг 3");
    });

    it("не тот вид стрелки", () => {
        const result = checkDiagram("sequence", SEQ.replace("API->>DB: INSERT", "API-)DB: INSERT"), SEQ);

        expect(result.issues[0].code).toBe("wrong-arrow");
    });

    it("не хватает ветки блока, лишний шаг, не хватает участника", () => {
        const oneBranch = SEQ.replace("else токен просрочен\n        API-->>C: 401\n", "");

        expect(checkDiagram("sequence", oneBranch, SEQ).issues[0].code).toBe("wrong-branches");
        expect(checkDiagram("sequence", SEQ + "\n    C->>API: ещё", SEQ).issues[0].code).toBe("too-many");
        expect(checkDiagram("sequence", "sequenceDiagram\n C->>API: x", SEQ).issues[0].code).toBe("missing-participant");
    });

    it("вместо блока написаны сообщения: понятная причина", () => {
        const result = checkDiagram("sequence", "sequenceDiagram\n participant Клиент\n participant API\n participant База\n Клиент->>API: a\n API->>База: b", SEQ);

        expect(result.ok).toBe(false);
    });

    it("активации: «+/-» и activate/deactivate — одно и то же", () => {
        const short = "sequenceDiagram\n A->>+B: x\n B-->>-A: y";
        const long = "sequenceDiagram\n A->>B: x\n activate B\n B-->>A: y\n deactivate B";

        expect(checkDiagram("sequence", long, short, { activations: true }).ok).toBe(true);
        expect(checkDiagram("sequence", "sequenceDiagram\n A->>B: x\n B-->>A: y", short, { activations: true }).ok).toBe(false);
        expect(checkDiagram("sequence", "sequenceDiagram\n A->>B: x\n B-->>A: y", short).ok).toBe(true);
    });

    it("заметки и активации сравниваются только по требованию", () => {
        const withNote = SEQ.replace("C->>API: POST /bookings", "C->>API: POST /bookings\n    Note over C,API: тут");

        expect(checkDiagram("sequence", SEQ, withNote).ok).toBe(true);
        expect(checkDiagram("sequence", SEQ, withNote, { notes: true }).ok).toBe(false);
    });
});

describe("человеческие ошибки Mermaid", () => {
    it("номер строки достаётся из текста ошибки", () => {
        expect(lineFromError("Parse error on line 3:\n...")).toBe(3);
        expect(lineFromError("что-то")).toBeNull();
    });

    it("используется своя подсказка про то же место", () => {
        const text = "erDiagram\n A ||--o{ B";
        const parsed = parseDiagram("er", text);
        const result = humanizeDiagramError("Parse error on line 2:", { kind: "er", parsed, text });

        expect(result.text).toContain("подпись");
        expect(result.line).toBe(2);
    });

    it("неизвестный тип диаграммы", () => {
        const result = humanizeDiagramError("UnknownDiagramError: No diagram type detected", { kind: "sequence" });

        expect(result.text).toContain("sequenceDiagram");
    });

    it("опечатка в слове на проблемной строке", () => {
        const text = "sequenceDiagram\n particpant A";
        const result = humanizeDiagramError("Parse error on line 2:", { kind: "sequence", parsed: parseDiagram("sequence", "sequenceDiagram"), text });

        expect(result.text).toContain("participant");
    });

    it("общая подсказка, когда места нет", () => {
        const result = humanizeDiagramError("Syntax error", { kind: "er" });

        expect(result.title).toContain("Mermaid");
        expect(result.line).toBeNull();
    });
});
