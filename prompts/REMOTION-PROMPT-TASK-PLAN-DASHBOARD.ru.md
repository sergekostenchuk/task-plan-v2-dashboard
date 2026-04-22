# REMOTION PROMPT: TASK-PLAN DASHBOARD

Используй этот промпт как рабочее ТЗ для создания видео в Remotion.

## Prompt

Ты работаешь как senior Remotion engineer и motion designer.

Твоя задача: создать короткое product-demo видео про систему `TASK-PLAN v2` и локальное расширение `Task Plan Dashboard` для Antigravity.

Нужно сделать **чистое, профессиональное, визуально плотное, но легко читаемое видео**, которое объясняет:

1. зачем нужен `TASK-PLAN v2`;
2. как одна задача проходит через нескольких агентов по цепочке `implementer -> reviewer -> tester`;
3. как dashboard помогает видеть прогресс, blockers, review queue, test queue, dependencies и artifacts;
4. как это выглядит внутри Antigravity.

## Видео-цель

Зритель должен за 45-60 секунд понять:

- что это за система;
- в чем её отличие от обычного markdown task list;
- почему pipeline нескольких агентов внутри одной задачи важен;
- что dashboard делает видимым весь execution flow.

## Формат

- Разрешение: `1920x1080`
- FPS: `30`
- Длительность: `45-60 секунд`
- Стиль: modern product demo / clean software promo / editorial motion
- Язык on-screen текста: `English`
- Язык кода и data labels: оставить как в оригинальных файлах

## Источники и контекст

Используй как источник смысла и терминов:

- `docs/en/TASKS-GENERAL-INSTRUCTIONS.md`
- `docs/en/ANTIGRAVITY-TASK-PLAN-DASHBOARD.md`
- `examples/demo-en/TASK-PLAN.md`
- `examples/demo-en/FEATURE-PREPARATION.md`
- `examples/demo-en/.task-plan/events.jsonl`

Дополнительные скрины-картинки лежат здесь:

- `media/screenshots`

Если используешь локальные изображения в Remotion:

- сначала положи нужные ассеты в `public/`
- обращайся к ним через `staticFile()`
- для изображений используй компонент `<Img />` из `remotion`, не HTML `<img>`

## Что обязательно показать

В видео должны быть визуально представлены следующие сущности:

- `FEATURE-PREPARATION.md`
- `TASK-PLAN.md`
- `.task-plan/events.jsonl`
- activity bar item `Task Plan`
- summary cards
- kanban
- dependency graph
- selected task details
- owner breakdown
- event timeline

Также нужно явно показать логику:

- одна задача
- несколько агентов
- последовательный handoff
- review gate
- test gate

## Предлагаемая структура сцен

### Scene 1. Hook / Why This Exists

Покажи проблему обычного task list:

- много markdown
- не видно кто сейчас работает
- не видно что ждет review
- не видно что заблокировано

On-screen copy, пример:

- `A checklist is not an execution system`
- `You need visibility across planning, review, testing, and handoff`

### Scene 2. The Model

Покажи 3 слоя:

- `FEATURE-PREPARATION.md`
- `TASK-PLAN.md`
- `Dashboard`

On-screen copy:

- `Preparation`
- `Canonical plan`
- `Operational visibility`

### Scene 3. Multi-Agent Task Flow

Сфокусируйся на одной задаче.

Покажи, что это **не три отдельные задачи**, а одна задача, которая идет через:

- `Planner`
- `Implementer`
- `Reviewer`
- `Tester`
- `Docs Sync`

Сделай ясную анимацию handoff:

- worker finishes
- reviewer inspects
- tester validates

On-screen copy:

- `One task`
- `Multiple agents`
- `Sequential control`

### Scene 4. Dashboard in Antigravity

Покажи интерфейс расширения:

- activity bar
- открытие dashboard
- summary cards
- kanban
- dependency graph

Пусть зритель визуально понимает, что dashboard это cockpit, а не новый source of truth.

On-screen copy:

- `Markdown stays canonical`
- `Dashboard makes execution visible`

### Scene 5. Review / Test Visibility

Отдельно выдели:

- `needs_review`
- `approved`
- `blocked`
- `done`

Покажи event timeline и объясни, что видно:

- кто взял задачу
- кто передал дальше
- где возник blocker
- где тесты прошли

### Scene 6. Closing Message

Финальный тезис:

- `Plan clearly`
- `Hand off explicitly`
- `Review honestly`
- `Test before done`

## Визуальный стиль

Не делай generic corporate template.

Нужно ощущение:

- serious engineering tool
- modern control room
- structured execution

Рекомендации:

- темный фон с холодными синими/циановыми акцентами
- светлые карточки/панели поверх темного пространства
- аккуратные grid-based transitions
- умеренные glow/highlight эффекты
- плавные zoom/pan движения по UI
- графические стрелки handoff между ролями

## Анимация

Используй:

- мягкие entrance animations
- sequencing по сценам
- scale/opacity/slide transitions
- аккуратные highlight pulses на статусах и agent handoff

Избегай:

- хаотичных камер
- слишком большого количества spring-эффектов
- визуального шума

## Практические требования к реализации

1. Создай отдельную Remotion composition для этого ролика.
2. Структурируй сцены как понятные React-компоненты.
3. Используй локальные assets через `public/` + `staticFile()`.
4. Для изображений используй `<Img />`.
5. Если показываешь скрины интерфейса, делай это как product showcase:
   - frame
   - zoom
   - crop
   - callouts
6. Предусмотри возможность быстро заменить тексты и картинки.

## Что должно получиться на выходе

Нужен результат, который включает:

- рабочую Remotion composition
- все нужные импорты ассетов
- внятную структуру сцен
- готовность к preview в studio

Дополнительно:

- оставь короткий комментарий, какие файлы являются точками входа;
- перечисли, какие изображения были использованы из папки `PICS`;
- если какие-то изображения не использованы, коротко объясни почему.
