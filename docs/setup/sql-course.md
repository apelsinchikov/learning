# Курс SQL: что нужно сделать один раз

1. **Supabase.** В SQL Editor выполнить `supabase/course_state.sql`. Скрипт безопасно
   запускать повторно. Без него курс работает, но «текущий урок» не сохраняется в облаке.
2. **Пароль доступа.** Пока курс закрыт общим паролем. Хеш лежит в `src/sql/gate.js`
   (`PASSWORD_SHA256`). Новый хеш: `printf '%s' 'новый пароль' | sha256sum`.
   Это защита от случайных заходов, а не безопасность.
3. **Проверка уроков.** После правок уроков или данных отеля:
   ```
   node scripts/verify-sql-lessons.mjs --seed | psql -d hotel
   PSQL_CMD="psql -d hotel" node scripts/verify-sql-lessons.mjs
   ```
   Скрипт прогоняет решения и примеры на настоящем Postgres и сверяет число строк.
4. **Движок.** PGlite грузится с CDN jsDelivr при открытии курса (`src/sql/pgliteLoader.js`).
   Когда будет возможность, поставить `@electric-sql/pglite` в зависимости.
