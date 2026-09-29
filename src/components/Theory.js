import { DatabaseDiagram } from "./DatabaseDiagram.js";

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
            .replace(/"/g, "&quot;");
    }

    function highlightCode(text, language) {
        const escaped = escapeHtml(text);

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

        return escaped
            .split("\n")
            .map(line => {
                const yamlKey = line.match(/^(\s*)([^:#]+)(:)(.*)$/);

                if (!yamlKey) {
                    return line;
                }

                const indentation = yamlKey[1];
                const key = yamlKey[2];
                const colon = yamlKey[3];
                const value = yamlKey[4];

                let styledValue = value;

                if (value.trim().startsWith("#")) {
                    styledValue = `
                        <span class="code-comment">
                            ${value}
                        </span>
                    `;
                } else if (
                    /^(\s*['"]?.*?['"]?)$/.test(value) &&
                    value.trim() !== ""
                ) {
                    styledValue = `
                        <span class="code-string">
                            ${value}
                        </span>
                    `;
                }

                return `
                    ${indentation}
                    <span class="code-key">
                        ${key}
                    </span>${colon}${styledValue}
                `;
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

                return `
                    <p>
                        ${escapeHtml(lines.join(" "))}
                    </p>
                `;
            })
            .join("");
    }

    function renderLegacyCode(text) {
        if (!text) {
            return "";
        }

        return `
            <div class="code-example">
                <pre><code>${escapeHtml(text.trim())}</code></pre>
            </div>
        `;
    }

    function renderTaskCode(section) {
        return `
            <div class="practice-code">
                <div class="practice-code__header">
                    <span>${section.language || "code"}</span>
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
                                <span>Используй $ref:</span>
                                <code>${escapeHtml(section.ref)}</code>
                            </div>
                        `
                        : ""
                }

            </div>
        `;
    }

    function renderEndpoint(section) {
        return `
            ${
                section.text
                    ? `<div class="task-description">${renderText(section.text)}</div>`
                    : ""
            }

            <div class="endpoint-card">

                <div class="endpoint-card__route">

                    <span class="http-method http-method--get">
                        ${escapeHtml(section.method)}
                    </span>

                    <code class="endpoint-card__path">
                        ${escapeHtml(section.path)}
                    </code>

                </div>

                <div class="endpoint-card__fields">

                    ${section.fields
                        .map(field => `
                            <div class="endpoint-field">
                                <span>
                                    ${escapeHtml(field[0])}
                                </span>

                                <code>
                                    ${escapeHtml(field[1])}
                                </code>
                            </div>
                        `)
                        .join("")}

                </div>

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
                                    response-status--${response.status === "200" ? "success" : "error"}
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

    function renderWarning(section) {
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
                                                        <code>${escapeHtml(row[0])}</code>
                                                    </td>

                                                    <td>
                                                        <code>${escapeHtml(row[1])}</code>
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
                            <span>${escapeHtml(item)}</span>
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
                                                ? renderWarning(section)
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

    return `
        <section class="panel theory-panel">

            <div class="panel-header">
                <div>
                    <span class="panel-header__label">
                        ${lesson.icon}
                        ${isPractice ? "ПЕРЕД ПРАКТИКОЙ" : "ТЕОРИЯ"}
                    </span>

                    <h2>
                        ${escapeHtml(theory.title || lesson.title)}
                    </h2>
                </div>
            </div>

            <div class="panel-body">

                ${
                    theory.sections
                        ? theory.sections
                            .map(section => `
                                <div class="theory-section">

                                    <h3>
                                        ${escapeHtml(section.title)}
                                    </h3>

                                    ${renderText(section.text)}

                                </div>
                            `)
                            .join("")
                        : ""
                }

                ${
                    theory.text
                        ? `
                            <div class="theory-section">
                                ${renderText(theory.text)}
                            </div>
                        `
                        : ""
                }

                ${
                    lesson.id === "theory-9"
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
                                <h3>Как это работает</h3>
                                ${renderLegacyCode(theory.swagger)}
                            </div>
                        `
                        : ""
                }

                ${
                    theory.structure
                        ? `
                            <div class="theory-section">
                                <h3>Структура</h3>
                                ${renderLegacyCode(theory.structure)}
                            </div>
                        `
                        : ""
                }

                ${
                    theory.yaml
                        ? `
                            <div class="theory-section">
                                <h3>Пример YAML</h3>
                                ${renderLegacyCode(theory.yaml)}
                            </div>
                        `
                        : ""
                }

                ${
                    theory.explanation
                        ? `
                            <div class="theory-section">
                                <h3>Разбираем структуру</h3>
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