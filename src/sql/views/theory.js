import { escapeHtml } from "../../utils/textFormat.js";
import { renderRich } from "../richText.js";
import { highlightSqlHtml } from "../highlight.js";
import { renderJoinVisual } from "../joinVisual.js";
import { renderResultTable } from "./resultTable.js";
import { guests, keyLog, peekTable, rooms } from "../hotel/peek.js";

export function renderStory(lesson) {
    return `
        <section class="sql-story" aria-label="Сюжет">
            <div class="sql-story__label">Из дела</div>
            ${renderRich(lesson.story)}
        </section>
    `;
}

/* Запись журнала, на которой тренируемся в уроке про ключи. */
const SAMPLE_LOG = keyLog.find(
    row => row.room_id === 13 && row.guest_id === 7 && row.opened_at.startsWith("2026-02-15 00:48")
);

function renderFkExplorer() {
    const guestRows = guests
        .map(
            guest => `
            <tr data-row-table="guests" data-row-id="${guest.id}">
                <td>${guest.id}</td><td>${escapeHtml(guest.full_name)}</td>
            </tr>`
        )
        .join("");

    const roomRows = rooms
        .map(
            room => `
            <tr data-row-table="rooms" data-row-id="${room.room_id}">
                <td>${room.room_id}</td><td>${escapeHtml(room.title)}</td><td>${escapeHtml(room.kind)}</td>
            </tr>`
        )
        .join("");

    return `
        <div class="fk-explorer" data-fk-explorer>
            <div class="fk-explorer__log">
                <div class="fk-explorer__title">key_log: запись №${SAMPLE_LOG.id}</div>
                <div class="fk-explorer__fields">
                    <span>room_id = <button type="button" class="fk-link" data-fk-table="rooms" data-fk-key="${SAMPLE_LOG.room_id}">${SAMPLE_LOG.room_id}</button></span>
                    <span>guest_id = <button type="button" class="fk-link" data-fk-table="guests" data-fk-key="${SAMPLE_LOG.guest_id}">${SAMPLE_LOG.guest_id}</button></span>
                    <span>opened_at = ${escapeHtml(SAMPLE_LOG.opened_at.slice(11, 16))}</span>
                </div>
            </div>

            <div class="fk-explorer__tables">
                <div class="fk-explorer__table" data-fk-scroll="guests">
                    <div class="fk-explorer__title">guests</div>
                    <table class="sql-table"><thead><tr><th>id</th><th>full_name</th></tr></thead><tbody>${guestRows}</tbody></table>
                </div>
                <div class="fk-explorer__table" data-fk-scroll="rooms">
                    <div class="fk-explorer__title">rooms</div>
                    <table class="sql-table"><thead><tr><th>room_id</th><th>title</th><th>kind</th></tr></thead><tbody>${roomRows}</tbody></table>
                </div>
            </div>

            <p class="fk-explorer__answer" data-fk-answer aria-live="polite">Нажмите на число, чтобы найти запись в другой таблице.</p>
        </div>
    `;
}

const ORDER_STEPS = [
    ["FROM", "Берём таблицу. Если есть JOIN, соединяем таблицы.", "Таблица собрана. Названий колонок из SELECT пока нет."],
    ["WHERE", "Отбрасываем лишние строки.", "Групп и подсчётов ещё нет, поэтому COUNT здесь использовать нельзя."],
    ["GROUP BY", "Собираем оставшиеся строки в группы.", "Теперь можно считать итоги по группам."],
    ["HAVING", "Отбрасываем лишние группы.", "Здесь уже можно писать COUNT(*) > 3. А псевдонимов пока нет."],
    ["SELECT", "Выбираем колонки, считаем выражения, даём псевдонимы.", "Только теперь появляются имена после AS."],
    ["ORDER BY", "Сортируем результат.", "Псевдонимы уже известны, поэтому здесь их можно использовать."],
    ["LIMIT", "Берём нужное число строк.", "Всё. Ответ готов."]
];

function renderOrderSteps() {
    return `
        <div class="order-steps" data-order-steps>
            <ol>
                ${ORDER_STEPS.map(
                    ([name, what, note], index) => `
                    <li data-step="${index}">
                        <span class="order-steps__name">${name}</span>
                        <span class="order-steps__what">${escapeHtml(what)}</span>
                        <span class="order-steps__note">${escapeHtml(note)}</span>
                    </li>`
                ).join("")}
            </ol>
            <div class="order-steps__controls">
                <button type="button" class="sql-button sql-button--ghost" data-order-next>Показать по шагам</button>
                <span class="order-steps__hint">Пишем в одном порядке, база выполняет в другом.</span>
            </div>
        </div>
    `;
}

function renderExample(block, index) {
    return `
        <div class="sql-example" data-example="${index}">
            <pre class="sql-code" data-sql-source><code>${highlightSqlHtml(block.sql)}</code></pre>
            ${block.note ? `<p class="sql-example__note">${escapeHtml(block.note)}</p>` : ""}
            <div class="sql-example__actions">
                <button type="button" class="sql-button sql-button--small" data-example-run>Выполнить</button>
                <button type="button" class="sql-button sql-button--ghost sql-button--small" data-example-sandbox>Открыть в песочнице</button>
            </div>
            <div class="sql-example__result" data-example-result hidden></div>
        </div>
    `;
}

function renderBlock(block, index) {
    switch (block.type) {
        case "text":
            return `<div class="sql-text">${renderRich(block.text)}</div>`;

        case "why":
            return `
                <aside class="sql-why">
                    <div class="sql-why__title">${escapeHtml(block.title ? `Зачем: ${block.title}` : "Зачем это нужно")}</div>
                    ${renderRich(block.text)}
                </aside>`;

        case "trap":
            return `
                <aside class="sql-trap">
                    <div class="sql-trap__title">Ловушка</div>
                    ${renderRich(block.text)}
                </aside>`;

        case "example":
            return renderExample(block, index);

        case "table-peek": {
            const peek = peekTable(block.table, block.limit || 5);

            return `
                <div class="sql-peek">
                    <div class="sql-peek__title">Таблица ${escapeHtml(block.table)}, первые строки</div>
                    ${peek ? renderResultTable(peek, { caption: false }) : ""}
                </div>`;
        }

        case "fk-explorer":
            return renderFkExplorer();

        case "join-visual":
            return renderJoinVisual(block.kind);

        case "order-steps":
            return renderOrderSteps();

        default:
            return "";
    }
}

export function renderTheory(lesson) {
    return `
        <section class="sql-theory" aria-label="Теория">
            ${lesson.theory.map(renderBlock).join("")}
        </section>
    `;
}

export const ORDER_STEP_COUNT = ORDER_STEPS.length;
