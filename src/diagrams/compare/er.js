import { cardinalityText } from "../parse/er.js";

/*
 * Сравнение ER-диаграммы ученика с эталоном.
 *
 * Правила:
 *  - регистр имён и порядок объявления не важны;
 *  - связь A ||--o{ B и B }o--|| A — одна и та же;
 *  - подпись связи не сравнивается;
 *  - лишние атрибуты — не ошибка, если не включён exact;
 *  - типы колонок сравниваются только при types: true.
 *
 * Подсказки не раскрывают ответ: говорят, где искать, а не что писать.
 */

const lower = name => String(name).toLowerCase();

function side(entity, card) {
    return `${lower(entity)}:${cardinalityText(card)}`;
}

/* Связь в каноническом виде: стороны упорядочены по имени сущности. */
export function canonicalRelation(relation, { identifying = false } = {}) {
    const first = { entity: relation.a, card: relation.aCard };
    const second = { entity: relation.b, card: relation.bCard };
    const [x, y] = lower(first.entity) <= lower(second.entity) ? [first, second] : [second, first];

    return {
        x,
        y,
        pair: `${lower(x.entity)}|${lower(y.entity)}`,
        key: `${side(x.entity, x.card)}|${side(y.entity, y.card)}${identifying ? (relation.identifying ? "|id" : "|non") : ""}`,
        display: `${x.entity} — ${y.entity}`
    };
}

function remove(list, value) {
    const index = list.indexOf(value);

    if (index !== -1) {
        list.splice(index, 1);
    }
}

export function compareEr(actual, expected, options = {}) {
    const { exact = false, types = false, identifying = false, named = true } = options;
    const issues = [];
    const a = actual.model;
    const e = expected.model;

    /* ---------- сущности ---------- */

    const missingEntities = Object.keys(e.entities).filter(key => !a.entities[key]);
    const extraEntities = Object.keys(a.entities).filter(key => !e.entities[key]);

    if (missingEntities.length) {
        issues.push({
            code: "missing-entity",
            message: named
                ? `Не хватает сущностей: ${missingEntities.map(key => e.entities[key].name).join(", ")}.`
                : `Не хватает сущностей: ${missingEntities.length}.`
        });
    }

    if (extraEntities.length) {
        issues.push({
            code: "extra-entity",
            message: `Лишние сущности: ${extraEntities.map(key => a.entities[key].name).join(", ")}. Оставьте только нужные из условия.`
        });
    }

    /* ---------- связи ---------- */

    const expectedRelations = e.relations.map(relation => canonicalRelation(relation, { identifying }));
    const actualRelations = a.relations.map(relation => canonicalRelation(relation, { identifying }));
    const remainingExpected = [...expectedRelations];
    const remainingActual = [];

    for (const relation of actualRelations) {
        const match = remainingExpected.find(item => item.key === relation.key);

        if (match) {
            remove(remainingExpected, match);
        } else {
            remainingActual.push(relation);
        }
    }

    for (const relation of [...remainingActual]) {
        const sibling = remainingExpected.find(item => item.pair === relation.pair);

        if (sibling) {
            remove(remainingExpected, sibling);
            remove(remainingActual, relation);

            const wrongSides = [];

            if (sibling.x.card.min !== relation.x.card.min || sibling.x.card.max !== relation.x.card.max) {
                wrongSides.push(relation.x.entity);
            }

            if (sibling.y.card.min !== relation.y.card.min || sibling.y.card.max !== relation.y.card.max) {
                wrongSides.push(relation.y.entity);
            }

            issues.push({
                code: "wrong-cardinality",
                message: wrongSides.length
                    ? `Связь ${relation.display} есть, но кратность не та: проверьте значок со стороны ${wrongSides.join(" и ")}.`
                    : `Связь ${relation.display} есть, но проверьте, сплошная у неё линия или пунктир.`
            });
        }
    }

    for (const relation of remainingExpected) {
        const known = lower(relation.x.entity) in e.entities && !missingEntities.includes(lower(relation.x.entity)) && !missingEntities.includes(lower(relation.y.entity));

        if (known || !named) {
            issues.push({
                code: "missing-relation",
                message: named ? `Не хватает связи: ${relation.display}.` : "Не хватает одной связи."
            });
        }
    }

    for (const relation of remainingActual) {
        issues.push({ code: "extra-relation", message: `Лишняя связь: ${relation.display}.` });
    }

    /* ---------- атрибуты ---------- */

    for (const [key, entity] of Object.entries(e.entities)) {
        const mine = a.entities[key];

        if (!mine || entity.attrs.length === 0) {
            continue;
        }

        const myAttrs = new Map(mine.attrs.map(attr => [lower(attr.name), attr]));
        const missing = [];
        const keyProblems = [];
        const typeProblems = [];

        for (const attr of entity.attrs) {
            const found = myAttrs.get(lower(attr.name));

            if (!found) {
                missing.push(attr.name);
                continue;
            }

            if (attr.keys.slice().sort().join() !== found.keys.slice().sort().join()) {
                keyProblems.push(attr.name);
            }

            if (types && lower(attr.type) !== lower(found.type)) {
                typeProblems.push(attr.name);
            }
        }

        if (missing.length) {
            issues.push({
                code: "missing-attribute",
                message: `В «${entity.name}» не хватает атрибутов: ${missing.join(", ")}.`
            });
        }

        if (keyProblems.length) {
            issues.push({
                code: "wrong-key",
                message: `В «${entity.name}» проверьте ключи (PK, FK, UK) у: ${keyProblems.join(", ")}.`
            });
        }

        if (typeProblems.length) {
            issues.push({
                code: "wrong-type",
                message: `В «${entity.name}» проверьте типы у: ${typeProblems.join(", ")}.`
            });
        }

        if (exact) {
            const wanted = new Set(entity.attrs.map(attr => lower(attr.name)));
            const extra = mine.attrs.filter(attr => !wanted.has(lower(attr.name))).map(attr => attr.name);

            if (extra.length) {
                issues.push({
                    code: "extra-attribute",
                    message: `В «${entity.name}» лишние атрибуты: ${extra.join(", ")}.`
                });
            }
        }
    }

    return { ok: issues.length === 0, issues };
}
