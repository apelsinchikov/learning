import { renderRich } from "../sql/richText.js";

/*
 * Текст уроков SQL Advanced: обычная разметка курсов (абзацы, списки, `код`, **жирный**)
 * плюс две ссылки:
 *   [[table:bookings]]            — название таблицы: по клику раскрывается в панели «Схема»;
 *   [[sql:sql-inner-join|JOIN]]   — «Повторить»: открывает панель с уроком другого курса
 *                                   (sql, diagrams, openapi), не покидая текущий урок.
 * Текст сначала экранируется, и только потом превращается в кнопки.
 */
export function renderSqaRich(text = "") {
    return renderRich(text)
        .replace(
            /\[\[table:([a-z_]+)\]\]/g,
            (_, name) => `<button type="button" class="sqa-table-ref" data-table-ref="${name}">${name}</button>`
        )
        .replace(
            /\[\[(sql|diagrams|openapi):([\w-]+)\|([^\]]+)\]\]/g,
            (_, course, id, label) => `<button type="button" class="sqa-ref" data-peek="${course}:${id}">${label}</button>`
        );
}
