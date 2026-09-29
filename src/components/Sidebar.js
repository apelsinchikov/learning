export function Sidebar() {
    return `
        <aside class="sidebar">

            <div class="sidebar__section-title">
                Курс
            </div>

            <nav class="lesson-list">

                <button class="lesson lesson--active">
                    <span class="lesson__number">1</span>

                    <span class="lesson__content">
                        <strong>Hello World</strong>
                        <small>Базовая структура</small>
                    </span>
                </button>

                <button class="lesson">
                    <span class="lesson__number">2</span>

                    <span class="lesson__content">
                        <strong>DTO — Пользователи</strong>
                        <small>Схемы данных</small>
                    </span>
                </button>

                <button class="lesson">
                    <span class="lesson__number">3</span>

                    <span class="lesson__content">
                        <strong>POST — Создание</strong>
                        <small>Отправка данных</small>
                    </span>
                </button>

                <button class="lesson">
                    <span class="lesson__number">4</span>

                    <span class="lesson__content">
                        <strong>PUT, DELETE, параметры</strong>
                        <small>Работа с ресурсами</small>
                    </span>
                </button>

                <button class="lesson">
                    <span class="lesson__number">5</span>

                    <span class="lesson__content">
                        <strong>Коды ошибок</strong>
                        <small>400, 409 и другие</small>
                    </span>
                </button>

                <button class="lesson">
                    <span class="lesson__number">6</span>

                    <span class="lesson__content">
                        <strong>Security</strong>
                        <small>Bearer и JWT</small>
                    </span>
                </button>

                <button class="lesson">
                    <span class="lesson__number">7</span>

                    <span class="lesson__content">
                        <strong>Серверы и теги</strong>
                        <small>Окружения и группировка</small>
                    </span>
                </button>

            </nav>

            <div class="sidebar__progress">

                <div class="progress-header">
                    <span>Прогресс</span>
                    <strong>0 / 7</strong>
                </div>

                <div class="progress-bar">
                    <div class="progress-bar__value"></div>
                </div>

            </div>

        </aside>
    `;
}