/* Глава 4. Pull request: предлагаем изменения, читаем diff, вливаем и обновляем всё у себя. */

const LOGIN_REPO_FIELDS = [
    { text: "Впишите логин GitHub:", field: "login" },
    { text: "Впишите имя репозитория:", field: "repo" }
];

export const chapter4 = [
    {
        id: "git-pr",
        title: "Pull request: develop → main",
        summary: "Создаём PR вручную и читаем diff на вкладке Files changed.",
        story: `
В \`develop\` лежит ваша работа, а \`main\` ничего о ней не знает. Попасть туда она может только через pull request: просьбу влить изменения и показать их тому, кто будет проверять.
`,
        theory: [
            {
                type: "text",
                text: `
**Pull request** (PR) — страница на GitHub, где написано: «я предлагаю влить ветку A в ветку B». На ней видно, что изменилось, и там можно обсудить правки до слияния.

Два слова из интерфейса:

- **base** — куда вливаем. У нас это \`main\`;
- **compare** — откуда вливаем. У нас это \`develop\`.
`
            },
            {
                type: "web",
                title: "Создаём pull request",
                steps: [
                    "Откройте `https://github.com/{{login}}/{{repo}}` и вкладку **Pull requests**.",
                    "Нажмите **New pull request**.",
                    "Выберите **base: main** и **compare: develop**. Справа от стрелки (←) должна стоять ветка `develop`.",
                    "Нажмите **Create pull request**.",
                    "Впишите заголовок, например `Add notes.md`, а в описании коротко напишите, что изменено и зачем.",
                    "Нажмите **Create pull request** ещё раз."
                ],
                note: "Есть и короткий путь: после push на главной странице репозитория появляется жёлтая полоса **develop had recent pushes** с кнопкой **Compare & pull request**."
            },
            {
                type: "trap",
                title: "Перепутали base и compare",
                text: `
Если поменять ветки местами, GitHub предложит влить \`main\` в \`develop\`: страница покажет «There isn't anything to compare» или совсем не те изменения. Проверяйте: слева (**base**) \`main\`, справа (**compare**) \`develop\`.
`
            },
            {
                type: "why",
                title: "описание PR",
                text: `
Проверяющий видит только изменения, а не вашу голову. Пара предложений в описании («что изменено», «зачем», «где посмотреть») экономит ему время. Для аналитика сюда же идёт ссылка на задачу или на согласованные требования.
`
            },
            {
                type: "text",
                text: `
**Как читать diff.** Откройте вкладку **Files changed**: там все изменения PR.

- Зелёные строки со знаком \`+\` добавлены, красные со знаком \`−\` удалены. Строки без цвета не менялись и показаны для контекста.
- Если нажать на **+** рядом с номером строки, можно оставить комментарий именно к ней.
- Галка **Viewed** у файла отмечает, что вы его уже просмотрели.
- Переключатель вида (значок шестерёнки) меняет **Unified** (одна колонка) на **Split** (было и стало рядом).
- Кнопка **Review changes** справа вверху завершает проверку: **Comment**, **Approve** или **Request changes**. Свой PR одобрить нельзя: GitHub не даёт согласиться с самим собой.

Вкладка **Commits** показывает те же изменения по коммитам: init-коммит и два коммита с файлом.
`
            }
        ],
        task: {
            kind: "steps",
            prompt: "Создайте PR и разберитесь в diff.",
            items: [
                ...LOGIN_REPO_FIELDS,
                { text: "Создайте pull request: **base: main**, **compare: develop**, с заголовком и описанием." },
                { text: "Откройте вкладку **Files changed**: найдите файл `notes.md` и зелёные строки с `+`." },
                { text: "Откройте вкладку **Commits**: там три коммита (init и два коммита с файлом)." }
            ],
            afterwards: "PR создан и прочитан. Остаётся влить его."
        },
        cheat: [
            ["base ← compare", "куда вливаем ← откуда вливаем"],
            ["Files changed", "вкладка PR с изменениями"],
            ["+ зелёное / − красное", "добавлено / удалено"]
        ]
    },

    {
        id: "git-merge",
        title: "Слияние и обновление у себя",
        summary: "Вливаем PR, не удаляем develop и обновляем main и develop на компьютере.",
        story: `
PR прочитан и принят. Остался последний шаг: слить ветки. После него у вас на GitHub всё обновится, а на компьютере нужно подтянуть изменения.
`,
        theory: [
            {
                type: "web",
                title: "Вливаем pull request",
                steps: [
                    "Откройте свой PR на вкладке **Conversation**.",
                    "Рядом с зелёной кнопкой **Merge pull request** есть стрелка вниз: там способ слияния. Оставьте **Create a merge commit**.",
                    "Нажмите **Merge pull request**, затем **Confirm merge**.",
                    "GitHub напишет «Pull request successfully merged and closed»."
                ]
            },
            {
                type: "text",
                text: `
Три способа слияния:

- **Create a merge commit** — все коммиты ветки сохраняются и добавляется один «коммит слияния». История полная;
- **Squash and merge** — все коммиты склеиваются в один. История аккуратнее, но подробности теряются;
- **Rebase and merge** — коммиты переносятся в \`main\` по одному, без коммита слияния.

Для нашей схемы с постоянной веткой \`develop\` подходит первый способ. Остальные нужны, когда вы создаёте новую ветку под каждую задачу.
`
            },
            {
                type: "trap",
                title: "Кнопка «Delete branch»",
                text: `
После слияния GitHub предложит кнопку **Delete branch**. **Не нажимайте.** \`develop\` у нас постоянная рабочая ветка, она нужна и дальше. Удаляют ветки, которые создавали под одну задачу.
`
            },
            {
                type: "text",
                text: `
**Обновляем компьютер.** На GitHub в \`main\` теперь новый коммит слияния, а у вас на компьютере его нет. Заберём:

- переходим в \`main\` и делаем \`git pull\`;
- переходим обратно в \`develop\` и вливаем в него \`main\`, чтобы обе ветки снова совпадали. Иначе следующий PR покажет лишнее.
`
            },
            {
                type: "cmd",
                title: "Обновляем main",
                lines: ["git switch main", "git pull"],
                output: "Switched to branch 'main'\nYour branch is up to date with 'origin/main'.\nUpdating 9f8e7d6..b1c2d3e\nFast-forward\n notes.md | 2 ++\n 1 file changed, 2 insertions(+)\n create mode 100644 notes.md",
                note: "Теперь у вас в `main` есть `notes.md`. «Fast-forward» значит, что git просто подвинул вашу ветку вперёд, ничего не склеивая."
            },
            {
                type: "cmd",
                title: "Выравниваем develop",
                lines: ["git switch develop", "git merge main", "git push"],
                output: "Switched to branch 'develop'\nUpdating 7a8b9c0..b1c2d3e\nFast-forward\nTo https://github.com/{{login}}/{{repo}}.git\n   7a8b9c0..b1c2d3e  develop -> develop",
                note: "`git merge main` вливает `main` в текущую ветку. Строки в выводе будут немного отличаться. Главное, что `develop` и `main` снова совпали, а `git push` отправил это на GitHub."
            },
            {
                type: "text",
                only: "vscode",
                text: `
Сделать то же в VS Code можно так:

- смените ветку на **main** (левый нижний угол) и нажмите **Sync Changes**;
- смените ветку на **develop**, откройте палитру команд ([[key:mod+shift+p]]), выберите **Git: Merge Branch…** и ветку **main**;
- нажмите **Sync Changes**, чтобы отправить результат.
`
            }
        ],
        task: {
            kind: "steps",
            prompt: "Влейте PR и обновите компьютер.",
            items: [
                { text: "Влейте PR: **Merge pull request** → **Confirm merge** (способ **Create a merge commit**)." },
                { text: "Ветку `develop` не удаляйте." },
                {
                    text: "Обновите main на компьютере: `git switch main` и `git pull`.",
                    check: {
                        prompt: "Вставьте вывод `git pull`:",
                        patterns: [
                            {
                                re: "(Fast-forward|Updating|Обновление|Already up to date|Уже актуально)",
                                hint: "Не вижу ответа git pull. Выполните его, находясь в ветке main.",
                                samples: ["Updating 9f8e7d6..b1c2d3e\nFast-forward\n notes.md | 2 ++", "Обновление 9f8e7d6..b1c2d3e\nFast-forward\n notes.md | 2 ++"]
                            }
                        ]
                    }
                },
                {
                    text: "Выровняйте develop: `git switch develop`, `git merge main`, `git push`.",
                    check: {
                        prompt: "Вставьте вывод `git merge main`:",
                        patterns: [
                            {
                                re: "(Fast-forward|Already up to date|Уже актуально)",
                                hint: "Не вижу результата слияния. Выполните `git merge main`, находясь в ветке develop.",
                                samples: ["Updating 7a8b9c0..b1c2d3e\nFast-forward", "Already up to date."]
                            }
                        ]
                    }
                },
                { text: "Откройте GitHub: в ветке `main` теперь есть файл `notes.md`." }
            ],
            afterwards: "Работа дошла до `main` через проверку. Вы прошли путь целиком."
        },
        cheat: [
            ["Merge pull request", "влить PR"],
            ["git merge <ветка>", "влить ветку в текущую"],
            ["git switch main; git pull", "обновить main у себя"]
        ]
    }
];
