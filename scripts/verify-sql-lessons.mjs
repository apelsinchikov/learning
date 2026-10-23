/*
 * Проверка уроков курса SQL на настоящем Postgres.
 *
 * Запуск:  PSQL_CMD="psql -d hotel" node scripts/verify-sql-lessons.mjs
 *
 * Перед этим в базе hotel нужно выполнить сид (npm run sql:seed выводит его в stdout).
 * Скрипт запускает каждое решение и каждый пример, сравнивает число строк и колонок
 * с тем, что записано в уроке (expectRows, expectCols), и проверяет, что у «сломанных»
 * стартовых запросов результат отличается от решения.
 */

import { spawnSync } from "node:child_process";

import { sqlLessons } from "../src/sql/lessons/index.js";
import { buildSeedSql } from "../src/sql/hotel/seed.js";

const command = process.env.PSQL_CMD || "psql -d hotel";

if (process.argv.includes("--seed")) {
    process.stdout.write(buildSeedSql());
    process.exit(0);
}

function runSql(sql) {
    const input = `\\pset format csv\n${sql.replace(/;\s*$/, "")};\n`;
    const result = spawnSync(`${command} -q -v ON_ERROR_STOP=1`, {
        input,
        shell: true,
        encoding: "utf8"
    });

    if (result.status !== 0) {
        return { ok: false, error: (result.stderr || "").trim() };
    }

    const lines = result.stdout.split("\n").filter(Boolean);
    const header = lines[0] || "";

    return { ok: true, columns: header ? header.split(",").length : 0, rows: Math.max(lines.length - 1, 0) };
}

let failed = 0;
const fail = message => {
    failed++;
    console.log(`  ✗ ${message}`);
};

for (const lesson of sqlLessons) {
    console.log(lesson.id);

    const task = lesson.task;

    if (task.kind !== "choice") {
        const solved = runSql(task.solution);

        if (!solved.ok) {
            fail(`решение не выполняется: ${solved.error}`);
        } else {
            if (solved.rows !== task.expectRows) {
                fail(`строк ${solved.rows}, ожидалось ${task.expectRows}`);
            }

            if (solved.columns !== task.expectCols) {
                fail(`колонок ${solved.columns}, ожидалось ${task.expectCols}`);
            }
        }

        if (task.kind === "fix") {
            const broken = runSql(task.starter);

            if (broken.ok && broken.rows === task.expectRows) {
                fail("сломанный запрос не отличается от решения по числу строк");
            }
        }
    }

    for (const block of lesson.theory) {
        if (block.type === "example") {
            const result = runSql(block.sql);

            // Примеры «как делать нельзя» могут ничего не вернуть, но не должны падать.
            if (!result.ok) {
                fail(`пример не выполняется: ${block.sql.split("\n")[0]} → ${result.error}`);
            }
        }
    }
}

console.log(failed ? `\nОшибок: ${failed}` : "\nВсе уроки проверены");
process.exit(failed ? 1 : 0);
