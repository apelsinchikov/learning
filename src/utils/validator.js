export function validateLesson1(yaml) {
    const errors = [];

    if (!yaml.trim()) {
        errors.push("Редактор пустой");
        return errors;
    }

    if (!yaml.includes("openapi:")) {
        errors.push("Не найдено поле openapi");
    }

    if (!yaml.includes("info:")) {
        errors.push("Не найден раздел info");
    }

    if (!yaml.includes("title:")) {
        errors.push("Не найдено название API — title");
    }

    if (!yaml.includes("version:")) {
        errors.push("Не найдена версия API — version");
    }

    if (!yaml.includes("paths:")) {
        errors.push("Не найден раздел paths");
    }

    if (!yaml.includes("/hello:")) {
        errors.push("Не найден endpoint /hello");
    }

    if (!yaml.includes("get:")) {
        errors.push("Не найден GET метод");
    }

    return errors;
}