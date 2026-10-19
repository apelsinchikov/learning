## ADDED Requirements

### Requirement: Практика изменения пользователя
Практика «Update and Delete» SHALL требовать `PUT`, `PATCH` и `DELETE` для
`/users/{id}`. `PUT` и `PATCH` SHALL иметь `requestBody` с JSON-схемой; схема
для `PATCH` SHALL не содержать обязательных полей.

#### Scenario: PATCH без тела
- **WHEN** у `PATCH /users/{id}` нет `requestBody`
- **THEN** сообщение просит добавить тело запроса и объясняет, что в нём
  только изменяемые поля
