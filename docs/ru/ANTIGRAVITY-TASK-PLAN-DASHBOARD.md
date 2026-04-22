# ANTIGRAVITY TASK PLAN DASHBOARD

Этот документ описывает локальное расширение `Task Plan Dashboard` для Antigravity.

Английская версия лежит здесь:

- [English version](../en/ANTIGRAVITY-TASK-PLAN-DASHBOARD.md)

Его задача: дать человеку визуальный cockpit поверх `TASK-PLAN v2`, не ломая главное правило системы:

**Markdown остается source of truth, расширение только читает и визуализирует данные.**

## 1. Что это за расширение

`Task Plan Dashboard` это локальное расширение Antigravity, которое:

- читает `TASK-PLAN.md`;
- читает `FEATURE-PREPARATION.md`;
- читает `.task-plan/events.jsonl`;
- показывает статус задач в activity bar и в dashboard panel;
- помогает видеть, где задача находится в pipeline `implementer -> reviewer -> tester`.

Расширение не заменяет task plan.

Оно не является новой системой хранения данных.

Оно является **наблюдаемым UI-слоем** над уже существующей моделью `TASK-PLAN v2`.

## 2. Где оно установлено

Текущая локальная установка лежит здесь:

- [package.json](../../extension/task-plan-dashboard/package.json)
- [extension.js](../../extension/task-plan-dashboard/extension.js)
- [README.md](../../extension/task-plan-dashboard/README.md)
- [icon](../../extension/task-plan-dashboard/resources/task-plan-dashboard.svg)

Runtime-specific user profile files вроде `extensions.json` и `.obsolete` намеренно не включены в репозиторный bundle.

## 3. Идентичность расширения

Текущие значения:

- extension id: `local.task-plan-dashboard`
- folder: `local.task-plan-dashboard-1.0.0`
- display name: `Task Plan Dashboard`
- publisher: `local`

Это полезно для:

- поиска в списке extensions;
- диагностики загрузки;
- поиска по логам Antigravity.

## 4. Что именно показывает расширение

### В левом сайдбаре

Расширение добавляет activity bar item:

- `Task Plan`

Внутри tree view показываются:

- `Open Dashboard`
- `Open Demo Workspace`
- summary item по найденному plan-файлу
- группы задач по статусам
- отдельные задачи внутри статусных групп

### В dashboard panel

Dashboard показывает:

- hero block по текущей фиче;
- summary cards;
- progress по `FEATURE-PREPARATION.md`;
- kanban по статусам;
- dependency graph;
- selected task details;
- owner breakdown;
- event timeline;
- ссылки на artifacts.

## 5. Какие файлы расширение считает каноническими

Расширение использует три основных источника:

1. `TASK-PLAN.md`
2. `FEATURE-PREPARATION.md`
3. `.task-plan/events.jsonl`

Их роли:

### `TASK-PLAN.md`

Это канонический task plan.

Расширение берет из него:

- feature metadata;
- task blocks;
- statuses;
- dependencies;
- owner roles;
- approvals;
- artifact locations;
- acceptance checks;
- risks.

### `FEATURE-PREPARATION.md`

Из него расширение считает готовность pre-implementation слоя:

- сколько checklist items отмечено;
- сколько всего пунктов;
- какой readiness percentage.

### `.task-plan/events.jsonl`

Из него расширение строит timeline и latest-event context по задачам.

То есть расширение показывает не только “текущее состояние”, но и “как задача пришла в это состояние”.

## 6. Как открыть dashboard

### Способ 1. Через activity bar

1. Открыть Antigravity
2. Найти слева `Task Plan`
3. Нажать `Open Dashboard`

### Способ 2. Через Command Palette

1. Нажать `Cmd+Shift+P`
2. Ввести `Task Plan: Open Dashboard`
3. Нажать `Enter`

### Полезные команды

В command palette доступны:

- `Task Plan: Open Dashboard`
- `Task Plan: Refresh`
- `Task Plan: Pick Plan File`
- `Task Plan: Open Plan File`
- `Task Plan: Open Feature Prep`
- `Task Plan: Open Demo Workspace`

## 7. Как выбрать свой plan вместо demo

Если в workspace уже есть `TASK-PLAN.md`, расширение пытается найти его автоматически.

Если файлов несколько или автопоиск не подходит:

1. Нажать `Cmd+Shift+P`
2. Выполнить `Task Plan: Pick Plan File`
3. Выбрать нужный `TASK-PLAN.md`

После этого расширение будет использовать выбранный path как основной.

Также можно задать путь через setting:

- `taskPlanDashboard.planPath`

Это полезно, если:

- plan лежит не в текущем workspace root;
- в проекте несколько разных task plan файлов;
- нужен фиксированный canonical path.

## 8. Demo workspace

Для демонстрации и проверки расширения создан отдельный workspace:

- [examples/demo-ru](../../examples/demo-ru)

Основные файлы:

- [README.md](../../examples/demo-ru/README.md)
- [FEATURE-PREPARATION.md](../../examples/demo-ru/FEATURE-PREPARATION.md)
- [TASK-PLAN.md](../../examples/demo-ru/TASK-PLAN.md)
- [events.jsonl](../../examples/demo-ru/.task-plan/events.jsonl)

В demo специально показаны:

- 10 задач;
- все ключевые статусы;
- зависимости;
- review queue;
- test queue;
- blocked task;
- approved task;
- dropped task;
- artifacts;
- event timeline.

Этот workspace нужен не для бизнеса, а для:

- проверки UI;
- демонстрации модели;
- отладки расширения;
- объяснения новой структуры другим участникам.

## 9. Какие состояния задач должны быть видны в dashboard

В текущем demo и в реальных планах расширение ожидает, что задачи используют конечный набор статусов:

- `draft`
- `ready`
- `in_progress`
- `blocked`
- `needs_review`
- `approved`
- `done`
- `dropped`

Практический смысл:

- `draft`: задача не готова к запуску
- `ready`: задача готова к исполнению
- `in_progress`: над задачей сейчас работает активный агент
- `blocked`: есть blocker
- `needs_review`: задача ушла на reviewer stage
- `approved`: review пройден
- `done`: задача закрыта
- `dropped`: задача сознательно исключена

Если проект использует другой словарь статусов, dashboard может начать отображать задачи некорректно или неполно.

## 10. Как расширение отражает multi-agent модель

Расширение построено вокруг идеи:

**одна задача -> несколько агентов по очереди**

Оно не считает `reviewer` и `tester` отдельными задачами.

Оно ожидает, что у задачи есть поля:

- `owner_role`
- `agent_sequence`
- `required_approvals`
- `dependencies`
- `blocked_by`
- `artifact_locations`

За счет этого в UI можно увидеть:

- кто владеет задачей сейчас;
- кто должен быть следующим;
- задача ушла на review или нет;
- задача дошла до test gate или нет.

Это особенно важно для цепочки:

- `implementer`
- `reviewer`
- `tester`

Именно ради видимости этой цепочки расширение и создавалось.

## 11. Что сейчас умеет v1

Текущая версия умеет:

- читать canonical `TASK-PLAN.md`;
- читать `FEATURE-PREPARATION.md`;
- читать event feed;
- показывать activity bar tree;
- открывать dashboard panel;
- рендерить kanban;
- рендерить dependency graph;
- показывать selected task;
- показывать artifacts;
- показывать owner breakdown;
- показывать event timeline.

## 12. Что v1 пока не умеет

Текущая версия пока не делает:

- редактирование `TASK-PLAN.md` из UI;
- drag-and-drop kanban;
- изменение статусов из dashboard;
- автоматическое построение состояния из chat transcripts;
- multi-repo aggregation;
- server-side sync;
- двустороннюю запись обратно в plan.

Это важное ограничение.

Расширение пока **read-only visualization layer**, а не full workflow engine.

## 13. Как работает refresh

Есть два режима обновления:

### Явное обновление

Через:

- `Task Plan: Refresh`

### Автоматическое обновление

Расширение следит за изменениями:

- `TASK-PLAN.md`
- `FEATURE-PREPARATION.md`
- `.task-plan/events.jsonl`

Если эти файлы меняются, dashboard должен перечитывать модель.

Если обновление визуально не случилось:

1. выполнить `Task Plan: Refresh`
2. закрыть и заново открыть dashboard
3. если нужно, сделать `Developer: Reload Window`

## 14. Где искать проблемы, если расширение не появилось

Это самый важный operational раздел.

### Проверка 1. Есть ли папка extension

Проверить, что существует:

- папка исходников в репо: `extension/task-plan-dashboard`
- локальный install target: `<USER_HOME>/.antigravity/extensions/local.task-plan-dashboard-1.0.0`

### Проверка 2. Есть ли регистрация в `extensions.json`

Проверить:

- локальный user-registry: `<USER_HOME>/.antigravity/extensions/extensions.json`

Там должна быть запись:

- `local.task-plan-dashboard`

Если её нет, Antigravity может не включить extension в registry.

### Проверка 3. Не помечен ли extension как removed

Проверить:

- локальный removed-marker: `<USER_HOME>/.antigravity/extensions/.obsolete`

Если там есть:

- `local.task-plan-dashboard-1.0.0: true`

то extension будет считаться удаленным и не загрузится.

### Проверка 4. Пересканирован ли profile cache

Antigravity кэширует user-extension scan.

Если расширение только что добавили вручную, может потребоваться:

- полный перезапуск Antigravity;
- иногда удаление cache-файла профиля;
- повторный reload window.

### Проверка 5. Есть ли следы активации в логах

Полезные логи лежат здесь:

- `<USER_HOME>/Library/Application Support/Antigravity/logs`

Особенно полезны:

- `sharedprocess.log`
- `window*/exthost/exthost.log`

Если extension реально активировался, там обычно видно строку вида:

- `ExtensionService#_doActivateExtension local.task-plan-dashboard`

## 15. Как проверять, что расширение реально работает

Минимальный smoke flow:

1. Открыть Antigravity
2. Открыть [examples/demo-ru](../../examples/demo-ru)
3. Проверить, что в activity bar появился `Task Plan`
4. Выполнить `Task Plan: Open Dashboard`
5. Убедиться, что видны:
   - summary cards
   - kanban
   - dependency graph
   - selected task
   - owner breakdown
   - event timeline
6. Нажать на task card и проверить, что selected panel меняется
7. Нажать на artifact path и проверить, что файл открывается

Если все это работает, значит v1 установлен корректно.

## 16. Как использовать расширение в реальном проекте

Рекомендуемый порядок:

1. Подготовить `FEATURE-PREPARATION.md`
2. Подготовить нормализованный `TASK-PLAN.md`
3. Начать писать `.task-plan/events.jsonl`
4. Открыть workspace в Antigravity
5. Запустить dashboard

То есть расширение подключается **после** того, как структура plan уже существует.

Оно не заменяет подготовку task plan.

## 17. Когда не стоит полагаться только на dashboard

Dashboard полезен для наблюдаемости, но не должен становиться единственным интерфейсом принятия решений.

Нельзя переносить source of truth из Markdown в UI.

Нужно помнить:

- dashboard может отображать только то, что уже есть в файлах;
- если статус в `TASK-PLAN.md` не обновлен, UI не “додумает” правду;
- если события в `events.jsonl` фиктивные, timeline тоже будет фиктивным;
- если artifacts не записаны, dashboard не создаст их сам.

То есть надежность dashboard полностью зависит от дисциплины планирования и исполнения.

## 18. Как удалять или переустанавливать расширение

Если нужно переустановить extension вручную:

1. удалить папку расширения
2. удалить или обновить запись в `extensions.json`
3. проверить, что в `.obsolete` не осталась неверная запись
4. перезапустить Antigravity

Если нужно просто временно перестать им пользоваться:

- можно не удалять extension;
- достаточно не открывать activity bar item или не использовать его команды.

## 19. Короткая формула

Если совсем кратко:

- `TASK-PLAN.md` хранит истину;
- `FEATURE-PREPARATION.md` показывает readiness;
- `.task-plan/events.jsonl` показывает progression;
- расширение `Task Plan Dashboard` делает это все видимым в Antigravity.
