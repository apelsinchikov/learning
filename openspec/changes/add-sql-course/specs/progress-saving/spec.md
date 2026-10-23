## ADDED Requirements

### Requirement: Прогресс курса SQL
Прогресс курса SQL SHALL сохраняться отдельно от OpenAPI: в браузере под ключом
`sql-course-progress-v1`, а для вошедших пользователей — в Supabase
(`lesson_progress` с идентификаторами `sql-...` и `course_state`). Прогресс
OpenAPI SHALL NOT включать уроки SQL, и наоборот.

#### Scenario: Вход с накопленным прогрессом
- **WHEN** гость решил уроки SQL и входит в аккаунт
- **THEN** его прогресс сливается с облачным и отправляется в облако
