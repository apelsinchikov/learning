## ADDED Requirements

### Requirement: Допустимые значения
Курс SHALL содержать урок, где ученик описывает поле с ограниченным списком
значений через `enum`, задаёт `default` и применяет их в схеме и в параметре.

#### Scenario: Поле статуса
- **WHEN** ученик описывает поле `status`
- **THEN** он указывает `enum: [active, blocked]` и `default: active`
