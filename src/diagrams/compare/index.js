import { parseEr } from "../parse/er.js";
import { parseSequence } from "../parse/sequence.js";
import { compareEr } from "./er.js";
import { compareSequence } from "./sequence.js";

export const PARSERS = { er: parseEr, sequence: parseSequence };

export function parseDiagram(kind, text) {
    return PARSERS[kind](text);
}

/*
 * Проверка ответа ученика: разбираем текст ученика и эталон и сравниваем.
 * options — настройки сравнения урока (exact, types, notes, activations...).
 */
export function checkDiagram(kind, studentText, solutionText, options = {}) {
    const actual = parseDiagram(kind, studentText);
    const expected = parseDiagram(kind, solutionText);

    return kind === "er" ? compareEr(actual, expected, options) : compareSequence(actual, expected, options);
}
