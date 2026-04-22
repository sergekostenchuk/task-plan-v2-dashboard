# FEATURE-PREPARATION

feature_id: F-TPD-001
feature_title: Antigravity Task Plan Dashboard
status: conditionally_ready
owner_role: planner
last_updated: 2026-04-22

## 1. Problem and goal
- [x] Фича названа одним ясным предложением
- [x] Понятно, какую проблему она решает
- [x] Определен основной пользователь
- [x] Определена ценность фичи
- [x] Понятно, что не входит в фичу

## 2. User intents
- [x] Собраны 5-10 типовых пользовательских команд
- [x] Описаны основные user flows
- [x] Описаны неоднозначные запросы
- [x] Описаны ошибки и edge cases
- [x] Определено, когда AI должен уточнять запрос

## 3. UI/UX
- [x] Определено, где пользователь вызывает фичу
- [x] Определен основной UI-паттерн: чат, command bar, panel, modal
- [x] Понятно, как выглядит preview результата
- [x] Понятно, как подтвердить применение
- [x] Понятно, как сделать undo/rollback
- [x] Описаны состояния UI
- [ ] Описано поведение при ошибке или низкой уверенности

## 4. Technical design
- [x] Определены затрагиваемые подсистемы
- [x] Определена точка входа AI layer
- [x] Описан путь intent -> internal action
- [x] Понятно, какие API/events/contracts нужны
- [x] Определены ограничения и forbidden areas
- [x] Решено, нужен ли preview/dry-run mode

## 5. Verification
- [x] Для фичи есть acceptance criteria
- [x] Для каждого ключевого сценария есть способ проверки
- [x] Определены unit/integration/e2e тесты
- [x] Подготовлены fixtures или sample data
- [x] Определен oracle успеха
- [x] Определены negative tests
- [x] Определены regression risks

## 6. Delivery and rollout
- [x] Определен MVP-срез
- [x] Определено, что отложено на потом
- [ ] Решено, нужен ли feature flag
- [x] Определен rollback/fallback
- [x] Определено, что писать в wiki
- [x] Определено, какие артефакты должен вернуть Codex

## Decisions

problem_statement: Users need a visual operational view of multi-agent execution over TASK-PLAN.md without losing Markdown as the source of truth.
primary_user: AI-heavy developer working in Antigravity or compatible VS Code forks.
value: Show statuses, owners, dependencies, review queue, test queue, blockers, artifacts, and event feed in one place.
mvp_slice: Activity bar tree view plus webview dashboard reading TASK-PLAN.md and .task-plan/events.jsonl.
deferred_scope: Real-time transcript ingestion and auto-generated state from chat logs.
feature_flag: not_decided
rollback: Remove the local extension folder and continue using TASK-PLAN.md directly.
required_artifacts: extension files, demo TASK-PLAN, demo events log, demo artifact files.
wiki_updates: Record the event schema and dashboard data contract after implementation stabilizes.
