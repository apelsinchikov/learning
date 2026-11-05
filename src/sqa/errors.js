import { humanizeError } from "../sql/errors.js";

/*
 * Ошибки запуска для ученика. Ограничения таблиц (уникальность, CHECK, внешний
 * и NOT NULL) разбираются по коду и имени из ответа Postgres. Это главный
 * способ «увидеть» ключи в работе. Остальное объясняет общий разбор SQL-курса.
 *
 * humanizeRunError(result, schema) → { title, text }
 * schema — модель схемы (из schema.js): по ней подсказываем похожие названия.
 */
export function humanizeRunError(result, schema = null) {
    const name = result.constraint ? `«${result.constraint}»` : "";

    switch (result.code) {
        case "23505":
            return {
                title: "Нарушена уникальность",
                text: `Такое значение уже есть, а ограничение ${name} разрешает его только один раз. Так работают PRIMARY KEY и UNIQUE: дубль база не пропустит.`
            };

        case "23503":
            return {
                title: "Нет записи, на которую ссылаются",
                text: `Внешний ключ ${name} требует, чтобы значение уже было в родительской таблице (при вставке), и не позволяет удалить запись, на которую ещё ссылаются.`
            };

        case "23514":
            return {
                title: "Не прошла проверка CHECK",
                text: `Значение не подходит под условие ограничения ${name}. База проверила его и отказалась сохранять строку.`
            };

        case "23502":
            return {
                title: "Пустое значение там, где оно запрещено",
                text: "У колонки стоит NOT NULL, а значения нет. Задайте значение или уберите NOT NULL, если пусто быть может."
            };

        default: {
            const catalog = schema && schema.length ? schema : undefined;
            const message = humanizeError(result.error, catalog);

            return { title: message.title, text: message.text.replace("вкладку «База»", "вкладку «Схема»") };
        }
    }
}
