/*
 * Общие мелочи для разбора диаграмм: строки, комментарии, поиск опечаток.
 */

/* Строки текста с номерами (с 1), без пустых и комментариев `%%`. */
export function meaningfulLines(text = "") {
    const lines = String(text).replace(/\r\n?/g, "\n").split("\n");
    const result = [];
    let inFrontMatter = false;

    lines.forEach((raw, index) => {
        const trimmed = raw.trim();

        /* блок настроек между строками --- в начале текста */
        if (trimmed === "---" && (inFrontMatter || result.length === 0)) {
            inFrontMatter = !inFrontMatter;
            return;
        }

        if (inFrontMatter || trimmed === "" || trimmed.startsWith("%%")) {
            return;
        }

        result.push({ line: index + 1, text: trimmed });
    });

    return result;
}

export function distance(a, b) {
    const left = String(a).toLowerCase();
    const right = String(b).toLowerCase();
    const row = Array.from({ length: right.length + 1 }, (_, index) => index);

    for (let i = 1; i <= left.length; i++) {
        let previous = row[0];

        row[0] = i;

        for (let j = 1; j <= right.length; j++) {
            const keep = row[j];

            row[j] = Math.min(
                row[j] + 1,
                row[j - 1] + 1,
                previous + (left[i - 1] === right[j - 1] ? 0 : 1)
            );
            previous = keep;
        }
    }

    return row[right.length];
}

/* Самое похожее слово из списка или null, если ничего не похоже. */
export function closestWord(word, candidates, maxDistance = 2) {
    let best = null;
    let bestDistance = Infinity;

    for (const candidate of candidates) {
        const d = distance(word, candidate);

        if (d < bestDistance) {
            best = candidate;
            bestDistance = d;
        }
    }

    return bestDistance <= maxDistance && bestDistance < String(word).length ? best : null;
}

/* Ключевые слова, с которых начинается диаграмма. Нужны, чтобы заметить опечатку. */
export const DIAGRAM_KEYWORDS = [
    "erDiagram",
    "sequenceDiagram",
    "flowchart",
    "graph",
    "classDiagram",
    "stateDiagram",
    "gantt",
    "pie",
    "journey"
];

export function checkHeader(lines, expected) {
    const first = lines[0];

    if (!first) {
        return { code: "empty", line: 1, message: `Диаграмма пустая. Первая строка должна быть «${expected}».` };
    }

    const word = first.text.split(/\s+/)[0];

    if (word === expected) {
        return null;
    }

    const typo = closestWord(word, [expected]);

    if (typo) {
        return {
            code: "header-typo",
            line: first.line,
            message: `Строка ${first.line}: похоже на опечатку. Первая строка должна быть «${expected}».`
        };
    }

    return {
        code: "wrong-header",
        line: first.line,
        message: `Строка ${first.line}: здесь нужен тип диаграммы «${expected}», а написано «${word}».`
    };
}
