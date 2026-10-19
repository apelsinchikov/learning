# Спецификация: выкладка

## Purpose
Как код попадает на сайт и что гарантирует качество.

## Requirements

### Requirement: Ветки
Работа SHALL идти через ветки `dev` → `preprod` → `main`. Прямые коммиты
в `preprod` и `main` SHALL NOT делаться.

#### Scenario: Новая правка
- **WHEN** готова новая функция
- **THEN** ветка с ней вливается PR в `dev`, затем `dev` → `preprod`,
  затем `preprod` → `main`

### Requirement: Тесты на PR
Pull request в `preprod` и в `main` SHALL запускать `npm test` в GitHub Actions
(Node 22). Влитие SHALL быть возможно только при зелёных проверках.

#### Scenario: Красный тест
- **WHEN** тест падает
- **THEN** PR не вливается до исправления

### Requirement: Автодеплой
Push в `main` SHALL запускать workflow «Deploy to GitHub Pages»: установка,
`npm test`, `npm run build`, публикация `dist`.

#### Scenario: Успешная выкладка
- **WHEN** workflow завершён
- **THEN** изменения видны на https://apelsinchikov.github.io/learning/

### Requirement: Согласование выкладки в main
Вливать в `main` SHALL только после явного согласия владельца проекта.

#### Scenario: Готовый PR
- **WHEN** PR в `main` прошёл проверки
- **THEN** он ждёт слова «go» владельца
