# Настройка входа через Google и Яндекс (Supabase)

Делается один раз. Порядок: часть 1 (Supabase) → часть 2 (Google) → часть 3 (Яндекс) → часть 4 (подключение в Supabase). Секреты никуда не коммитим и в чат не отправляем.

Названия кнопок в кабинетах иногда меняются; если что-то называется чуть иначе, ориентируйтесь на смысл.

Ваши данные:
- Проект Supabase: `ndotgrgsvyewzisxybkb`
- Адрес проекта: `https://ndotgrgsvyewzisxybkb.supabase.co`
- **Callback (Redirect) URI для Google и Яндекса:** `https://ndotgrgsvyewzisxybkb.supabase.co/auth/v1/callback`
- Адрес курса: `https://apelsinchikov.github.io/learning/`

## Часть 1. Supabase: таблицы и адреса

1. Откройте https://supabase.com/dashboard/project/ndotgrgsvyewzisxybkb
2. Слева **SQL Editor** → **New query**. Вставьте содержимое файла `supabase/schema.sql` → **Run**. Должно появиться «Success. No rows returned».
3. Слева **Table Editor**: должны появиться таблицы `lesson_progress` и `user_state` с пометкой RLS enabled.
4. Слева **Authentication** → **URL Configuration**:
   - **Site URL:** `https://apelsinchikov.github.io/learning/`
   - **Redirect URLs** → Add URL: `https://apelsinchikov.github.io/learning/` и `http://localhost:5173/learning/`
   - Сохраните.
5. **Project Settings** → **API Keys**: скопируйте **Project URL** и **publishable key** (публичный, его можно отдать мне/в код). **secret** / **service_role** ключ никому не отправляйте.

## Часть 2. Google

1. Откройте https://console.cloud.google.com/ и войдите своим Google-аккаунтом.
2. Сверху выберите проект → **New project** → назовите «OpenAPI course» → **Create**.
3. Меню → **APIs & Services** → **OAuth consent screen** (может называться «Google Auth Platform»):
   - App name: «OpenAPI курс»; User support email: ваша почта.
   - Audience / User type: **External**.
   - Developer contact: ваша почта. Сохраните.
4. В разделе **Audience** нажмите **Publish app** (иначе войти смогут только добавленные тестовые пользователи). Достаточно базовых прав (email, profile): проверка Google не нужна.
5. **Credentials** (Clients) → **Create credentials / Create client** → **OAuth client ID** → тип **Web application**.
   - Authorized JavaScript origins: можно не заполнять.
   - **Authorized redirect URIs** → Add URI: `https://ndotgrgsvyewzisxybkb.supabase.co/auth/v1/callback`
   - **Create**.
6. Скопируйте **Client ID** и **Client secret** (секрет показывают один раз, сохраните в менеджере паролей).

## Часть 3. Яндекс

1. Откройте https://oauth.yandex.ru/ и войдите аккаунтом Яндекса.
2. **Создать приложение** → название «OpenAPI курс».
3. Платформа: **Веб-сервисы**.
   - **Callback URI #1:** `https://ndotgrgsvyewzisxybkb.supabase.co/auth/v1/callback`
4. Доступы (права): включите **Доступ к адресу электронной почты** (`login:email`) и **Доступ к логину, имени и фамилии, полу** (`login:info`).
5. Создайте приложение. Скопируйте **ID** и **Пароль** (Client ID и Client secret).

## Часть 4. Подключение провайдеров в Supabase

### Google
1. **Authentication** → **Sign In / Providers** → **Google**.
2. Включите, вставьте Client ID и Client secret из части 2. **Save**.

### Яндекс (custom OAuth)
1. Там же найдите добавление собственного провайдера (**Custom OAuth/OIDC providers** → **Add provider**).
2. Тип: **OAuth2** (у Яндекса нет OIDC discovery). Идентификатор, например, `yandex`.
3. Поля:
   - Client ID и Client secret: из части 3.
   - Authorization URL: `https://oauth.yandex.com/authorize`
   - Token URL: `https://oauth.yandex.com/token`
   - Userinfo URL: `https://login.yandex.ru/info?format=json`
   - Scopes: `login:email login:info`
4. Сохраните.

Важно: Яндекс отдаёт email в поле `default_email`, а Supabase ждёт `email`. Работает ли это без доработок, проверим первым шагом реализации. Если нет, будет запасной вариант (прокси-функция).

## Включение Яндекса в интерфейсе

Кнопка «Войти через Яндекс» скрыта, пока в `src/auth/config.js` у провайдера `yandex` стоит `enabled: false`. После того как вход через Яндекс проверен (пользователь появился в Supabase → Authentication → Users, у него заполнен email), поменяйте значение на `true`.

Идентификатор провайдера в Supabase должен совпадать с `supabaseProvider: "custom:yandex"` из конфига; если в панели Supabase он называется иначе, поправьте значение в конфиге.

## После получения кода

Выполните `npm install` (в проект добавлена зависимость `@supabase/supabase-js`) и закоммитьте обновлённый `package-lock.json`, иначе проверка на GitHub (`npm ci`) не пройдёт.

## Проверка

Когда код будет готов: кнопка «Войти через Google» ведёт на Google и возвращает на курс; в Supabase → **Authentication** → **Users** появляется пользователь. Второй аккаунт не должен видеть чужой прогресс (проверим вместе).

## Что передать для разработки

Мне нужны только публичные значения: Project URL и publishable key. Секреты (Client secret, secret/service_role ключ) мне не отправляйте: они вводятся только в Supabase.
