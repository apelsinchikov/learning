export function Editor() {
    return `
        <section class="panel editor-panel">

            <div class="panel-header">

                <div>
                    <span class="panel-header__label">
                        ШАГ 2
                    </span>

                    <h2>YAML</h2>
                </div>

                <button class="check-button" id="check-button">
                    ✓ Проверить
                </button>

            </div>

            <div class="editor">

                <div class="editor__line-numbers">
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5</span>
                    <span>6</span>
                    <span>7</span>
                </div>

                <textarea
                    id="yaml-editor"
                    class="editor__textarea"
                    spellcheck="false"
                >openapi: 3.0.3
info:
  title: My API
  version: 1.0.0
paths:
  /hello:
    get:</textarea>

            </div>

        </section>
    `;
}