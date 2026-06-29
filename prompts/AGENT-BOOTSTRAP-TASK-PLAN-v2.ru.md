# ПРОМПТ ДЛЯ АГЕНТА: СДЕЛАЙ ФОРК ИЛИ УСТАНОВИ TASK-PLAN v2

Используй этот промпт для Codex, Claude Code, Gemini, GLM, Kimi, GitHub Copilot, Qwen, DeepSeek или другого coding agent.

## Миссия

Сделай форк `TASK-PLAN v2` package или установи его в целевой репозиторий, чтобы в итоге в целевом репозитории были:

- `FEATURE-PREPARATION.md`
- `TASK-PLAN.md`
- переиспользуемые planning templates
- при необходимости docs, prompts, examples и dashboard extension

## Поддерживаемые режимы установки

- `standalone-fork`
  Пользователю нужен отдельный planning-репозиторий на базе этого пакета.
- `in-repo-bootstrap`
  Пользователю нужно встроить систему в существующий продуктовый репозиторий, не заменяя сам код продукта.

## Обязательные входные данные

Не додумывай их. Если чего-то не хватает, верни `INVALID_INPUT` и перечисли, чего именно не хватает.

- `source_package`
  URL репозитория или локальный путь к этому пакету.
- `install_mode`
  `standalone-fork` или `in-repo-bootstrap`.
- `target_repository`
  GitHub URL и/или локальный путь целевого репозитория.
- `install_scope`
  `core`, `core+docs`, `core+docs+prompts` или `full`.
- `default_docs_language`
  `en`, `ru` или `both`.
- `branch_name`
  Имя ветки для bootstrap-работы.
- `push_expected`
  `true` или `false`.
- `pr_expected`
  `true` или `false`.
- `github_auth_available`
  `true` или `false`.

## Что обязательно прочитать до любых изменений

Сначала прочитай эти файлы из пакета:

- `examples/agent-bootstrap/FEATURE-PREPARATION.md`
- `examples/agent-bootstrap/TASK-PLAN.md`
- `templates/FEATURE-PREPARATION-CHECKLIST.md`
- `templates/TASK-PLAN-v2.template.md`
- `templates/CLAUDE-CODE.tasks-projection.md`
- `templates/IMPLEMENTATION-PLAN.runtime.md`
- `docs/en/TASKS-GENERAL-INSTRUCTIONS.md`

Если выбран scope с dashboard, дополнительно прочитай:

- `extension/task-plan-dashboard/README.md`
- `extension/task-plan-dashboard/package.json`

## Правила выполнения

- Используй `examples/agent-bootstrap/TASK-PLAN.md` как канонический control document для bootstrap-работы.
- Создай или обнови в целевом репозитории `FEATURE-PREPARATION.md` и `TASK-PLAN.md` с реальными фактами именно про этот репозиторий.
- Markdown остается source of truth.
- Используй последовательную цепочку handoff по каждой задаче: `planner -> implementer -> reviewer -> tester -> docs_sync`.
- Никаких тихих mock.
- Никаких тихих placeholder.
- Не выдумывай forks, remotes, branches, commits, pushes, pull requests, approvals или passing checks.
- Не перезаписывай чужой код и не трогай несвязанные dirty files в целевом репозитории.
- Если пользователь просит fork, push или PR, а GitHub auth недоступен, верни `INVALID_INPUT`, а не фейковый успех.

## Контракт по scope

`core` должен установить:

- root `FEATURE-PREPARATION.md`
- root `TASK-PLAN.md`
- `templates/FEATURE-PREPARATION-CHECKLIST.md`
- `templates/TASK-PLAN-v2.template.md`
- `templates/CLAUDE-CODE.tasks-projection.md`
- `templates/IMPLEMENTATION-PLAN.runtime.md`

`core+docs` дополнительно ставит:

- `docs/en/`
- `docs/ru/`
- `docs/reference/` если это релевантно

`core+docs+prompts` дополнительно ставит:

- все перечисленное выше
- `prompts/`

`full` дополнительно ставит:

- все перечисленное выше
- `extension/task-plan-dashboard/`
- `examples/demo-en/`
- `examples/demo-ru/`
- выбранные файлы из `media/`, только если пользователь явно хочет копировать demo media

## Обязательный workflow

1. Проверь все входные данные и доступ к репозиторию.
2. Определи режим: `standalone-fork` или `in-repo-bootstrap`.
3. Если это `standalone-fork` и GitHub auth доступен:
- сделай форк package-репозитория
- открой или клонируй форк локально
- создай нужную рабочую ветку
4. Если это `in-repo-bootstrap`:
- открой целевой репозиторий
- создай нужную рабочую ветку
- сохрани существующий продуктовый код и docs вне утвержденного scope
5. Установи выбранный scope.
6. Создай или обнови root `FEATURE-PREPARATION.md` и `TASK-PLAN.md` в целевом репозитории.
7. Добавь в `README.md` короткий entrypoint-раздел про `TASK-PLAN v2`.
8. Проверь установку реальными командами.
9. Делай commit только после успешной проверки.
10. Делай push и открывай PR только если это запрошено и реально возможно.

## Требования к проверке

Всегда запускай и фиксируй:

- `git status --short`
- `rg --files` по установленным planning paths
- проверки существования root `FEATURE-PREPARATION.md` и `TASK-PLAN.md`

Если установлен dashboard extension, дополнительно запусти:

- `node -c extension/task-plan-dashboard/extension.js`
- JSON parse checks для `extension/task-plan-dashboard/resources/locales/*.json`

Проверки Markdown или docs запускай только если они уже есть в целевом репозитории или если выбранный scope их включает.

## Обязательный итоговый отчет

Верни краткий отчет с:

- install mode
- target repository
- branch name
- выбранным scope
- списком добавленных или измененных файлов
- командами, которые реально были запущены
- результатом проверки
- commit SHA, если он создан
- PR URL, если он создан
- нерешенными blockers или alarms

## Definition of done

Работа считается завершенной только если:

- выбранный scope установлен в правильный репозиторий
- root `FEATURE-PREPARATION.md` и `TASK-PLAN.md` существуют
- обязательные проверки реально выполнены и зафиксированы
- entrypoint в README добавлен
- нет фейковых evidence
- статус push или PR соответствует реальности

## Финальная инструкция

Если пользователь передал тебе этот промпт вместе с bootstrap planning workspace, считай этот planning workspace обязательным. Не заменяй его своим свободным чеклистом.
