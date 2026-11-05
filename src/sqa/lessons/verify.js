/*
 * Помощники для проверки задач на создание таблиц (kind: "script").
 * verify(run) получает ответ движка с моделью схемы (run.model) и результатами
 * пробных запросов (run.probes). Проверяем итоговую структуру и поведение, а не текст запроса.
 */

export const tableOf = (run, name) => (run.model || []).find(item => item.name === name) || null;

export const result = issues => ({ ok: issues.length === 0, issues });

export const same = (a = [], b = []) => a.length === b.length && [...a].sort().every((value, index) => value === [...b].sort()[index]);

/* Проверка одной колонки: spec = { name, type?: RegExp, nullable?: boolean, hasDefault?: boolean } */
export function columnIssues(table, spec) {
    const column = table.columns.find(item => item.name === spec.name);

    if (!column) {
        return [`В таблице ${table.name} нет колонки ${spec.name}.`];
    }

    const issues = [];

    if (spec.type && !spec.type.test(column.type)) {
        issues.push(`Колонка ${spec.name} имеет тип ${column.type}, а нужен другой.`);
    }

    if (spec.nullable === false && column.nullable) {
        issues.push(`Колонка ${spec.name} должна быть NOT NULL.`);
    }

    if (spec.nullable === true && !column.nullable) {
        issues.push(`Колонка ${spec.name} должна допускать пустое значение: уберите NOT NULL.`);
    }

    if (spec.hasDefault && !column.default && !column.identity) {
        issues.push(`У колонки ${spec.name} нет значения по умолчанию (DEFAULT).`);
    }

    return issues;
}

export const probeOk = (run, index) => Boolean(run.probes?.[index]?.ok);
export const probeCode = (run, index) => run.probes?.[index]?.code || null;
export const probeValue = (run, index) => run.probes?.[index]?.rows?.[0]?.[0];

/* Ожидание: пробная вставка проходит. */
export function expectInsertOk(run, index, text, issues) {
    if (!probeOk(run, index)) {
        issues.push(`Пробная вставка не прошла: ${text}. Ошибка: ${run.probes?.[index]?.error || "нет ответа"}`);
    }
}

/* Ожидание: пробная вставка отклонена ограничением с нужным кодом. */
export function expectInsertRejected(run, index, code, text, issues) {
    const probe = run.probes?.[index];

    if (probe?.ok) {
        issues.push(`База приняла то, что должна отклонить: ${text}.`);
    } else if (probe && probe.code !== code) {
        issues.push(`Вставка отклонена не тем ограничением: ${text}. Ожидали код ${code}, пришёл ${probe.code || "другой"}.`);
    }
}
