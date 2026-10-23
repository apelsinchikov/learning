/*
 * Сравнение sequence-диаграммы ученика с эталоном.
 *
 * Сравнивается структура: кто кому пишет и каким видом стрелки, в каком порядке,
 * какие блоки (alt, opt, loop, par...) и сколько в них веток. Текст сообщений,
 * алиасы и расположение не важны. Участник узнаётся по идентификатору или по
 * названию после «as»: «Клиент» и «C» — один и тот же участник.
 *
 * Сообщает только о первом расхождении: так подсказка остаётся короткой и не
 * превращается в готовый ответ.
 */

const lower = value => String(value).toLowerCase();

const ARROW_NAMES = {
    sync: "запрос",
    reply: "ответ",
    async: "асинхронное сообщение",
    "async-reply": "асинхронный ответ",
    lost: "потерянное сообщение",
    "lost-reply": "потерянный ответ",
    line: "линия без наконечника",
    "dotted-line": "пунктир без наконечника"
};

/* Сопоставляет участников эталона с участниками ученика. */
export function matchParticipants(actual, expected) {
    const mapping = new Map();
    const missing = [];
    const taken = new Set();

    for (const wanted of expected) {
        const names = [lower(wanted.id), lower(wanted.label)];
        const found = actual.find(
            candidate =>
                !taken.has(candidate.id) &&
                (names.includes(lower(candidate.id)) || names.includes(lower(candidate.label)))
        );

        if (found) {
            mapping.set(lower(found.id), wanted.id);
            taken.add(found.id);
        } else {
            missing.push(wanted);
        }
    }

    return { mapping, missing, extra: actual.filter(candidate => !taken.has(candidate.id)) };
}

/*
 * «+» и «-» в конце стрелки — короткая запись активации: «+» включает получателя,
 * «-» выключает отправителя. Превращаем её в такие же события, как activate и
 * deactivate, чтобы обе записи считались одним и тем же.
 */
function expandActivations(events) {
    return events.flatMap(event => {
        if (event.type === "block") {
            return [
                {
                    ...event,
                    branches: event.branches.map(branch => ({ ...branch, events: expandActivations(branch.events) }))
                }
            ];
        }

        if (event.type !== "message") {
            return [event];
        }

        const result = [{ ...event, activate: false, deactivate: false }];

        if (event.activate) {
            result.push({ type: "activation", on: true, target: event.to, line: event.line });
        }

        if (event.deactivate) {
            result.push({ type: "activation", on: false, target: event.from, line: event.line });
        }

        return result;
    });
}

function comparable(events, { notes, activations }) {
    return events.filter(
        event =>
            event.type === "message" ||
            event.type === "block" ||
            (notes && event.type === "note") ||
            (activations && event.type === "activation")
    );
}

function labelOf(participants, id) {
    const found = participants.find(item => lower(item.id) === lower(id));

    return found ? found.label : id;
}

export function compareSequence(actual, expected, options = {}) {
    const { notes = false, activations = false, participants: checkParticipants = true } = options;
    const a = actual.model;
    const e = expected.model;
    const { mapping, missing, extra } = matchParticipants(a.participants, e.participants);
    const mapId = id => mapping.get(lower(id)) ?? `?${id}`;
    const filter = { notes, activations };
    let step = 0;

    if (checkParticipants && missing.length) {
        return {
            ok: false,
            issues: [
                {
                    code: "missing-participant",
                    message: `Не хватает участников: ${missing.map(item => item.label).join(", ")}.`
                }
            ]
        };
    }

    if (checkParticipants && extra.length) {
        return {
            ok: false,
            issues: [
                {
                    code: "extra-participant",
                    message: `Лишние участники: ${extra.map(item => item.label).join(", ")}. Оставьте только тех, кто назван в условии.`
                }
            ]
        };
    }

    function compare(actualEvents, expectedEvents, where) {
        const mine = comparable(actualEvents, filter);
        const wanted = comparable(expectedEvents, filter);
        const common = Math.min(mine.length, wanted.length);

        for (let index = 0; index < common; index++) {
            const got = mine[index];
            const want = wanted[index];

            if (got.type !== want.type) {
                return {
                    code: "wrong-element",
                    message: `${where}: на этом месте стоит не то: ожидался ${want.type === "block" ? "блок" : want.type === "message" ? "обмен сообщениями" : "другой элемент"}.`
                };
            }

            if (got.type === "message") {
                step++;

                const from = mapId(got.from);
                const to = mapId(got.to);

                if (from !== want.from || to !== want.to) {
                    return {
                        code: "wrong-direction",
                        message: `Шаг ${step}: проверьте, кто кому отправляет сообщение. Сейчас: ${labelOf(a.participants, got.from)} → ${labelOf(a.participants, got.to)}.`
                    };
                }

                if (got.kind !== want.kind) {
                    return {
                        code: "wrong-arrow",
                        message: `Шаг ${step}: вид стрелки не тот. У вас ${ARROW_NAMES[got.kind] || got.kind}, а здесь нужен другой вид: запрос, ответ или асинхронное сообщение.`
                    };
                }

                continue;
            }

            if (got.type === "block") {
                if (got.kind !== want.kind) {
                    return {
                        code: "wrong-block",
                        message: `${where}: здесь нужен другой блок. У вас «${got.kind}».`
                    };
                }

                if (got.branches.length !== want.branches.length) {
                    return {
                        code: "wrong-branches",
                        message: `Блок «${got.kind}»: веток ${got.branches.length}, а нужно другое число. Проверьте, все ли случаи описаны.`
                    };
                }

                for (let b = 0; b < got.branches.length; b++) {
                    const inner = compare(
                        got.branches[b].events,
                        want.branches[b].events,
                        `Блок «${got.kind}», ветка ${b + 1}`
                    );

                    if (inner) {
                        return inner;
                    }
                }

                continue;
            }

            if (got.type === "note" && got.targets.map(mapId).join() !== want.targets.join()) {
                return { code: "wrong-note", message: `${where}: заметка стоит не у тех участников.` };
            }

            if (got.type === "activation" && (got.on !== want.on || mapId(got.target) !== want.target)) {
                return { code: "wrong-activation", message: `${where}: активация участника поставлена неверно.` };
            }
        }

        if (mine.length < wanted.length) {
            return {
                code: "too-few",
                message: `${where}: шагов не хватает. У вас ${mine.length}, а нужно больше.`
            };
        }

        if (mine.length > wanted.length) {
            return {
                code: "too-many",
                message: `${where}: лишние шаги. У вас ${mine.length}, а нужно меньше.`
            };
        }

        return null;
    }

    const issue = compare(
        activations ? expandActivations(a.events) : a.events,
        activations ? expandActivations(e.events) : e.events,
        "Диаграмма"
    );

    return issue ? { ok: false, issues: [issue] } : { ok: true, issues: [] };
}
