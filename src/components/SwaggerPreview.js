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

            <div class="panel-body swagger-panel__body">
                <div id="swagger-preview" class="swagger-container"></div>
            </div>

        </section>
    `;
}