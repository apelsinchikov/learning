# OpenAPI Course

Интерактивный учебный курс по **OpenAPI 3.x** с практическими заданиями, YAML-редактором, автоматической проверкой спецификаций и Swagger UI.

🌐 **Онлайн-версия:**  
https://apelsinchikov.github.io/learning/

## О проекте

Проект предназначен для последовательного изучения OpenAPI через небольшие теоретические блоки и практические задания.

В каждом практическом уроке пользователь:

1. изучает условие задания;
2. редактирует OpenAPI YAML;
3. запускает проверку;
4. получает отдельный результат проверки OpenAPI и условий задания;
5. после успешной проверки видит результат в Swagger UI.

Курс построен так, чтобы постепенно перейти от простых OpenAPI-документов к полноценному API пользователей, включая схемы, параметры, CRUD-операции и связь API с моделью базы данных.

## Возможности

- 📚 18 последовательных уроков
- 📝 интерактивный YAML-редактор на CodeMirror
- ✅ автоматическая проверка OpenAPI
- 🔎 проверка конкретных условий каждого практического задания
- 🚦 отдельное отображение ошибок OpenAPI и ошибок задания
- 📖 Swagger UI для успешных спецификаций
- 📊 Mermaid-диаграммы
- 🗄️ визуализация структуры базы данных
- 🌐 локальный mock API без отдельного backend-сервера
- 🚀 автоматический деплой на GitHub Pages
- 📦 полностью клиентское приложение

## Стек

### Frontend

- JavaScript
- HTML
- CSS
- Vite

### OpenAPI

- YAML
- OpenAPI 3.x
- `@scalar/openapi-parser`
- Swagger UI

### Редактор

- CodeMirror 6
- YAML language support

### Диаграммы

- Mermaid

### Mock API

- собственная реализация mock API в браузере

## Структура проекта

```text
learning/
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── src/
│   ├── components/
│   │   ├── App.js
│   │   ├── DatabaseDiagram.js
│   │   ├── Editor.js
│   │   ├── Header.js
│   │   ├── Sidebar.js
│   │   ├── SwaggerPreview.js
│   │   └── Theory.js
│   │
│   ├── data/
│   │   └── course.js
│   │
│   ├── lessons/
│   │   ├── theory/
│   │   └── practice/
│   │
│   ├── mock/
│   │   └── mockApi.js
│   │
│   ├── utils/
│   │   └── validator.js
│   │
│   └── main.js
│
├── index.html
├── package.json
├── package-lock.json
├── vite.config.mjs
└── README.md
```

## Уроки

Курс состоит из 18 уроков.

### Основы OpenAPI

1. OpenAPI Basics
2. Hello Users
3. Paths, Methods & Naming
4. Users API

### Schema

5. Schemas & Properties
6. Objects, Arrays & `$ref`
7. User DTO

### Request / Response

8. Request & Response JSON
9. Create User

### Parameters

10. Parameters
11. Get User
12. Query Parameters

### HTTP

13. Status Codes
14. Update & Delete User

### Хорошая спецификация

15. Good Specification
16. Final Users API

### Database → API

17. Database to API
18. Users from Database

## Как запустить локально

Требуется установленный Node.js и npm.

Клонировать репозиторий:

```bash
git clone https://github.com/apelsinchikov/learning.git
```

Перейти в директорию проекта:

```bash
cd learning
```

Установить зависимости:

```bash
npm install
```

Запустить dev-сервер:

```bash
npm run dev
```

После этого Vite покажет локальный адрес приложения, обычно:

```text
http://localhost:5173/
```

## Production build

Для проверки production-сборки:

```bash
npm run build
```

Собранное приложение появится в директории:

```text
dist/
```

## Как устроена проверка заданий

Проверка разделена на два уровня.

### 1. Проверка OpenAPI

Сначала YAML разбирается и проверяется как OpenAPI-документ.

Проверяются, в частности:

- корректность YAML;
- наличие и корректность `openapi`;
- `info`;
- `paths`;
- HTTP-методы;
- parameters;
- responses;
- requestBody;
- schemas;
- `$ref`;
- типы данных;
- ограничения;
- examples.

Ошибки этого уровня отображаются как:

```text
Ошибки OpenAPI
```

### 2. Проверка условий урока

Если OpenAPI-документ корректен, запускается проверка конкретного задания.

Например, урок может требовать:

- определённый endpoint;
- конкретный HTTP-метод;
- параметр `id`;
- определённый response status;
- конкретную schema;
- `required` properties;
- query parameters;
- `requestBody`;
- определённые ограничения типов.

Ошибки этого уровня отображаются как:

```text
Условия задания
```

Такое разделение позволяет понять, что именно нужно исправить: сам OpenAPI-документ или выполнение задания.

## Swagger UI

После успешной проверки спецификация отображается через Swagger UI.

Swagger используется здесь не как backend, а как визуальный интерфейс для просмотра получившейся OpenAPI-спецификации.

Для демонстрации API используется mock API, поэтому отдельный сервер для курса не требуется.

## Mock API

Проект содержит небольшой mock API:

```text
GET    /api/users
GET    /api/users/{id}

POST   /api/users

PUT    /api/users/{id}
PATCH  /api/users/{id}

DELETE /api/users/{id}
```

Ответы статические и предназначены для учебной демонстрации.

Отдельная база данных и настоящий backend для работы курса не нужны.

## Добавление нового урока

Уроки разделены на два типа:

```text
src/lessons/theory/
src/lessons/practice/
```

Теоретический урок содержит материал для изучения.

Практический урок дополнительно содержит начальную OpenAPI YAML-спецификацию и условия, которые проверяет validator.

После создания нового урока его необходимо добавить в:

```text
src/data/course.js
```

Порядок элементов в массиве `course` определяет порядок уроков в интерфейсе.

## Деплой

Проект публикуется через GitHub Pages.

При push в ветку `main` GitHub Actions автоматически:

1. получает исходный код;
2. устанавливает зависимости;
3. выполняет `npm run build`;
4. загружает содержимое `dist/`;
5. публикует новую версию на GitHub Pages.

Workflow находится здесь:

```text
.github/workflows/deploy.yml
```

Онлайн-версия:

https://apelsinchikov.github.io/learning/

## Разработка

Основная точка входа приложения:

```text
src/main.js
```

Основной компонент приложения:

```text
src/components/App.js
```

Описание курса:

```text
src/data/course.js
```

Проверка заданий:

```text
src/utils/validator.js
```

Mock API:

```text
src/mock/mockApi.js
```

## Для разработчиков

Проект можно свободно клонировать и использовать как основу для дальнейшего развития.

Например:

```bash
git clone https://github.com/apelsinchikov/learning.git
cd learning
npm install
npm run dev
```

Можно добавлять:

- новые уроки;
- новые проверки validator;
- новые OpenAPI-примеры;
- дополнительные API;
- новые диаграммы;
- улучшения интерфейса;
- новые механики практики.

## Лицензия

На данный момент отдельная лицензия проекта не указана.

Если проект предполагается распространять как open-source, рекомендуется добавить подходящую лицензию, например MIT, отдельным файлом `LICENSE`.