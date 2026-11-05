/* Глава 3. Работа на компьютере: клонируем, переходим в develop, коммитим, отправляем. */

export const chapter3 = [
    {
        id: "git-clone",
        title: "Клонируем проект",
        summary: "Копия репозитория на компьютере: clone, remote, status.",
        story: `
Проект лежит на GitHub, а работать вы будете у себя. Нужно скачать его на компьютер вместе со всей историей и связью с GitHub.
`,
        theory: [
            {
                type: "text",
                text: `
**Клонирование** создаёт на компьютере папку с проектом: файлы, вся история и ссылка на репозиторий на GitHub. Эта ссылка называется **remote**, а её имя по умолчанию — \`origin\`.

Внутри папки появляется скрытая папка \`.git\`: в ней живёт история. **Не удаляйте её и не правьте вручную.** Если удалить \`.git\`, останется обычная папка без истории.
`
            },
            {
                type: "how",
                terminal: [
                    {
                        type: "text",
                        text: "Сначала выберем место для проектов: папка `projects` в вашей домашней папке. Потом склонируем репозиторий в неё."
                    },
                    {
                        type: "cmd",
                        title: "Клонируем",
                        lines: ["mkdir -p ~/projects", "cd ~/projects", "git clone https://github.com/{{login}}/{{repo}}.git", "cd {{repo}}"],
                        output: "Cloning into '{{repo}}'...\nremote: Enumerating objects: 3, done.\nremote: Counting objects: 100% (3/3), done.\nremote: Total 3 (delta 0), reused 0 (delta 0), pack-reused 0\nReceiving objects: 100% (3/3), done.",
                        note: "`cd` — перейти в папку. После последней команды вы внутри проекта."
                    }
                ],
                vscode: [
                    {
                        type: "text",
                        text: `
- Откройте палитру команд: [[key:mod+shift+p]].
- Введите \`Git: Clone\` и выберите эту команду.
- Вставьте адрес \`https://github.com/{{login}}/{{repo}}.git\` и нажмите Enter.
- Выберите папку, куда положить проект (например, создайте \`projects\` в домашней папке).
- Когда VS Code спросит «Would you like to open the cloned repository?», нажмите **Open**.

Откроется проект. Если VS Code попросит войти в GitHub, согласитесь и подтвердите вход в браузере.
`
                    },
                    {
                        type: "text",
                        text: "Команды ниже можно выполнять в терминале VS Code: откройте его через [[key:ctrl+backtick]]. Он уже стоит в папке проекта."
                    }
                ]
            },
            {
                type: "cmd",
                title: "Смотрим, что скачалось",
                lines: ["ls -a", "git remote -v", "git status"],
                output: ".  ..  .git  README.md\norigin  https://github.com/{{login}}/{{repo}}.git (fetch)\norigin  https://github.com/{{login}}/{{repo}}.git (push)\nOn branch main\nYour branch is up to date with 'origin/main'.\n\nnothing to commit, working tree clean",
                note: "`ls -a` показывает и скрытые файлы, поэтому видна папка `.git`. `git remote -v` — адрес, куда git отправляет и откуда забирает. `git status` — главная команда: что сейчас происходит в проекте."
            },
            {
                type: "text",
                text: `
Как читать \`git status\`:

- \`On branch main\` — вы в ветке main;
- \`Your branch is up to date with 'origin/main'\` — у вас столько же коммитов, сколько на GitHub;
- \`nothing to commit, working tree clean\` — файлы не менялись.

Почему вы на \`main\`, хотя ветка \`develop\` тоже есть? После клонирования git открывает ветку по умолчанию. Работать в ней мы не будем: переключимся на \`develop\` в следующем уроке.
`
            },
            {
                type: "trap",
                title: "Команды не находят проект",
                text: `
Если git пишет \`fatal: not a git repository\`, значит, вы не в папке проекта. Выполните \`cd ~/projects/{{repo}}\` или откройте папку проекта в VS Code.
`
            }
        ],
        task: {
            kind: "steps",
            prompt: "Склонируйте проект и проверьте результат.",
            items: [
                { text: "Впишите логин GitHub:", field: "login" },
                { text: "Впишите имя репозитория:", field: "repo" },
                {
                    text: "Склонируйте репозиторий (терминал или VS Code).",
                    check: {
                        prompt: "Через терминал: вставьте вывод `git clone`. Через VS Code отметьте шаг вручную.",
                        patterns: [
                            {
                                re: "(Cloning into|Клонирование в).*{{repo}}",
                                hint: "Не вижу строку «Cloning into ...» с именем вашего репозитория.",
                                samples: ["Cloning into '{{repo}}'...\nReceiving objects: 100% (3/3), done.", "Клонирование в «{{repo}}»...\nПолучение объектов: 100% (3/3), готово."]
                            }
                        ]
                    }
                },
                {
                    text: "Проверьте связь с GitHub: `git remote -v`.",
                    check: {
                        prompt: "Вставьте вывод `git remote -v`:",
                        patterns: [
                            {
                                re: "origin\\s+https://github\\.com/{{login}}/{{repo}}(\\.git)?\\s+\\(fetch\\)",
                                hint: "Не вижу строку origin с адресом вашего репозитория и (fetch).",
                                samples: ["origin  https://github.com/{{login}}/{{repo}}.git (fetch)\norigin  https://github.com/{{login}}/{{repo}}.git (push)"]
                            }
                        ]
                    }
                },
                {
                    text: "Посмотрите состояние: `git status`.",
                    check: {
                        prompt: "Вставьте вывод `git status`:",
                        patterns: [
                            {
                                re: "(On branch|На ветке) main",
                                hint: "Не вижу «On branch main».",
                                samples: ["On branch main\nYour branch is up to date with 'origin/main'.\n\nnothing to commit, working tree clean", "На ветке main\nВаша ветка совпадает с «origin/main».\n\nнечего коммитить, нет изменений в рабочем каталоге"]
                            }
                        ]
                    }
                }
            ],
            afterwards: "Проект на вашем компьютере. Дальше переходим в `develop` и делаем первый коммит."
        },
        cheat: [
            ["git clone <адрес>", "скачать репозиторий на компьютер"],
            ["git status", "что сейчас в проекте: ветка, изменения"],
            ["git remote -v", "куда git отправляет изменения"],
            ["cd <папка>", "перейти в папку"],
            ["ls -a", "список файлов, включая скрытые"]
        ]
    },

    {
        id: "git-first-commit",
        title: "Ветка develop и первый коммит",
        summary: "Переходим в develop, делаем init-коммит и забираем свежее (pull).",
        story: `
Все ваши изменения будут идти через \`develop\`. Перейдём в неё и сделаем первый, «init-коммит»: отметку о начале работы. Потом заберём свежие изменения с GitHub.
`,
        theory: [
            {
                type: "how",
                terminal: [
                    {
                        type: "cmd",
                        title: "Переходим в develop",
                        lines: ["git switch develop", "git status"],
                        output: "branch 'develop' set up to track 'origin/develop'.\nSwitched to a new branch 'develop'\nOn branch develop\nYour branch is up to date with 'origin/develop'.\n\nnothing to commit, working tree clean",
                        note: "Команда создала у вас ветку `develop` и связала её с `origin/develop` на GitHub: так git знает, куда отправлять."
                    }
                ],
                vscode: [
                    {
                        type: "text",
                        text: `
- Нажмите на название ветки в левом нижнем углу окна (там написано \`main\`).
- В списке сверху выберите **origin/develop**.

Название ветки в левом нижнем углу сменится на \`develop\`.
`
                    }
                ]
            },
            {
                type: "why",
                title: "init-коммит",
                text: `
**Init-коммит** — самый первый коммит в работе, пустой: файлов он не меняет. Он нужен, чтобы:

- поставить точку отсчёта: «с этого места начинается моя работа»;
- проверить, что git знает ваше имя и почту: коммит подпишется ими;
- убедиться, что всё настроено, прежде чем менять настоящие файлы.

Пустой коммит делается флагом \`--allow-empty\`. Обычно git не создаёт коммит, если ничего не изменилось.
`
            },
            {
                type: "cmd",
                title: "Делаем init-коммит",
                lines: ['git commit --allow-empty -m "init: start work in develop"', "git log --oneline"],
                output: "[develop 4a5b6c7] init: start work in develop\n4a5b6c7 (HEAD -> develop) init: start work in develop\n9f8e7d6 (origin/main, origin/develop, origin/HEAD, main) Initial commit",
                outputNote: "Набор символов вместо `4a5b6c7` у вас будет другой: это номер коммита.",
                note: "`-m` — сообщение коммита: что вы сделали. Пишите коротко и по делу. `git log --oneline` — история, по одной строке на коммит."
            },
            {
                type: "text",
                only: "vscode",
                text: "В интерфейсе VS Code пустой коммит не сделать: нечего добавлять в коммит. Выполните команду выше в терминале VS Code ([[key:ctrl+backtick]])."
            },
            {
                type: "text",
                text: "Теперь **pull**: забрать свежие изменения с GitHub. Привычка: начинать работу с `git pull`, чтобы не писать поверх устаревших файлов."
            },
            {
                type: "how",
                terminal: [
                    {
                        type: "cmd",
                        title: "Забираем изменения",
                        lines: ["git pull", "git status"],
                        output: "Already up to date.\nOn branch develop\nYour branch is ahead of 'origin/develop' by 1 commit.\n  (use \"git push\" to publish your local commits)\n\nnothing to commit, working tree clean",
                        note: "Сейчас на GitHub ничего нового, поэтому `git pull` отвечает «Already up to date». А `status` говорит: ваша ветка опережает GitHub на один коммит. Это ваш init-коммит, он пока только у вас. Мы отправим его на GitHub в следующем уроке."
                    }
                ],
                vscode: [
                    {
                        type: "text",
                        text: `
- Откройте панель **Source Control**: [[key:ctrl+shift+g]].
- Нажмите на три точки **…** вверху панели и выберите **Pull**.

В левом нижнем углу рядом с названием ветки появится стрелка вверх с цифрой 1: это один коммит, который ещё не отправлен.
`
                    }
                ]
            },
            {
                type: "text",
                text: "`git pull` на самом деле делает два шага: скачивает новое с GitHub (**fetch**) и вливает его в вашу ветку (**merge**). Об этом мы ещё поговорим, когда понадобится."
            }
        ],
        task: {
            kind: "steps",
            prompt: "Перейдите в develop, сделайте init-коммит и сделайте pull.",
            items: [
                {
                    text: "Перейдите на ветку `develop`.",
                    check: {
                        prompt: "Вставьте вывод `git status`:",
                        patterns: [
                            {
                                re: "(On branch|На ветке) develop",
                                hint: "Не вижу «On branch develop»: вы пока не в ветке develop.",
                                samples: ["On branch develop\nYour branch is up to date with 'origin/develop'.", "На ветке develop\nВаша ветка совпадает с «origin/develop»."]
                            }
                        ]
                    }
                },
                {
                    text: "Сделайте init-коммит: `git commit --allow-empty -m \"init: start work in develop\"`.",
                    check: {
                        prompt: "Вставьте вывод команды `git commit`:",
                        patterns: [
                            {
                                re: "\\[develop (\\(root-commit\\) )?[0-9a-f]{7,}\\]\\s+init",
                                hint: "Не вижу строку вида «[develop 4a5b6c7] init: ...».",
                                samples: ["[develop 4a5b6c7] init: start work in develop"]
                            }
                        ]
                    }
                },
                {
                    text: "Выполните `git pull`.",
                    check: {
                        prompt: "Вставьте вывод `git pull`:",
                        patterns: [
                            {
                                re: "(Already up to date|Уже актуально|Fast-forward|Updating|Обновление)",
                                hint: "Не вижу ответа git pull («Already up to date» или «Fast-forward»).",
                                samples: ["Already up to date.", "Уже актуально."]
                            }
                        ]
                    }
                }
            ],
            afterwards: "Вы в `develop`, init-коммит сделан, всё свежее. Теперь сделаем настоящую работу."
        },
        cheat: [
            ["git switch <ветка>", "перейти в другую ветку"],
            ["git commit --allow-empty -m \"текст\"", "пустой коммит (отметка о начале)"],
            ["git log --oneline", "история коротко"],
            ["git pull", "забрать свежее с GitHub"]
        ]
    },

    {
        id: "git-add-commit-push",
        title: "Файл, add, commit, push",
        summary: "Меняем проект и отправляем изменения в develop.",
        story: `
Пора поработать: создать файл, зафиксировать и отправить его на GitHub. Так выглядит каждый рабочий день: правка → проверка → коммит → отправка.
`,
        theory: [
            {
                type: "text",
                text: `
Путь изменения состоит из шагов:

- вы правите файл;
- **git add** отмечает, какие изменения войдут в коммит;
- **git commit** сохраняет отмеченное в историю;
- **git push** отправляет коммиты на GitHub.

Зачем отдельный \`add\`? Вы можете изменить десять файлов, а в коммит включить только два, которые относятся к одной задаче. Подготовленные для коммита файлы называют «в индексе» или staged.
`
            },
            {
                type: "how",
                terminal: [
                    {
                        type: "cmd",
                        title: "Создаём файл и смотрим состояние",
                        lines: ['echo "# My first note" > notes.md', "git status"],
                        output: "On branch develop\nYour branch is ahead of 'origin/develop' by 1 commit.\n\nUntracked files:\n  (use \"git add <file>...\" to include in what will be committed)\n\tnotes.md\n\nnothing added to commit but untracked files present (use \"git add\" to track)",
                        note: "`echo \"...\" > notes.md` создаёт файл `notes.md` с одной строкой. Git пока не следит за этим файлом: он «Untracked»."
                    }
                ],
                vscode: [
                    {
                        type: "text",
                        text: `
- Откройте проводник: [[key:mod+shift+e]].
- Нажмите значок **New File** и назовите файл \`notes.md\`.
- Впишите строку \`# My first note\` и сохраните файл: [[key:mod+s]].

Откройте **Source Control** ([[key:ctrl+shift+g]]): файл \`notes.md\` появился в списке изменений с буквой **U** (untracked).
`
                    }
                ]
            },
            {
                type: "how",
                terminal: [
                    {
                        type: "cmd",
                        title: "add и commit",
                        lines: ["git add notes.md", "git status", 'git commit -m "docs: add notes.md"'],
                        output: "On branch develop\nChanges to be committed:\n  (use \"git restore --staged <file>...\" to unstage)\n\tnew file:   notes.md\n\n[develop 3c4d5e6] docs: add notes.md\n 1 file changed, 1 insertion(+)\n create mode 100644 notes.md",
                        note: "После `add` статус показывает «Changes to be committed»: файл в индексе. `commit` сохраняет его в историю."
                    }
                ],
                vscode: [
                    {
                        type: "text",
                        text: `
- В **Source Control** наведите курсор на \`notes.md\` и нажмите **+** (**Stage Changes**). Файл переедет в блок **Staged Changes**.
- Впишите в поле **Message** сообщение \`docs: add notes.md\`.
- Нажмите **Commit** или [[key:mod+enter]] в поле сообщения.
`
                    }
                ]
            },
            {
                type: "text",
                text: `
**Правка и diff.** Допишем файл и посмотрим, что именно изменилось. Команда \`git diff\` показывает разницу между тем, что в последнем коммите, и тем, что у вас сейчас.
`
            },
            {
                type: "how",
                terminal: [
                    {
                        type: "cmd",
                        title: "Правим и смотрим diff",
                        lines: ['echo "Second line" >> notes.md', "git diff"],
                        output: "diff --git a/notes.md b/notes.md\nindex 1234567..89abcde 100644\n--- a/notes.md\n+++ b/notes.md\n@@ -1 +1,2 @@\n # My first note\n+Second line",
                        note: "`>>` дописывает строку в конец файла. В diff строка с `+` добавлена, строка с `-` удалена, строка без знака не менялась. Если вывод не помещается, git откроет его постранично: листайте пробелом, выйдите клавишей `q`."
                    }
                ],
                vscode: [
                    {
                        type: "text",
                        text: `
- Откройте \`notes.md\`, допишите строку \`Second line\` и сохраните файл ([[key:mod+s]]).
- В **Source Control** нажмите на файл \`notes.md\`: откроется сравнение «было / стало». Добавленные строки подсвечены зелёным, удалённые красным.
`
                    }
                ]
            },
            {
                type: "os",
                only: "terminal",
                mac: [
                    {
                        type: "important",
                        title: "Первый push: вход в GitHub",
                        text: `
При первом \`git push\` git спросит логин и пароль. Вместо пароля от аккаунта вводится **токен доступа**: GitHub не принимает пароли в git. Токен создаётся один раз.

Токен — тот же пароль. Никому его не показывайте, не пишите в файлы проекта и в чаты. Если он утёк, откройте тот же список токенов и нажмите **Delete**.
`
                    },
                    {
                        type: "web",
                        title: "Создаём токен",
                        steps: [
                            "Нажмите на аватар справа вверху → **Settings**.",
                            "Слева внизу откройте **Developer settings** → **Personal access tokens** → **Tokens (classic)**.",
                            "Нажмите **Generate new token** → **Generate new token (classic)**.",
                            "В **Note** впишите `git-practice`. В **Expiration** выберите срок покороче, например 30 days. Отметьте галочку **repo**.",
                            "Нажмите **Generate token** и сразу скопируйте токен: потом GitHub его не покажет."
                        ]
                    },
                    {
                        type: "cmd",
                        title: "Что спросит git при push",
                        lines: ["git push"],
                        output: "Username for 'https://github.com': {{login}}\nPassword for 'https://{{login}}@github.com': ",
                        note: "В **Username** впишите логин, в **Password** вставьте токен. При вводе пароля символы не видны: это нормально. После успешного входа macOS запомнит токен в связке ключей, и вводить его снова не придётся."
                    }
                ],
                windows: [
                    {
                        type: "important",
                        title: "Первый push: вход в GitHub",
                        text: `
При первом \`git push\` откроется окно **Git Credential Manager** (он ставится вместе с git). Нажмите **Sign in with your browser**, в браузере войдите в GitHub и подтвердите вход (**Authorize**). Окно закроется, push продолжится. Больше входить не придётся: Windows запомнит вход.
`
                    }
                ]
            },
            {
                type: "trap",
                only: "terminal",
                title: "«Authentication failed»",
                text: `
Если push отвечает \`Authentication failed\` или \`Support for password authentication was removed\`, вы ввели пароль от аккаунта. Нужен токен (Mac) или вход через браузер (Windows). Повторите \`git push\`.
`
            },
            {
                type: "os",
                only: "terminal",
                mac: [
                    {
                        type: "important",
                        title: "Потерялся токен",
                        text: `
GitHub показывает токен один раз, потом его не вытащить. Если git снова просит пароль, а токена нет, не страшно: выпускаем новый и стираем старый.

- Если git при push **спрашивает пароль**, а токена у вас нет: сделайте новый токен (шаги ниже) и вставьте его.
- Если git **молча отвечает «Authentication failed»**: он подставляет старый, сохранённый токен, который уже не работает (удалён или истёк). Сначала сотрите сохранённый вход, потом сделайте новый токен.
`
                    },
                    {
                        type: "web",
                        title: "Выпускаем новый токен",
                        steps: [
                            "Откройте **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**.",
                            "Старый токен найдите в списке и нажмите **Delete**: пока он существует, он действует, хоть вы его и потеряли.",
                            "Нажмите **Generate new token** → **Generate new token (classic)**, снова отметьте **repo**, выберите срок и нажмите **Generate token**.",
                            "Скопируйте новый токен сразу: второй раз GitHub его не покажет."
                        ],
                        note: "Если старый токен ещё не удалён и не истёк, можно открыть его в списке и нажать **Regenerate token**: GitHub выпустит новое значение с теми же правами."
                    },
                    {
                        type: "cmd",
                        title: "Стираем сохранённый вход и входим заново",
                        lines: ['printf "protocol=https\\nhost=github.com\\n\\n" | git credential reject', "git push"],
                        output: "Username for 'https://github.com': {{login}}\nPassword for 'https://{{login}}@github.com': ",
                        note: "Первая команда ничего не выводит: она просто удаляет сохранённый вход для github.com из связки ключей. После `git push` введите логин и **новый токен**. Его снова запомнит связка ключей."
                    },
                    {
                        type: "text",
                        text: "Вместо команды можно открыть программу **Keychain Access**, найти запись `github.com` и удалить её."
                    }
                ],
                windows: [
                    {
                        type: "important",
                        title: "Вход не получился или сломался",
                        text: `
Токен на Windows вводить не нужно, но сохранённый вход тоже может устареть. Сотрите его и войдите заново: выполните команду ниже, потом \`git push\`, и снова откроется окно входа через браузер. То же можно сделать в **Credential Manager** (Диспетчер учётных данных) → **Windows Credentials**: найдите \`git:https://github.com\` и нажмите **Remove**.
`
                    },
                    {
                        type: "cmd",
                        title: "Стираем сохранённый вход",
                        lines: ['printf "protocol=https\\nhost=github.com\\n\\n" | git credential reject', "git push"],
                        note: "Первая команда ничего не выводит. Выполняйте её в Git Bash."
                    }
                ]
            },
            {
                type: "how",
                terminal: [
                    {
                        type: "cmd",
                        title: "Второй коммит и push",
                        lines: ["git add notes.md", 'git commit -m "docs: update notes.md"', "git push"],
                        output: "[develop 7a8b9c0] docs: update notes.md\n 1 file changed, 1 insertion(+)\nEnumerating objects: 8, done.\nCounting objects: 100% (8/8), done.\nWriting objects: 100% (7/7), 654 bytes | 654.00 KiB/s, done.\nTotal 7 (delta 0), reused 0 (delta 0), pack-reused 0\nTo https://github.com/{{login}}/{{repo}}.git\n   9f8e7d6..7a8b9c0  develop -> develop",
                        note: "Строка `develop -> develop` значит: ваша ветка develop отправлена в ветку develop на GitHub."
                    }
                ],
                vscode: [
                    {
                        type: "text",
                        text: `
- Отметьте файл (**+**), впишите сообщение \`docs: update notes.md\` и нажмите **Commit**.
- Отправьте коммиты: нажмите **…** в панели Source Control → **Push**. Можно и кнопку **Sync Changes**: она сделает pull, а потом push.
`
                    }
                ]
            },
            {
                type: "web",
                title: "Проверяем на GitHub",
                steps: [
                    "Откройте `https://github.com/{{login}}/{{repo}}`.",
                    "Выберите ветку **develop** в выпадающем списке. В ней должен лежать файл `notes.md`.",
                    "Над списком файлов нажмите на число коммитов (**3 Commits**): вы увидите init-коммит и два коммита с файлом."
                ]
            },
            {
                type: "important",
                title: "Проверяем защиту main",
                text: `
Теперь проверим, что защита работает: попробуем записать в \`main\` напрямую. Эта команда должна **провалиться**.

Если она вдруг **прошла**, защита не работает (вернитесь к уроку 6, обычно не включён пункт **Do not allow bypassing the above settings**). Тогда \`main\` уже обновился, и pull request в следующем уроке получится пустым: сделайте в \`develop\` ещё один коммит с правкой \`notes.md\` и отправьте его.
`
            },
            {
                type: "cmd",
                title: "Пробуем записать в main",
                lines: ["git push origin develop:main"],
                output: "remote: error: GH006: Protected branch update failed for refs/heads/main.\nremote: error: Changes must be made through a pull request.\nTo https://github.com/{{login}}/{{repo}}.git\n ! [remote rejected] develop -> main (protected branch hook declined)\nerror: failed to push some refs to 'https://github.com/{{login}}/{{repo}}.git'",
                note: "`develop:main` значит «отправь мою develop в ветку main». GitHub отказал: ветка защищена, изменения принимаются только через pull request."
            }
        ],
        task: {
            kind: "steps",
            prompt: "Пройдите весь путь изменения.",
            items: [
                { text: "Создайте файл `notes.md`." },
                {
                    text: "Выполните `git status`: файл должен быть в списке «Untracked files».",
                    check: {
                        prompt: "Вставьте вывод `git status`:",
                        patterns: [
                            {
                                re: "(Untracked files|Неотслеживаемые файлы)[\\s\\S]*notes\\.md",
                                hint: "Не вижу notes.md в списке неотслеживаемых файлов. Файл создан в папке проекта?",
                                samples: ["On branch develop\n\nUntracked files:\n\tnotes.md\n", "На ветке develop\n\nНеотслеживаемые файлы:\n\tnotes.md\n"]
                            }
                        ]
                    }
                },
                {
                    text: "Добавьте файл и сделайте коммит `docs: add notes.md`.",
                    check: {
                        prompt: "Вставьте вывод `git commit`:",
                        patterns: [
                            {
                                re: "\\[develop [0-9a-f]{7,}\\]\\s+docs: add notes\\.md",
                                hint: "Не вижу строку «[develop ...] docs: add notes.md».",
                                samples: ["[develop 3c4d5e6] docs: add notes.md\n 1 file changed, 1 insertion(+)"]
                            }
                        ]
                    }
                },
                { text: "Допишите строку в `notes.md` и посмотрите `git diff` (в VS Code — сравнение файла)." },
                {
                    text: "Сделайте второй коммит `docs: update notes.md`.",
                    check: {
                        prompt: "Вставьте вывод второго `git commit`:",
                        patterns: [
                            {
                                re: "\\[develop [0-9a-f]{7,}\\]\\s+docs: update notes\\.md",
                                hint: "Не вижу строку «[develop ...] docs: update notes.md».",
                                samples: ["[develop 7a8b9c0] docs: update notes.md"]
                            }
                        ]
                    }
                },
                {
                    text: "Отправьте изменения на GitHub: `git push`. При первом push git попросит войти.",
                    check: {
                        prompt: "Вставьте вывод `git push` (в VS Code отметьте вручную):",
                        patterns: [
                            {
                                re: "develop\\s*->\\s*develop",
                                hint: "Не вижу строку «develop -> develop».",
                                samples: ["To https://github.com/{{login}}/{{repo}}.git\n   9f8e7d6..7a8b9c0  develop -> develop"]
                            }
                        ]
                    }
                },
                {
                    text: "Проверьте защиту: `git push origin develop:main` должен завершиться отказом.",
                    check: {
                        prompt: "Вставьте вывод этой команды:",
                        patterns: [
                            {
                                re: "(GH006|protected branch|защищённ)",
                                hint: "Не вижу отказа GH006 (protected branch). Если push прошёл, защита main не работает: вернитесь к уроку 6.",
                                samples: ["remote: error: GH006: Protected branch update failed for refs/heads/main.\nremote: error: Changes must be made through a pull request."]
                            }
                        ]
                    }
                },
                { text: "Откройте GitHub: в ветке `develop` лежит `notes.md`, а в `main` его нет." }
            ],
            afterwards: "Изменения лежат в `develop` на GitHub, а `main` защищён. Остался pull request."
        },
        cheat: [
            ["git add <файл>", "отметить файл для коммита"],
            ["git commit -m \"текст\"", "сохранить отмеченное в историю"],
            ["git diff", "что изменилось в файлах"],
            ["git push", "отправить коммиты на GitHub"],
            ["git push origin develop:main", "проверка защиты: должен быть отказ"],
            ["git credential reject", "забыть сохранённый вход (если токен потерян или устарел)"]
        ]
    }
];
