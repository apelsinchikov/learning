import { Header } from "./Header.js";
import { Sidebar } from "./Sidebar.js";
import { Theory } from "./Theory.js";
import { Editor } from "./Editor.js";
import { SwaggerPreview } from "./SwaggerPreview.js";

export function App() {
    return `
        <div class="app">

            ${Header()}

            <div class="app-layout">

                ${Sidebar()}

                <main class="main-content">

                    <div class="page-header">

                        <div>
                            <div class="page-header__label">
                                УРОК 1 ИЗ 7
                            </div>

                            <h1>Hello World</h1>

                            <p>
                                Создадим первую OpenAPI спецификацию
                                и разберём её структуру.
                            </p>
                        </div>

                        <button class="next-button">
                            Следующий урок →
                        </button>

                    </div>

                    <div class="workspace">

                        ${Theory()}

                        ${Editor()}

                        ${SwaggerPreview()}

                    </div>

                </main>

            </div>

        </div>
    `;
}