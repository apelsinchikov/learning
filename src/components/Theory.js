export function Theory() {
    return `
        <section class="panel theory-panel">

            <div class="panel-header">
                <div>
                    <span class="panel-header__label">
                        ШАГ 1
                    </span>

                    <h2>Теория</h2>
                </div>
            </div>

            <div class="panel-body">

                <h3>Что такое OpenAPI?</h3>

                <p>
                    OpenAPI — это стандарт описания REST API.
                    Спецификация записывается в YAML или JSON
                    и позволяет инструментам автоматически
                    создавать документацию, проверять API
                    и генерировать код.
                </p>

                <div class="info-card">
                    <div class="info-card__title">
                        💡 Главная идея
                    </div>

                    <p>
                        Мы не пишем сам сервер.
                        Мы описываем, каким должен быть
                        API сервера.
                    </p>
                </div>

                <h3>Минимальная структура</h3>

                <p>
                    Любая OpenAPI спецификация начинается
                    с версии стандарта и информации об API.
                </p>

                <div class="code-example">
                    <div>openapi: 3.0.3</div>
                    <div>info:</div>
                    <div>&nbsp;&nbsp;title: My API</div>
                    <div>&nbsp;&nbsp;version: 1.0.0</div>
                </div>

                <h3>Твоя задача</h3>

                <p>
                    Напиши спецификацию с одним GET методом
                    <code>/hello</code>.
                </p>

            </div>

        </section>
    `;
}