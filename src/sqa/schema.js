/*
 * Схема базы для панели «Схема»: какие таблицы есть сейчас, какие у них колонки,
 * ключи, связи и индексы. Читается из системного каталога Postgres, поэтому
 * показывает именно то состояние базы, в котором работает текущий урок
 * (таблицы из скрипта before и таблицы, созданные запросом ученика).
 */

export const SCHEMA_SQL = `
SELECT COALESCE(json_agg(t ORDER BY t.name), '[]'::json) AS schema FROM (
    SELECT
        c.relname AS name,
        c.relkind AS kind,
        (SELECT json_agg(json_build_object(
                    'name', a.attname,
                    'type', format_type(a.atttypid, a.atttypmod),
                    'nullable', NOT a.attnotnull,
                    'default', pg_get_expr(d.adbin, d.adrelid),
                    'identity', a.attidentity
                ) ORDER BY a.attnum)
           FROM pg_attribute a
           LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
          WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped) AS columns,
        (SELECT json_agg(json_build_object(
                    'type', con.contype,
                    'name', con.conname,
                    'cols', (SELECT json_agg(att.attname ORDER BY k.ord)
                               FROM unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord)
                               JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = k.attnum),
                    'ref_table', (SELECT r.relname FROM pg_class r WHERE r.oid = con.confrelid),
                    'ref_cols', (SELECT json_agg(att.attname ORDER BY k.ord)
                                   FROM unnest(con.confkey) WITH ORDINALITY AS k(attnum, ord)
                                   JOIN pg_attribute att ON att.attrelid = con.confrelid AND att.attnum = k.attnum),
                    'check', CASE WHEN con.contype = 'c' THEN pg_get_constraintdef(con.oid) END
                ))
           FROM pg_constraint con
          WHERE con.conrelid = c.oid) AS constraints,
        (SELECT json_agg(json_build_object('name', i.indexname, 'definition', i.indexdef))
           FROM pg_indexes i
          WHERE i.schemaname = n.nspname AND i.tablename = c.relname) AS indexes
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'v', 'm')
) t
`;

/* Запрос числа строк во всех перечисленных таблицах (имена берём из каталога). */
export function countRowsSql(names) {
    if (names.length === 0) {
        return "SELECT 'x' AS name, 0 AS rows WHERE false";
    }

    return names.map(name => `SELECT '${name}' AS name, count(*)::int AS rows FROM "${name}"`).join(" UNION ALL ");
}

const KIND_LABEL = { r: "table", v: "view", m: "matview" };

/*
 * Превращает ответ каталога в модель схемы:
 * [{ name, kind, columns: [{ name, type, nullable, keys: ["PK", "FK", "UK"], ref }], indexes, checks }]
 */
export function buildSchema(rawTables = []) {
    return rawTables.map(table => {
        const constraints = table.constraints || [];
        const columns = (table.columns || []).map(column => {
            const keys = [];
            let ref = null;

            for (const constraint of constraints) {
                const cols = constraint.cols || [];

                if (!cols.includes(column.name)) {
                    continue;
                }

                if (constraint.type === "p") {
                    keys.push("PK");
                } else if (constraint.type === "f") {
                    keys.push("FK");
                    ref = `${constraint.ref_table}.${(constraint.ref_cols || [])[cols.indexOf(column.name)]}`;
                } else if (constraint.type === "u") {
                    keys.push("UK");
                }
            }

            return {
                name: column.name,
                type: column.type,
                nullable: Boolean(column.nullable),
                default: column.default || null,
                identity: column.identity || "",
                keys,
                ref
            };
        });

        return {
            name: table.name,
            kind: KIND_LABEL[table.kind] || "table",
            columns,
            primaryKey: (constraints.find(item => item.type === "p")?.cols) || [],
            foreignKeys: constraints
                .filter(item => item.type === "f")
                .map(item => ({ cols: item.cols, refTable: item.ref_table, refCols: item.ref_cols, name: item.name })),
            uniques: constraints.filter(item => item.type === "u").map(item => ({ cols: item.cols, name: item.name })),
            checks: constraints.filter(item => item.type === "c").map(item => ({ name: item.name, definition: item.check })),
            /* Индексы, которые база создала сама под PRIMARY KEY и UNIQUE, не показываем: они есть у каждой таблицы. */
            indexes: (table.indexes || []).filter(index => !constraints.some(item => item.name === index.name)),
            rows: null
        };
    });
}

/* Мермейд принимает у типа только одно слово: numeric(10,2) → numeric, timestamp without time zone → timestamp. */
export function shortType(type) {
    const text = String(type || "text").toLowerCase();

    if (text.startsWith("timestamp")) {
        return "timestamp";
    }

    if (text.startsWith("character varying") || text.startsWith("varchar")) {
        return "varchar";
    }

    if (text === "integer") {
        return "int";
    }

    return text.replace(/\(.*\)/, "").trim().replace(/\s+/g, "_") || "text";
}

/* ER-диаграмма Mermaid из модели схемы. Показываем таблицы и представления целиком. */
export function schemaToEr(schema) {
    const lines = ["erDiagram"];

    for (const table of schema) {
        lines.push(`    ${table.name} {`);

        for (const column of table.columns) {
            const keys = column.keys.length ? ` ${column.keys.join(", ")}` : "";

            lines.push(`        ${shortType(column.type)} ${column.name}${keys}`);
        }

        lines.push("    }");
    }

    for (const table of schema) {
        for (const foreignKey of table.foreignKeys) {
            const optional = foreignKey.cols.some(name => table.columns.find(column => column.name === name)?.nullable);
            const unique = table.uniques.some(item => item.cols.length === foreignKey.cols.length && item.cols.every(name => foreignKey.cols.includes(name)));
            const child = unique ? "|o" : "o{";
            const parent = optional ? "o|" : "||";

            lines.push(`    ${foreignKey.refTable} ${parent}--${child} ${table.name} : "${foreignKey.cols.join(", ")}"`);
        }
    }

    return lines.join("\n");
}

/* Подсказка про ключ для значка в панели. */
export function keyTitle(column) {
    const parts = [];

    if (column.keys.includes("PK")) {
        parts.push("Первичный ключ");
    }

    if (column.keys.includes("FK")) {
        parts.push(`Внешний ключ → ${column.ref}`);
    }

    if (column.keys.includes("UK")) {
        parts.push("Уникальное значение");
    }

    return parts.join(", ");
}

/* Ответ движка с моделью схемы: проверки задач работают с run.model. */
export function attachModel(run) {
    return { ...run, model: buildSchema(run.schema || []) };
}
