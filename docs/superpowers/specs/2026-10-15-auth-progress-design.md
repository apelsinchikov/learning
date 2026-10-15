# Вход через Google/Яндекс и сохранение прогресса

Дата: 2026-10-15. Статус: черновик на проверку.

## Цель

Посетитель курса может войти через Google или Яндекс, и его прогресс сохраняется в Supabase: можно продолжить с другого устройства. Курс остаётся статическим сайтом на GitHub Pages, бэкенд — только Supabase. Вход необязателен: без него курс работает, как раньше.

## Не входит в задачу

- Регистрация по email и паролю, восстановление пароля, коды и письма (SMTP/Brevo не нужен).
- Роли, админка, статистика по пользователям, соцсети кроме Google и Яндекса.
- Серверный код: без своих серверов; исключение — запасной вариант для Яндекса (см. «Риски»).

## Что считается прогрессом

1. Прочитанные теории.
2. Пройденные практики (успешная проверка).
3. Текущий урок (на каком остановился).
4. YAML-черновик в каждой практике.

## Архитектура

Фронтенд (Vite, JS) → `@supabase/supabase-js` → Supabase (Auth + Postgres с RLS).

Новые модули, логика отделена от DOM:

- `src/auth/supabaseClient.js` — создание клиента (URL и publishable-ключ в коде; безопасность держится на RLS).
- `src/auth/authService.js` — `signIn(provider)`, `signOut()`, `getUser()`, `onAuthChange(cb)`. Провайдеры: `google`, `yandex`.
- `src/auth/AuthModal.js`, `src/auth/UserMenu.js` — окно «Войти» с двумя кнопками и меню пользователя в шапке («Имя», «Выйти»).
- `src/progress/progressModel.js` — чистые функции: пустое состояние, `markRead`, `markSolved`, `saveDraft`, `setCurrentLesson`, `merge(a, b)`, счётчики.
- `src/progress/localStore.js` — чтение/запись состояния в `localStorage` (с try/catch).
- `src/progress/cloudStore.js` — загрузка и сохранение в Supabase.
- `src/progress/progressService.js` — единая точка для UI: выбирает хранилище по состоянию входа, откладывает запись YAML (debounce 1,5 с), сливает данные при входе.

UI подключается через `progressService`, остальной код курса не знает про Supabase.

## Модель данных

Формат состояния (и в `localStorage`, и в памяти):

```
{
  currentLesson: { id, updatedAt },
  lessons: {
    "<lessonId>": { read: bool, solved: bool, draft: string|null, draftUpdatedAt: iso|null }
  }
}
```

SQL (в Supabase SQL Editor):

```sql
create table public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null,
  read boolean not null default false,
  solved boolean not null default false,
  draft_yaml text,
  draft_updated_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table public.user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_lesson text,
  updated_at timestamptz not null default now()
);

alter table public.lesson_progress enable row level security;
alter table public.user_state enable row level security;

create policy "own progress" on public.lesson_progress
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own state" on public.user_state
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
```

Доступ анонимной роли к таблицам не выдаётся.

## Слияние гостевого и облачного прогресса

Выполняется при входе (и при загрузке страницы с активной сессией):

- `read` и `solved`: логическое ИЛИ (прогресс не теряется).
- Черновик YAML: побеждает запись с более поздним `draftUpdatedAt`.
- Текущий урок: побеждает более поздний `updatedAt`.

Результат пишется в облако и становится локальным кэшем. При выходе локальный прогресс очищается (общие компьютеры); дальше работает как у гостя с нуля.

## Поведение интерфейса

- Шапка: кнопка «Войти» или имя и «Выйти».
- Сайдбар: галочки у прочитанных теорий и пройденных практик, счётчик «Пройдено N из 21».
- Теория считается прочитанной, когда пользователь открыл её и нажал «Следующий урок» (или дошёл до конца страницы — уточним в плане).
- Практика считается пройденной после успешной проверки.
- При входе открывается сохранённый текущий урок; YAML подставляется из черновика, если он есть.
- Ошибки сети: курс продолжает работать, прогресс остаётся локально, повторная синхронизация при следующем действии; пользователю показывается ненавязчивое сообщение «Не удалось сохранить, попробуем позже».

## Настройка Supabase и провайдеров (делает владелец проекта)

1. Выполнить SQL выше.
2. Authentication → URL Configuration: Site URL `https://apelsinchikov.github.io/learning/`; Redirect URLs: тот же адрес и `http://localhost:5173/learning/`.
3. Google: OAuth-клиент в Google Cloud Console, Authorized redirect URI `https://ndotgrgsvyewzisxybkb.supabase.co/auth/v1/callback`; Client ID и Secret вставить в Supabase → Providers → Google.
4. Яндекс: приложение в Яндекс OAuth (доступ к email и имени), тот же Redirect URI; в Supabase добавить custom OAuth-провайдер `yandex` (ручные endpoints: authorize `https://oauth.yandex.com/authorize`, token `https://oauth.yandex.com/token`, userinfo `https://login.yandex.ru/info?format=json`).
5. Секреты (Client Secret) вводит владелец, в репозиторий они не попадают.

## Риски

- **Яндекс и Supabase.** Яндекс отдаёт `default_email` и `id`, а Supabase ждёт стандартные `email` и `sub`; custom OAuth2 может не распознать ответ. Первый шаг плана — проверка на практике. Запасной вариант: Edge Function, которая проксирует userinfo и приводит поля к стандарту (потребует отдельного описания в плане).
- Бесплатный план Supabase: до 3 custom-провайдеров (нам нужен один), проект может «засыпать» при неактивности — первая загрузка прогресса может быть медленной.
- Секреты и RLS: ошибка в политике открыла бы данные других пользователей; на неё нужен тест вручную (два аккаунта).

## Тестирование

- Unit (vitest, без сети): `progressModel` (отметки, счётчики, `merge` со всеми правилами), `localStore` (мок `localStorage`, в том числе недоступный), `progressService` (мок облачного хранилища: debounce, офлайн-ошибка, слияние при входе).
- Рендер: сайдбар с галочками и счётчиком, кнопка «Войти» / меню пользователя, окно с двумя провайдерами.
- Ручная проверка после настройки: вход Google, вход Яндекс, перенос гостевого прогресса, второй аккаунт не видит чужие строки, выход очищает локальные данные.

## Порядок работ (предварительно, детализирует план)

1. Модель и хранилище прогресса (локально, гость) + UI галочек.
2. Supabase-клиент, вход через Google, облачное хранилище, слияние.
3. Яндекс: проверка feasibility → подключение (или запасной вариант).
4. Инструкция по настройке в README/docs.
