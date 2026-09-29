export function Editor() {
    return `
        <section class="panel editor-panel">

            <div class="panel-header">

                <div>
                    <span class="panel-header__label">
                        ШАГ 2
                    </span>

                    <h2>Редактор</h2>
                </div>

                <button class="check-button" id="check-button">
                    ✓ Проверить
                </button>

            </div>

            <div id="yaml-editor" class="editor"></div>

        </section>
    `;
}