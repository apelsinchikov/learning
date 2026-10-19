# Правила для Claude в этом репозитории

- Коммиты делаются от имени владельца проекта: автор `apelsinchikov`
  (`git config user.name "apelsinchikov"`,
  `git config user.email "72drr6dftw@privaterelay.appleid.com"`).
  Автором не должен быть `Claude`.
- В сообщения коммитов и в описания PR НЕ добавлять `Co-Authored-By: Claude`,
  `Claude-Session` и «Generated with Claude Code».
- В `main` вливать только после явного «go» владельца.
- Порядок веток: feature → `dev` → `preprod` → `main`.
- Остальные правила проекта: `openspec/project.md`.
