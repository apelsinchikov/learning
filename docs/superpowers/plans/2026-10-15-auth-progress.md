# Вход через Google/Яндекс и сохранение прогресса — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Посетитель может войти через Google или Яндекс, а его прогресс (прочитанные теории, пройденные практики, текущий урок, YAML-черновики) сохраняется в Supabase; гость хранит то же в `localStorage`.

**Architecture:** Чистая модель прогресса (`src/progress/progressModel.js`) + два хранилища за одним интерфейсом (локальное и облачное) + `progressService`, который выбирает хранилище по состоянию входа и сливает данные. Авторизация — тонкая обёртка над `@supabase/supabase-js` (`signInWithOAuth`). Вся логика принимает зависимости параметрами (хранилище, клиент, часы), поэтому тестируется без сети и без DOM.

**Tech Stack:** Vite, vanilla JS (ES modules), vitest (окружение node, jsdom нет), `@supabase/supabase-js` (новая зависимость), Supabase Auth + Postgres (RLS).

**Spec:** `docs/superpowers/specs/2026-10-15-auth-progress-design.md`

## Global Constraints

- Тесты: `npm test` (vitest, окружение node). Тесты не трогают сеть, `window`, `document`, `localStorage`: всё через параметры (подставляемое хранилище, поддельный клиент, подставляемые часы).
- В облачном контейнере Claude нет `node_modules` и npm-реестра: `npm test` и `npm install` запускает владелец у себя; исполнитель в контейнере только пишет код и тесты.
- Формат состояния: `{ currentLesson: { id: string, updatedAt: string } | null, lessons: { [lessonId]: { read: boolean, solved: boolean, draft: string | null, draftUpdatedAt: string | null } } }`; все даты — ISO-строки.
- Supabase: URL `https://ndotgrgsvyewzisxybkb.supabase.co`, publishable key `sb_publishable_u34UvmdeME0_PsmAnYU5sw_DTmpCCXV` (публичный, лежит в `src/auth/config.js`; secret/service_role ключи в репозиторий не попадают).
- Таблицы уже описаны в `supabase/schema.sql`: `lesson_progress(user_id, lesson_id, read, solved, draft_yaml, draft_updated_at, updated_at)` и `user_state(user_id, current_lesson, updated_at)`; владелец проекта выполняет SQL сам.
- Провайдеры: `google`, `yandex` (имя для Supabase `custom:yandex` проверить в Task 9). Адрес возврата после входа: `window.location.origin + import.meta.env.BASE_URL` (base `/learning/`).
- Ключ `localStorage`: `openapi-course-progress-v1`. Запись черновика в облако откладывается на 1500 мс.
- Курс работает без входа; ошибка сети или недоступный `localStorage` не ломают курс.
- Весь текст интерфейса на русском. Ветка: `feat/auth-progress` от `docs/auth-progress-spec` (спека, план и `schema.sql` едут вместе); один PR в `dev`. В `main` — только по команде владельца.

## Review Focus

- `localStorage` недоступен (приватный режим) или содержит битый JSON/чужой формат → курс открывается с пустым прогрессом, исключений нет (Task 2).
- В браузере остался локальный кэш пользователя A, входит пользователь B → кэш A не попадает в аккаунт B и не показывается (владелец кэша хранится рядом; Task 2, 4).
- Облако отвечает ошибкой или нет сети → прогресс остаётся локально, повтор при следующем действии, курс не падает (Task 4).
- В прогрессе есть id уроков, которых больше нет в курсе (после перестройки курса) → счётчик «N из M» считает только существующие уроки, N ≤ M (Task 3).
- Практика уже решена, затем проверка провалилась или YAML переписан → отметка «пройдено» не снимается (Task 1).
- Быстрые правки YAML подряд → в облако уходит одна запись с последним текстом, а не по запросу на каждую букву (Task 4).
- Двойной клик по «Войти» и возврат с `?code=` в адресе → один переход, после возврата адрес очищается от параметров (Task 6).

---

### Task 1: Модель прогресса

**Files:**
- Create: `src/progress/progressModel.js`
- Test: `src/progress/progressModel.test.js`

**Interfaces:**
- Produces (все функции чистые и возвращают НОВЫЙ объект; `now` — ISO-строка, по умолчанию `new Date().toISOString()`):
  - `createEmptyProgress(): Progress`
  - `markRead(p: Progress, lessonId: string, now?: string): Progress`
  - `markSolved(p, lessonId, now?): Progress`
  - `saveDraft(p, lessonId, yaml: string, now?): Progress` — ставит `draft` и `draftUpdatedAt`
  - `setCurrentLesson(p, lessonId, now?): Progress`
  - `mergeProgress(a: Progress, b: Progress): Progress` — `read`/`solved` через ИЛИ; `draft` у записи с более поздним `draftUpdatedAt` (при `null` у одной стороны побеждает другая); `currentLesson` с более поздним `updatedAt`
  - `isLessonDone(lesson: { id, type }, p: Progress): boolean` — теория: `read`; практика: `solved`
  - `countDone(course: Lesson[], p: Progress): number` — только уроки, которые есть в `course`
  - `getDraft(p, lessonId): string | null`

- [ ] **Step 1: Write the failing tests** (`progressModel.test.js`):
  - `markRead` не меняет исходный объект и ставит `lessons.x.read === true`.
  - `markSolved` потом `saveDraft` с другим текстом → `solved` остаётся `true`.
  - `mergeProgress`: `read`/`solved` — ИЛИ; draft с более поздней датой побеждает в обе стороны (порядок аргументов не важен); draft `null` не затирает непустой; `currentLesson` берётся с более поздним `updatedAt`; `mergeProgress(empty, p)` равно `p`.
  - `countDone` на мини-курсе из 3 уроков считает только существующие id (в прогрессе есть `"deleted-lesson": {solved: true}` → в счётчик не входит).
  - `isLessonDone`: теория `read` → true, практика `read` без `solved` → false.
- [ ] **Step 2: Run** `npx vitest run src/progress/progressModel.test.js` → FAIL (модуль не найден).
- [ ] **Step 3: Implement** функции выше в `progressModel.js`; неизвестный урок создаётся с `{read:false, solved:false, draft:null, draftUpdatedAt:null}`.
- [ ] **Step 4: Run** тот же файл → PASS.
- [ ] **Step 5: Commit** `feat(progress): add progress model with merge rules`.

### Task 2: Локальное хранилище

**Files:**
- Create: `src/progress/localStore.js`
- Test: `src/progress/localStore.test.js`

**Interfaces:**
- Consumes: `createEmptyProgress` из Task 1.
- Produces: `createLocalStore(storage: { getItem, setItem, removeItem } | null, key = "openapi-course-progress-v1")` → `{ load(): { progress: Progress, owner: string | null }, save(progress: Progress, owner: string | null): void, clear(): void }`. `owner` — id пользователя, чей это кэш; `null` — гость.

- [ ] **Step 1: Write the failing tests** (подставляется поддельное хранилище на `Map`):
  - `save` затем `load` возвращает те же `progress` и `owner`.
  - Пустое хранилище → `{ progress: createEmptyProgress(), owner: null }`.
  - Битый JSON, JSON другого формата (массив, строка, объект без `lessons`) → пустое состояние, исключения нет.
  - `storage === null` и `storage`, который бросает исключение в `getItem`/`setItem` → `load` отдаёт пустое, `save`/`clear` молча ничего не делают.
  - `clear` удаляет ключ.
- [ ] **Step 2: Run** `npx vitest run src/progress/localStore.test.js` → FAIL.
- [ ] **Step 3: Implement** `createLocalStore`: всё в `try/catch`, формат записи `{ v: 1, owner, progress }`, проверка формы (`lessons` — объект) при чтении.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(progress): local progress store tolerant to broken storage`.

### Task 3: Галочки и счётчик в сайдбаре

**Files:**
- Modify: `src/components/Sidebar.js` (сигнатура `Sidebar(currentLessonIndex = 0, progress = createEmptyProgress())`)
- Modify: `src/components/App.js` (сигнатура `App(currentLessonIndex = 0, { progress, user } = {})`, `progress` пробрасывается в `Sidebar`, `user` — в `Header` в Task 7)
- Modify: `src/styles/additions.css` (стили `.lesson--done`, `.lesson__check`)
- Test: `src/components/Sidebar.test.js`

**Interfaces:**
- Consumes: `isLessonDone`, `countDone` (Task 1).
- Produces: `Sidebar(index, progress): string`; у выполненного урока класс `lesson--done` и элемент `<span class="lesson__check">✓</span>`; счётчик `<strong>N / M</strong>`; `progress-bar__value` с `style="width: X%"`.

- [ ] **Step 1: Write the failing tests:** без прогресса счётчик `0 / 21` (M = `course.length`), нет `lesson--done`; с `markRead` первой теории и `markSolved` первой практики — ровно два `lesson--done` и `2 / 21`; прогресс с id несуществующего урока не увеличивает счётчик; ширина полосы = `round(N / M * 100)`.
- [ ] **Step 2: Run** `npx vitest run src/components/Sidebar.test.js src/components/App.test.js` → FAIL (новые тесты).
- [ ] **Step 3: Implement** — `Sidebar` и `App` по сигнатурам выше; существующие тесты `App.test.js` проходят без изменений.
- [ ] **Step 4: Run** те же файлы → PASS.
- [ ] **Step 5: Commit** `feat(ui): show completed lessons and counter in sidebar`.

### Task 4: Сервис прогресса

**Files:**
- Create: `src/progress/progressService.js`
- Test: `src/progress/progressService.test.js`

**Interfaces:**
- Consumes: функции Task 1; `localStore` (Task 2); `cloudStore` с интерфейсом `{ load(userId): Promise<Progress>, save(userId, progress, changed?: { lessonIds: string[], currentLesson: boolean }): Promise<void> }` (реализует Task 5; в тестах — поддельный).
- Produces: `createProgressService({ localStore, cloudStore, debounceMs = 1500, timers = { setTimeout, clearTimeout } })` → объект:
  - `getProgress(): Progress`, `getUserId(): string | null`
  - `onChange(cb: (p: Progress) => void): () => void` (отписка), `onSyncError(cb: (err: unknown) => void): () => void`
  - `markRead(lessonId)`, `markSolved(lessonId)`, `setCurrentLesson(lessonId)` — меняют состояние, пишут локально сразу, в облако (если вошёл) сразу
  - `saveDraft(lessonId, yaml)` — локально сразу, в облако через `debounceMs` (одна запись с последним текстом)
  - `signedIn(userId: string): Promise<void>` — загружает облако; если `local.owner` равен `null` или `userId`, сливает `mergeProgress(local, cloud)`, иначе локальный кэш выбрасывается; результат пишется в облако и локально с `owner = userId`
  - `signedOut(): void` — `localStore.clear()`, состояние пустое, `userId = null`
  - `flush(): Promise<void>` — отправить отложенное немедленно (вызывается при выходе и `pagehide`)

- [ ] **Step 1: Write the failing tests** (поддельный `localStore` на объекте, `cloudStore` — на `vi.fn`, свои `timers` с ручным запуском):
  - Гость: `markSolved` пишет в `localStore.save(..., null)`, облако не вызывается.
  - `signedIn("u1")` при локальном гостевом прогрессе и пустом облаке → в облако ушёл гостевой прогресс, `localStore.save(..., "u1")`.
  - `signedIn("u1")` когда в облаке свежее YAML, чем в локальном → побеждает облачный; когда локальный свежее → локальный.
  - Review Focus: локальный кэш с `owner: "u1"`, входит `"u2"` → кэш выброшен, в облако u2 ничего из него не ушло.
  - Review Focus: `cloudStore.save` отклоняет промис → `onSyncError` вызван, состояние и локальная запись целы, следующее действие снова пытается отправить.
  - Review Focus: пять `saveDraft` подряд → после `timers`-прогона ровно один `cloudStore.save` с последним текстом.
  - `signedOut` очищает `localStore` и состояние; `flush` отправляет отложенный черновик немедленно.
  - `onChange` вызывается при каждом изменении, отписка работает.
- [ ] **Step 2: Run** `npx vitest run src/progress/progressService.test.js` → FAIL.
- [ ] **Step 3: Implement** `createProgressService`: состояние в замыкании; облачные записи ставятся в очередь по одной (чтобы не перегонять друг друга); ошибка облака ловится, сообщается через `onSyncError`, помечает «нужно отправить заново».
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(progress): progress service with sign-in merge and debounced sync`.

### Task 5: Облачное хранилище (Supabase)

**Files:**
- Create: `src/progress/cloudStore.js`
- Test: `src/progress/cloudStore.test.js`
- Modify: `package.json` (зависимость `@supabase/supabase-js`, владелец выполняет `npm install` и обновляет `package-lock.json`)

**Interfaces:**
- Consumes: формат состояния из Global Constraints; поддельный клиент в тестах повторяет форму `client.from(table).select().eq()` / `.upsert(rows, { onConflict })` из supabase-js.
- Produces: `createCloudStore(client)` → `{ load(userId): Promise<Progress>, save(userId, progress, changed?): Promise<void> }`; ошибки Supabase (`{ error }` в ответе) превращаются в `throw new Error(...)`. Маппинг: `draft_yaml` ↔ `draft`, `draft_updated_at` ↔ `draftUpdatedAt`; `user_state.current_lesson` + `updated_at` ↔ `currentLesson`. `save` делает `upsert` только изменённых уроков (`changed.lessonIds`), без `changed` — всех.

- [ ] **Step 1: Write the failing tests:** `load` собирает `Progress` из строк `lesson_progress` и `user_state`; пустые таблицы → пустой прогресс; `save` вызывает `upsert` в `lesson_progress` с `onConflict: "user_id,lesson_id"` и строками нужной формы (проверить поля и `user_id`); `changed.currentLesson` → `upsert` в `user_state` с `onConflict: "user_id"`; `{ error }` из клиента → отклонённый промис.
- [ ] **Step 2: Run** `npx vitest run src/progress/cloudStore.test.js` → FAIL.
- [ ] **Step 3: Implement** `createCloudStore` по маппингу выше.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(progress): Supabase cloud store`.

### Task 6: Клиент Supabase и сервис авторизации

**Files:**
- Create: `src/auth/config.js` (экспорт `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `PROVIDERS = [{ id: "google", label: "Google" }, { id: "yandex", label: "Яндекс" }]`)
- Create: `src/auth/supabaseClient.js` (`createSupabaseClient()` → `createClient(URL, KEY, { auth: { flowType: "pkce", detectSessionInUrl: true, persistSession: true } })`)
- Create: `src/auth/authService.js`
- Test: `src/auth/authService.test.js`

**Interfaces:**
- Produces: `createAuthService(client, { redirectTo: string, cleanUrl?: () => void })` → `{ signIn(providerId): Promise<void>, signOut(): Promise<void>, getUser(): Promise<AuthUser | null>, onAuthChange(cb: (user: AuthUser | null) => void): () => void }`, где `AuthUser = { id: string, email: string | null, name: string }` (`name` = `user_metadata.full_name` → `name` → часть email до «@» → «Пользователь»). `signIn` ведёт на `client.auth.signInWithOAuth({ provider, options: { redirectTo } })`; повторный вызов, пока идёт первый, игнорируется; неизвестный `providerId` → `throw`.

- [ ] **Step 1: Write the failing tests** (поддельный `client.auth`): `signIn("google")` вызывает `signInWithOAuth` с провайдером и `redirectTo`; двойной вызов подряд → один вызов клиента; `signIn("unknown")` отклоняется; `getUser` маппит сессию в `AuthUser` (все четыре варианта имени) и возвращает `null` без сессии; `onAuthChange` пробрасывает `SIGNED_IN` и `SIGNED_OUT`, отписка работает; после события с `code` в адресе вызывается `cleanUrl`.
- [ ] **Step 2: Run** `npx vitest run src/auth/authService.test.js` → FAIL.
- [ ] **Step 3: Implement** `authService.js`; `config.js` и `supabaseClient.js` — без тестов (константы и одна строка `createClient`).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(auth): auth service over Supabase OAuth`.

### Task 7: Интерфейс входа

**Files:**
- Create: `src/auth/authView.js` (чистые функции, возвращают HTML)
- Modify: `src/components/Header.js` (сигнатура `Header({ user } = {})`, контейнер `<div class="header__auth">` с результатом `renderAuthControls(user)`)
- Modify: `src/styles/additions.css`
- Test: `src/auth/authView.test.js`

**Interfaces:**
- Produces: `renderAuthControls(user: AuthUser | null): string` — гость: `<button class="auth-button" data-action="open-login">Войти</button>`; вошедший: `<span class="auth-user">{имя}</span><button class="auth-button" data-action="logout">Выйти</button>`; `renderLoginModal(providers): string` — модальное окно `<div class="auth-modal" role="dialog">` с кнопкой `data-provider="{id}"` на каждый провайдер и кнопкой `data-action="close-login"`. Имя пользователя экранируется (`escapeHtml` из `src/utils/textFormat.js`).

- [ ] **Step 1: Write the failing tests:** гость → есть `open-login`, нет `logout`; вошедший → имя и `logout`, нет `open-login`; имя `<img onerror=x>` экранировано; модальное окно содержит по кнопке `data-provider="google"` и `data-provider="yandex"` и подписи «Войти через Google» / «Войти через Яндекс»; `Header({ user })` вставляет `header__auth`.
- [ ] **Step 2: Run** `npx vitest run src/auth/authView.test.js` → FAIL.
- [ ] **Step 3: Implement** `authView.js`, правка `Header.js`, стили кнопки и модального окна (по образцу существующих `.nav-button`).
- [ ] **Step 4: Run** `npx vitest run` (весь набор, чтобы проверить, что шапку и сайдбар ничего не сломало) → PASS.
- [ ] **Step 5: Commit** `feat(auth): login button, user menu and provider modal`.

### Task 8: Подключение в `main.js`

**Files:**
- Modify: `src/main.js`
- Modify: `src/ui/navigation.js` (экспорт `bindLessonList(goToLesson)` — навешивание обработчиков списка уроков отдельно, чтобы после обновления сайдбара не навешивать кнопки «Предыдущий/Следующий» повторно; `initNavigation` использует его)
- Create: `src/auth/initAuth.js` (навешивает обработчики на `.header__auth` и модальное окно, получает `authService`, `providers`, `onUserChange`)
- Test: существующие тесты должны проходить; ручная проверка ниже

**Interfaces:**
- Consumes: `createProgressService`, `createLocalStore`, `createCloudStore`, `createAuthService`, `createSupabaseClient`, `renderAuthControls`, `renderLoginModal`, `Sidebar`, `App`.
- Поведение `main.js`:
  - При старте: создать сервис прогресса с `localStore` на `window.localStorage` (в `try/catch`, при ошибке `null`); стартовый урок — индекс из `progress.currentLesson.id`, если такой урок есть, иначе 0; `authService.getUser()` → если пользователь есть, `progressService.signedIn(user.id)`, затем перерисовать.
  - `onAuthChange`: `SIGNED_IN` → `signedIn(user.id)` и перерисовка; `SIGNED_OUT` → `signedOut()` и перерисовка.
  - Открытие урока → `setCurrentLesson(lesson.id)`.
  - Клик «Следующий урок» на теории → `markRead(lesson.id)` перед переходом (на практике ничего не отмечается).
  - В практике: начальный текст редактора = `getDraft(...) ?? lesson.initialYaml`; `EditorView.updateListener` на изменение документа → `saveDraft`; успешная проверка (нет `openapiErrors` и `taskErrors`) → `markSolved` и обновление сайдбара (`outerHTML` через `Sidebar(index, progress)` + `bindLessonList`).
  - `window.addEventListener("pagehide", () => progressService.flush())`; выход → `await flush()`, затем `authService.signOut()`.
  - `onSyncError` → ненавязчивое сообщение «Не удалось сохранить прогресс, попробуем позже» (элемент `.sync-notice`, исчезает через 5 с).
- `createYamlEditor(parent, initialText, { onChange } = {})` в `src/editor/createEditor.js` получает необязательный колбэк изменения документа.

- [ ] **Step 1: Правки** `navigation.js`, `createEditor.js`, `initAuth.js`, `main.js` по списку выше.
- [ ] **Step 2: Run** `npm test` → весь набор PASS (включая `App.test.js`).
- [ ] **Step 3: Ручная проверка гостем** (`npm run dev`, открыть `http://localhost:5173/learning/`): пройти практику «Каркас» (галочка в сайдбаре, счётчик `1 / 21`), перезагрузить страницу → галочка и открытый урок сохранились; набрать текст в практике, перезагрузить → текст на месте; в DevTools заблокировать `localStorage` (или приватное окно) → курс открывается, ошибок в консоли нет.
- [ ] **Step 4: Ручная проверка Google** (после настройки Supabase): «Войти» → «Войти через Google» → возврат на курс, в шапке имя, в Supabase → Table Editor → `lesson_progress` появились строки; открыть курс во втором браузере под тем же аккаунтом → прогресс и YAML на месте; «Выйти» → прогресс пропал, курс как у гостя; второй аккаунт Google не видит чужих строк.
- [ ] **Step 5: Commit** `feat: wire auth and progress into the app`.

### Task 9: Яндекс

**Files:**
- Modify: `src/auth/config.js` (идентификатор провайдера для Supabase)
- Test: `src/auth/authService.test.js` (случай `yandex`)

**Interfaces:**
- Consumes: `PROVIDERS` и `signIn` из Task 6.
- Produces: рабочий вход через Яндекс или решение о запасном варианте.

- [ ] **Step 1 (владелец):** в кабинете Яндекса создать приложение и в Supabase добавить custom OAuth2-провайдер по `docs/setup/supabase-auth-setup.md`, часть 3–4.
- [ ] **Step 2: Write the failing test:** `signIn("yandex")` вызывает `signInWithOAuth` с идентификатором, прописанным в `config.js` (для custom-провайдера Supabase ожидается формат `custom:<имя>` — подтвердить по панели Supabase и документации [Custom OAuth/OIDC providers](https://supabase.com/docs/guides/auth/custom-oauth-providers)).
- [ ] **Step 3: Run** `npx vitest run src/auth/authService.test.js` → FAIL, затем поправить значение в `config.js` → PASS.
- [ ] **Step 4: Ручная проверка Яндекса:** «Войти через Яндекс» → вход проходит, в Supabase → Authentication → Users появился пользователь, у него заполнен email.
- [ ] **Step 5: Решение:** если Supabase не принимает ответ Яндекса (нет email, ошибка при создании пользователя) — остановиться и написать владельцу; запасной вариант (Edge Function, приводящая `default_email`/`id` к `email`/`sub`) оформляется отдельной спекой и планом, остальные задачи это не блокирует.
- [ ] **Step 6: Commit** `feat(auth): Yandex provider`.

### Task 10: Документация и выкладка

**Files:**
- Modify: `README.md` (раздел «Вход и прогресс»: как это устроено, где лежит SQL и инструкция по настройке)
- Modify: `docs/setup/supabase-auth-setup.md` (актуализировать значения, если что-то изменилось по ходу)

- [ ] **Step 1:** Обновить README и инструкцию.
- [ ] **Step 2: Run** `npm test` и `npm run build` → оба зелёные.
- [ ] **Step 3: Commit** `docs: describe auth and progress`; push `feat/auth-progress`, открыть PR в `dev`.
- [ ] **Step 4 (по команде владельца):** провести `dev` → `preprod` → `main`; после деплоя на странице Branding в Google вставить ссылку `https://apelsinchikov.github.io/learning/privacy.html` (страница из PR #15 должна быть в этом же релизе).
