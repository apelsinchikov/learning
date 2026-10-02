import { DatabaseDiagram } from "./DatabaseDiagram.js";
import { format } from "sql-formatter";

export function Theory(lesson) {
    const theory = lesson.theory;

    if (!theory) {
        return "";
    }

    const isPractice = lesson.type === "practice";

    function escapeHtml(text = "") {
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function renderInline(text = "") {
        let result = escapeHtml(text);

        result = result.replace(
            /`([^`]+)`/g,
            '<code class="inline-code">$1</code>'
        );

        result = result.replace(
            /\*\*([^*]+)\*\*/g,
            "<strong>$1</strong>"
        );

        return result;
    }

    function highlightCode(text, language = "yaml") {
        const escaped = escapeHtml(text || "");

        if (language === "json") {
            return escaped
                .replace(
                    /(&quot;[^&]*?&quot;)(\s*:)/g,
                    '<span class="code-key">$1</span>$2'
                )
                .replace(
                    /(:\s*)(&quot;[^&]*?&quot;)/g,
                    '$1<span class="code-string">$2</span>'
                )
                .replace(
                    /\b(true|false|null)\b/g,
                    '<span class="code-value">$1</span>'
                )
                .replace(
                    /\b(\d+(?:\.\d+)?)\b/g,
                    '<span class="code-number">$1</span>'
                );
        }

        if (language === "sql") {
            let result = escaped;

            result = result.replace(
                /\b(SELECT|FROM|LEFT JOIN|RIGHT JOIN|INNER JOIN|FULL JOIN|JOIN|ON|WHERE|AND|OR|GROUP BY|ORDER BY|INSERT INTO|VALUES|UPDATE|SET|DELETE FROM)\b/gi,
                '<span class="code-sql-keyword">$1</span>'
            );

            result = result.replace(
                /('(?:''|[^'])*')/g,
                '<span class="code-string">$1</span>'
            );

            result = result.replace(
                /\b(\d+)\b/g,
                '<span class="code-number">$1</span>'
            );

            return result;
        }

        return escaped
            .split("\n")
            .map(line => {
                const match = line.match(
                    /^(\s*)([^:#\n]+)(:)(.*)$/
                );

                if (!match) {
                    return line;
                }

                const indentation = match[1];
                const key = match[2];
                const colon = match[3];
                const value = match[4];

                let styledValue = value;

                if (value.trim().startsWith("#")) {
                    styledValue =
                        `<span class="code-comment">${value}</span>`;
                } else if (value.trim() !== "") {
                    styledValue =
                        `<span class="code-string">${value}</span>`;
                }

                return `${indentation}<span class="code-key">${key}</span>${colon}${styledValue}`;
            })
            .join("\n");
    }

    function renderText(text) {
        if (!text) {
            return "";
        }

        return String(text)
            .trim()
            .split(/\n\s*\n/)
            .map(block => {
                const lines = block
                    .split("\n")
                    .map(line => line.trim())
                    .filter(Boolean);

                if (lines.length === 0) {
                    return "";
                }

                const isList = lines.every(
                    line =>
                        line.startsWith("- ") ||
                        line.startsWith("• ")
                );

                if (isList) {
                    return `
                        <ul class="theory-list">
                            ${lines
                                .map(line => `
                                    <li>
                                        ${renderInline(
                                            line.replace(/^[-•]\s+/, "")
                                        )}
                                    </li>
                                `)
                                .join("")}
                        </ul>
                    `;
                }

                return `
                    <p class="theory-paragraph">
                        ${renderInline(lines.join(" "))}
                    </p>
                `;
            })
            .join("");
    }

    function renderDefinition(section) {
        return `
            <div class="theory-definition">

                <div class="theory-definition__term">
                    ${renderInline(section.term)}
                </div>

                <div class="theory-definition__body">
                    ${renderText(section.text)}
                </div>

            </div>
        `;
    }

    function renderHighlight(section) {
        return `
            <div class="theory-highlight">

                <div class="theory-highlight__icon">
                    ${escapeHtml(section.icon || "💡")}
                </div>

                <div class="theory-highlight__content">

                    ${
                        section.title
                            ? `
                                <div class="theory-highlight__title">
                                    ${escapeHtml(section.title)}
                                </div>
                            `
                            : ""
                    }

                    ${renderText(section.text)}

                </div>

            </div>
        `;
    }

    function renderWarning(section) {
        return `
            <div class="theory-warning">

                <div class="theory-warning__icon">
                    ⚠️
                </div>

                <div class="theory-warning__content">

                    <div class="theory-warning__title">
                        ${escapeHtml(section.title || "Важно")}
                    </div>

                    ${renderText(section.text)}

                </div>

            </div>
        `;
    }

    function renderCode(section) {
        let code = section.code || "";

        if (section.language === "sql") {
            try {
                code = format(code, {
                    language: "sql",
                    tabWidth: 2,
                    keywordCase: "upper",
                    linesBetweenQueries: 1
                });
            } catch {
                // Если SQL не удалось отформатировать,
                // показываем исходный текст.
            }
        }

        return `
            <div class="theory-code">

                <div class="theory-code__header">

                    <span>
                        ${escapeHtml(section.title || "Пример")}
                    </span>

                    ${
                        section.language
                            ? `
                                <span class="theory-code__language">
                                    ${escapeHtml(section.language)}
                                </span>
                            `
                            : ""
                    }

                </div>

                <pre><code>${highlightCode(
                    code,
                    section.language
                )}</code></pre>

            </div>
        `;
    }

    function renderCodeExplanation(section) {
        return `
            <div class="theory-code-explanation">

                ${
                    section.title
                        ? `
                            <div class="theory-code-explanation__title">
                                ${escapeHtml(section.title)}
                            </div>
                        `
                        : ""
                }

                <div class="theory-code-explanation__items">

                    ${section.items
                        .map((item, index) => `
                            <div class="theory-code-explanation__item">

                                <div class="theory-code-explanation__number">
                                    ${index + 1}
                                </div>

                                <div class="theory-code-explanation__body">

                                    <div class="theory-code-explanation__code">
                                        <code>
                                            ${renderInline(item.code)}
                                        </code>
                                    </div>

                                    <div class="theory-code-explanation__text">
                                        ${renderInline(item.text)}
                                    </div>

                                </div>

                            </div>
                        `)
                        .join("")}

                </div>

            </div>
        `;
    }

    function renderList(section) {
        return `
            <div class="theory-list-block">

                ${
                    section.title
                        ? `
                            <div class="theory-list-block__title">
                                ${escapeHtml(section.title)}
                            </div>
                        `
                        : ""
                }

                <ul class="theory-list theory-list--block">

                    ${section.items
                        .map(item => `
                            <li>
                                ${renderInline(item)}
                            </li>
                        `)
                        .join("")}

                </ul>

            </div>
        `;
    }

    function renderTable(section) {
        return `
            <div class="theory-table-card">

                ${
                    section.title
                        ? `
                            <div class="theory-table-card__header">
                                ${escapeHtml(section.title)}
                            </div>
                        `
                        : ""
                }

                <div class="theory-table-card__scroll">

                    <table class="theory-table">

                        <thead>
                            <tr>
                                ${section.columns
                                    .map(column => `
                                        <th>
                                            ${escapeHtml(column)}
                                        </th>
                                    `)
                                    .join("")}
                            </tr>
                        </thead>

                        <tbody>
                            ${section.rows
                                .map(row => `
                                    <tr>
                                        ${row
                                            .map((cell, index) => `
                                                <td>
                                                    ${
                                                        index === 0
                                                            ? `<strong>${renderInline(cell)}</strong>`
                                                            : renderInline(cell)
                                                    }
                                                </td>
                                            `)
                                            .join("")}
                                    </tr>
                                `)
                                .join("")}
                        </tbody>

                    </table>

                </div>

            </div>
        `;
    }

    function renderSteps(section) {
        return `
            <div class="theory-steps">

                ${
                    section.title
                        ? `
                            <div class="theory-steps__title">
                                ${escapeHtml(section.title)}
                            </div>
                        `
                        : ""
                }

                <div class="theory-steps__list">

                    ${section.items
                        .map((item, index) => `
                            <div class="theory-step">

                                <div class="theory-step__number">
                                    ${index + 1}
                                </div>

                                <div class="theory-step__content">

                                    <div class="theory-step__title">
                                        ${escapeHtml(item.title)}
                                    </div>

                                    ${renderText(item.text)}

                                    ${
                                        item.code
                                            ? `
                                                <div class="theory-step__code">
                                                    ${renderInline(item.code)}
                                                </div>
                                            `
                                            : ""
                                    }

                                </div>

                            </div>
                        `)
                        .join("")}

                </div>

            </div>
        `;
    }

    function renderEndpoint(section) {
        return `
            <div class="theory-endpoint">

                <div class="theory-endpoint__route">

                    <span class="
                        http-method
                        http-method--${String(section.method).toLowerCase()}
                    ">
                        ${escapeHtml(section.method)}
                    </span>

                    <code>
                        ${escapeHtml(section.path)}
                    </code>

                </div>

                ${
                    section.description
                        ? `
                            <div class="theory-endpoint__description">
                                ${renderInline(section.description)}
                            </div>
                        `
                        : ""
                }

                ${
                    section.parts
                        ? `
                            <div class="theory-endpoint__parts">

                                ${section.parts
                                    .map(part => `
                                        <div class="theory-endpoint__part">

                                            <code>
                                                ${escapeHtml(part.name)}
                                            </code>

                                            <span>
                                                ${renderInline(part.text)}
                                            </span>

                                        </div>
                                    `)
                                    .join("")}

                            </div>
                        `
                        : ""
                }

            </div>
        `;
    }

    function renderTaskCode(section) {
        return `
            <div class="practice-code">

                <div class="practice-code__header">
                    <span>
                        ${escapeHtml(section.language || "code")}
                    </span>

                    <span class="practice-code__copy-label">
                        пример
                    </span>
                </div>

                <pre><code>${highlightCode(
                    section.code,
                    section.language
                )}</code></pre>

            </div>
        `;
    }

    function renderSchemaTable(section) {
        return `
            <div class="schema-card">

                <div class="schema-card__header">

                    <div>

                        <span class="schema-card__label">
                            SCHEMA
                        </span>

                        <h4>
                            ${escapeHtml(section.schemaName)}
                        </h4>

                    </div>

                    <span class="schema-card__type">
                        object
                    </span>

                </div>

                ${
                    section.text
                        ? `
                            <div class="schema-card__description">
                                ${renderText(section.text)}
                            </div>
                        `
                        : ""
                }

                <table class="schema-table">

                    <thead>
                        <tr>
                            <th>Property</th>
                            <th>Type</th>
                            <th>Required</th>
                        </tr>
                    </thead>

                    <tbody>

                        ${section.properties
                            .map(property => `
                                <tr>

                                    <td>
                                        <code>
                                            ${escapeHtml(property[0])}
                                        </code>
                                    </td>

                                    <td>
                                        <code>
                                            ${escapeHtml(property[1])}
                                        </code>
                                    </td>

                                    <td>
                                        ${
                                            property[2]
                                                ? `<span class="required-badge">✓</span>`
                                                : ""
                                        }
                                    </td>

                                </tr>
                            `)
                            .join("")}

                    </tbody>

                </table>

                ${
                    section.ref
                        ? `
                            <div class="schema-card__ref">
                                <span>
                                    Используй <code>$ref</code>:
                                </span>

                                <code>
                                    ${escapeHtml(section.ref)}
                                </code>
                            </div>
                        `
                        : ""
                }

            </div>
        `;
    }

    function renderResponses(section) {
        return `
            <div class="responses-list">

                ${section.responses
                    .map(response => `
                        <div class="response-card">

                            <div class="response-card__header">

                                <span class="
                                    response-status
                                    response-status--${
                                        response.status === "200"
                                            ? "success"
                                            : "error"
                                    }
                                ">
                                    ${escapeHtml(response.status)}
                                </span>

                                <strong>
                                    ${escapeHtml(response.description)}
                                </strong>

                            </div>

                            ${
                                response.text
                                    ? `
                                        <div class="response-card__text">
                                            ${renderText(response.text)}
                                        </div>
                                    `
                                    : ""
                            }

                            ${
                                response.code
                                    ? `
                                        <div class="practice-code practice-code--compact">

                                            <div class="practice-code__header">
                                                yaml
                                            </div>

                                            <pre><code>${highlightCode(
                                                response.code,
                                                "yaml"
                                            )}</code></pre>

                                        </div>
                                    `
                                    : ""
                            }

                        </div>
                    `)
                    .join("")}

            </div>
        `;
    }

    function renderTaskWarning(section) {
        return `
            <div class="task-warning">

                <div class="task-warning__header">

                    <span class="task-warning__icon">
                        ⚠️
                    </span>

                    <strong>
                        ${escapeHtml(section.titleText)}
                    </strong>

                </div>

                <div class="task-warning__body">

                    ${renderText(section.text)}

                    ${
                        section.groups
                            ? `
                                <div class="forbidden-groups">

                                    ${section.groups
                                        .map(group => `
                                            <div class="forbidden-group">

                                                <div class="forbidden-group__name">
                                                    ${escapeHtml(group.name)}
                                                </div>

                                                <div class="forbidden-group__fields">
                                                    ${group.fields
                                                        .map(field => `
                                                            <code>
                                                                ${escapeHtml(field)}
                                                            </code>
                                                        `)
                                                        .join("")}
                                                </div>

                                            </div>
                                        `)
                                        .join("")}

                                </div>
                            `
                            : ""
                    }

                    ${
                        section.comparison
                            ? `
                                <table class="comparison-table">

                                    <thead>
                                        <tr>
                                            <th>Поле</th>
                                            <th>Значение</th>
                                        </tr>
                                    </thead>

                                    <tbody>

                                        ${section.comparison
                                            .map(row => `
                                                <tr>
                                                    <td>
                                                        <code>
                                                            ${escapeHtml(row[0])}
                                                        </code>
                                                    </td>

                                                    <td>
                                                        <code>
                                                            ${escapeHtml(row[1])}
                                                        </code>
                                                    </td>
                                                </tr>
                                            `)
                                            .join("")}

                                    </tbody>

                                </table>
                            `
                            : ""
                    }

                    ${
                        section.conclusion
                            ? `
                                <div class="task-conclusion">
                                    ${renderText(section.conclusion)}
                                </div>
                            `
                            : ""
                    }

                </div>

            </div>
        `;
    }

    function renderChecklist(section) {
        return `
            <div class="task-checklist">

                ${section.items
                    .map(item => `
                        <div class="task-checklist__item">
                            <span>✓</span>
                            <span>${renderInline(item)}</span>
                        </div>
                    `)
                    .join("")}

            </div>
        `;
    }

    function renderGoal(section) {
        return `
            <div class="task-goal">

                <div class="task-goal__header">
                    <span>🎯</span>
                    <strong>Главная цель</strong>
                </div>

                <div class="task-goal__body">
                    ${renderText(section.text)}
                </div>

            </div>
        `;
    }

    function renderTask(task) {
        if (!task) {
            return "";
        }

        if (typeof task === "string") {
            return renderText(task);
        }

        return `
            <div class="practice-task">

                <div class="practice-task__header">

                    <span class="practice-task__icon">
                        🛠️
                    </span>

                    <div>

                        <div class="practice-task__label">
                            ПРАКТИЧЕСКОЕ ЗАДАНИЕ
                        </div>

                        <h3>
                            Твоя задача
                        </h3>

                    </div>

                </div>

                <div class="practice-task__body">

                    ${
                        task.intro
                            ? `
                                <div class="practice-task__intro">
                                    ${renderText(task.intro)}
                                </div>
                            `
                            : ""
                    }

                    ${
                        task.sections
                            ? task.sections
                                .map(section => `
                                    <section class="task-section">

                                        <h4>
                                            ${escapeHtml(section.title)}
                                        </h4>

                                        ${
                                            section.type === "code"
                                                ? renderTaskCode(section)
                                                : ""
                                        }

                                        ${
                                            section.type === "endpoint"
                                                ? renderEndpoint(section)
                                                : ""
                                        }

                                        ${
                                            section.type === "responses"
                                                ? renderResponses(section)
                                                : ""
                                        }

                                        ${
                                            section.type === "schema-table"
                                                ? renderSchemaTable(section)
                                                : ""
                                        }

                                        ${
                                            section.type === "warning"
                                                ? renderTaskWarning(section)
                                                : ""
                                        }

                                        ${
                                            section.type === "checklist"
                                                ? renderChecklist(section)
                                                : ""
                                        }

                                        ${
                                            section.type === "goal"
                                                ? renderGoal(section)
                                                : ""
                                        }

                                    </section>
                                `)
                                .join("")
                            : ""
                    }

                </div>

            </div>
        `;
    }

    function renderTheorySection(section) {
        if (section.type === "definition") {
            return renderDefinition(section);
        }

        if (section.type === "highlight") {
            return renderHighlight(section);
        }

        if (section.type === "warning") {
            return renderWarning(section);
        }

        if (section.type === "code") {
            return renderCode(section);
        }

        if (section.type === "code-explanation") {
            return renderCodeExplanation(section);
        }

        if (section.type === "list") {
            return renderList(section);
        }

        if (section.type === "table") {
            return renderTable(section);
        }

        if (section.type === "steps") {
            return renderSteps(section);
        }

        if (section.type === "endpoint") {
            return renderEndpoint(section);
        }

        if (section.type === "database-diagram") {
            return DatabaseDiagram();
        }

        if (section.type === "text") {
            return `
                <div class="theory-content">
                    ${renderText(section.text)}
                </div>
            `;
        }

        /*
         * Старый формат уроков.
         * Нужен, чтобы остальные уроки продолжали работать,
         * пока мы постепенно переводим их на новую структуру.
         */
        return `
            <div class="theory-section">

                <h3>
                    ${escapeHtml(section.title)}
                </h3>

                ${renderText(section.text)}

            </div>
        `;
    }

    const hasDatabaseDiagramSection =
        theory.sections?.some(
            section => section.type === "database-diagram"
        );

    return `
        <section class="panel theory-panel">

            <div class="panel-header">

                <div>

                    <span class="panel-header__label">
                        ${escapeHtml(lesson.icon || "")}
                        ${isPractice ? "ПЕРЕД ПРАКТИКОЙ" : "ТЕОРИЯ"}
                    </span>

                    <h2>
                        ${escapeHtml(
                            theory.title || lesson.title
                        )}
                    </h2>

                </div>

            </div>

            <div class="panel-body">

                ${
                    theory.intro
                        ? `
                            <div class="theory-intro">
                                ${renderText(theory.intro)}
                            </div>
                        `
                        : ""
                }

                ${
                    theory.sections
                        ? theory.sections
                            .map(renderTheorySection)
                            .join("")
                        : ""
                }

                ${
                    lesson.id === "theory-9" &&
                    !hasDatabaseDiagramSection
                        ? DatabaseDiagram()
                        : ""
                }

                ${
                    theory.idea
                        ? `
                            <div class="info-card">

                                <div class="info-card__title">
                                    💡 Главная идея
                                </div>

                                ${renderText(theory.idea)}

                            </div>
                        `
                        : ""
                }

                ${
                    theory.swagger
                        ? `
                            <div class="theory-section">

                                <h3>
                                    Как это работает
                                </h3>

                                ${renderCode({
                                    title: "Схема",
                                    language: "text",
                                    code: theory.swagger
                                })}

                            </div>
                        `
                        : ""
                }

                ${
                    theory.structure
                        ? `
                            <div class="theory-section">

                                <h3>
                                    Структура
                                </h3>

                                ${renderCode({
                                    title: "Структура",
                                    language: "text",
                                    code: theory.structure
                                })}

                            </div>
                        `
                        : ""
                }

                ${
                    theory.yaml
                        ? `
                            <div class="theory-section">

                                <h3>
                                    Пример YAML
                                </h3>

                                ${renderCode({
                                    title: "OpenAPI-спецификация",
                                    language: "yaml",
                                    code: theory.yaml
                                })}

                            </div>
                        `
                        : ""
                }

                ${
                    theory.explanation
                        ? `
                            <div class="theory-section">

                                <h3>
                                    Разбираем структуру
                                </h3>

                                ${renderText(theory.explanation)}

                            </div>
                        `
                        : ""
                }

                ${
                    theory.task
                        ? renderTask(theory.task)
                        : ""
                }

                ${
                    lesson.nextLesson
                        ? `
                            <div class="info-card">

                                <div class="info-card__title">
                                    ➜ Что дальше
                                </div>

                                ${renderText(lesson.nextLesson.text)}

                            </div>
                        `
                        : ""
                }

            </div>

        </section>
    `;
}