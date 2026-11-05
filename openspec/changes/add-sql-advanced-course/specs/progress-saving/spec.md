## MODIFIED Requirements

### Requirement: Прогресс нескольких курсов
Прогресс курса «SQL Advanced» SHALL храниться отдельно: локально под своим
ключом, в облаке в `lesson_progress` с префиксом `sqa-` и в `course_state` с
`course_id='sql-advanced'`. Курсы OpenAPI, SQL и «Диаграммы» SHALL игнорировать
уроки с чужими префиксами.

#### Scenario: Вход с прогрессом в нескольких курсах
- **WHEN** пользователь входит, у него есть прогресс в SQL и в «SQL Advanced»
- **THEN** каждый курс загружает только свои уроки
