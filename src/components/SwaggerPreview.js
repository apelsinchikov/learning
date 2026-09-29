export function SwaggerPreview() {
    return `
        <section class="panel swagger-panel">

            <div class="panel-header">

                <div>
                    <span class="panel-header__label">
                        ШАГ 3
                    </span>

                    <h2>Swagger UI</h2>
                </div>

                <span class="live-indicator">
                    ● LIVE
                </span>

            </div>

            <div id="swagger-preview" class="swagger-placeholder">

                <div class="swagger-placeholder__icon">
                    API
                </div>

                <h3>
                    Здесь появится документация API
                </h3>

                <p>
                    После написания корректной
                    OpenAPI спецификации здесь
                    отобразится Swagger UI.
                </p>

            </div>

        </section>
    `;
}