# Проект: интерактивный курс по OpenAPI

## Назначение
Сайт-курс, который с нуля учит основам OpenAPI людей без технического бэкграунда
(бизнес-пользователей, начинающих системных аналитиков). Теория простыми словами
чередуется с практикой: ученик пишет YAML в редакторе, сайт проверяет его и
показывает результат в Swagger UI.

Адрес: https://apelsinchikov.github.io/learning/
Исходный код: https://github.com/apelsinchikov/learning

## Границы курса
- Курс про **основы** OpenAPI 3.0.3: paths, методы, parameters, schemas, requestBody,
  responses, `$ref`, базовые коды ответов.
- Курс **не** учит продвинутому: кастомные заголовки (`X-Trace-Id`), `callbacks`,
  `webhooks`, `links`, расширения `x-*`, `oneOf/allOf`, генерация кода.
- Язык интерфейса и уроков: русский. Идентификаторы в YAML — английские.

## Технологии
- Vite 8, чистый JavaScript (ES-модули), без UI-фреймворка. Страница собирается
  шаблонными функциями-компонентами (`src/components`).
- Редактор: CodeMirror 6 (`@codemirror/lang-yaml`, тема one-dark).
- Проверка спецификации: `@scalar/openapi-parser` + собственный валидатор уроков
  (`src/utils/validator.js`).
- Предпросмотр: `swagger-ui-dist`; мок-API подменяет `window.fetch`
  (`src/mock/mockApi.js`).
- Диаграммы: `mermaid`.
- Вход и прогресс: Supabase (Auth + Postgres + RLS), `@supabase/supabase-js`.
- Тесты: Vitest (среда node, без jsdom), `npm test`.
- Хостинг: GitHub Pages, base-путь `/learning/`.

## Структура репозитория
- `src/lessons/theory/*.js`, `src/lessons/practice/*.js` — по одному файлу на урок.
- `src/data/course.js` — порядок уроков (единственный источник порядка).
- `src/components`, `src/ui`, `src/editor`, `src/styles` — интерфейс.
- `src/auth`, `src/progress` — вход и сохранение прогресса.
- `public/privacy.html` — политика конфиденциальности.
- `supabase/schema.sql` — таблицы и политики RLS.
- `docs/setup`, `docs/superpowers` — инструкции и дизайн-документы.
- `openspec/` — спецификации поведения и предложения изменений.
- `docs/course-design-document.md` — курсовой дизайн-документ (аналог GDD).

## Соглашения
- Уроки — это данные (объекты), а не разметка. Новый урок = новый файл + строка
  в `course.js` + тест, что порядок и идентификаторы корректны.
- Язык текста: короткие предложения, бытовые аналогии, термин объясняется при
  первой встрече. Новичку должно быть понятно без гугла.
- В примерах YAML — отступ 2 пробела, английские названия, `operationId` в camelCase.
- Код тестируется по TDD: сначала падающий тест. Чистая логика отделена от
  браузерного кода (внедряемые хранилища и клиенты).
- Секреты не хранятся в репозитории. В клиентском коде только публичный
  (publishable) ключ Supabase.
- Коммиты и PR описываются по-русски.
- Все коммиты — от имени владельца проекта (GitHub: `apelsinchikov`). Строки
  `Co-Authored-By: Claude`, `Claude-Session` и «Generated with Claude Code»
  в коммитах и описаниях PR НЕ добавляются. Автор коммита — не `Claude`.

## Рабочий процесс
1. Ветка от `dev` → PR в `dev`.
2. `dev` → `preprod` (CI гоняет тесты).
3. `preprod` → `main` (CI гоняет тесты) → автоматический деплой на GitHub Pages.
4. В `main` вливаем только после явного «go» владельца.
5. Изменения поведения оформляем как OpenSpec-предложение в `openspec/changes/`,
   после выкладки переносим дельты в `openspec/specs/`.

## Внешние сервисы
- Supabase: проект `ndotgrgsvyewzisxybkb` (Auth, Postgres, Edge Function
  `yandex-userinfo` без проверки JWT).
- Google OAuth (экран согласия опубликован, домен подтверждён в Search Console).
- Яндекс OAuth — как custom-провайдер Supabase `custom:yandex`.
