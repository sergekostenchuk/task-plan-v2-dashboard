# ANTIGRAVITY TASK PLAN DASHBOARD

This document explains the local `Task Plan Dashboard` extension for Antigravity.

It is the English companion to the Russian document:

- [Russian version](../ru/ANTIGRAVITY-TASK-PLAN-DASHBOARD.md)

## 1. Purpose

The extension gives you a visual cockpit over `TASK-PLAN v2` without changing the core rule:

**Markdown stays the source of truth. The extension only reads and visualizes.**

It reads:

- `TASK-PLAN.md`
- `FEATURE-PREPARATION.md`
- `.task-plan/events.jsonl`

and turns them into:

- a tree view in the activity bar
- a dashboard panel

## 2. Installation location

Current local installation:

- [package.json](../../extension/task-plan-dashboard/package.json)
- [extension.js](../../extension/task-plan-dashboard/extension.js)
- [README.md](../../extension/task-plan-dashboard/README.md)
- [icon](../../extension/task-plan-dashboard/resources/task-plan-dashboard.svg)

Runtime-specific user profile files such as `extensions.json` and `.obsolete` are intentionally not part of the repository bundle.

## 3. Extension identity

Current values:

- extension id: `local.task-plan-dashboard`
- folder: `local.task-plan-dashboard-1.0.0`
- display name: `Task Plan Dashboard`
- publisher: `local`

These values matter when you:

- search in the Extensions view
- inspect logs
- debug activation issues

## 4. What the extension shows

### Activity bar

The extension adds a `Task Plan` item to the left activity bar.

Inside the tree you get:

- `Open Dashboard`
- `Open Demo Workspace`
- a summary item for the current plan
- status groups
- individual tasks grouped under each status

### Dashboard panel

The dashboard shows:

- feature hero block
- summary cards
- feature-preparation readiness
- kanban columns
- dependency graph
- selected-task details
- owner breakdown
- event timeline
- artifact links

## 5. Canonical inputs

The extension expects three main files.

### `TASK-PLAN.md`

Used for:

- feature metadata
- normalized task blocks
- statuses
- dependencies
- current owners
- approvals
- artifact locations
- risks
- acceptance checks

### `FEATURE-PREPARATION.md`

Used for:

- total checklist item count
- completed checklist item count
- readiness percentage

### `.task-plan/events.jsonl`

Used for:

- recent event timeline
- latest event context per task
- handoff visibility across roles

## 6. How to open it

### From the activity bar

1. Open Antigravity
2. Click `Task Plan`
3. Click `Open Dashboard`

### From Command Palette

1. Press `Cmd+Shift+P`
2. Run `Task Plan: Open Dashboard`

Useful commands:

- `Task Plan: Open Dashboard`
- `Task Plan: Refresh`
- `Task Plan: Pick Plan File`
- `Task Plan: Open Plan File`
- `Task Plan: Open Feature Prep`
- `Task Plan: Open Demo Workspace`

## 7. Language support

The extension now supports:

- `en`
- `ru`
- `auto`

Setting:

- `taskPlanDashboard.language`

Rules:

- `auto` follows the Antigravity UI language
- `en` forces English dashboard strings
- `ru` forces Russian dashboard strings

English and Russian share the same schema and behavior. Only the UI strings differ.

## 8. English demo workspace

An English demo workspace is available here:

- [examples/demo-en](../../examples/demo-en)

Key files:

- [README.md](../../examples/demo-en/README.md)
- [FEATURE-PREPARATION.md](../../examples/demo-en/FEATURE-PREPARATION.md)
- [TASK-PLAN.md](../../examples/demo-en/TASK-PLAN.md)
- [events.jsonl](../../examples/demo-en/.task-plan/events.jsonl)

The English demo is useful for:

- onboarding English-speaking collaborators
- testing the dashboard without touching a real repo
- showing all major states in a controlled fixture

## 9. Supported status set

The dashboard expects this status vocabulary:

- `draft`
- `ready`
- `in_progress`
- `blocked`
- `needs_review`
- `approved`
- `done`
- `dropped`

If the plan uses a different status set, the UI may become inconsistent or incomplete.

## 10. Multi-agent visibility

The extension is designed for the model:

**one task -> multiple agents working on it sequentially**

It is not built around “reviewer task” and “tester task” as separate units.

It expects task fields such as:

- `owner_role`
- `agent_sequence`
- `required_approvals`
- `dependencies`
- `blocked_by`
- `artifact_locations`

That allows the UI to show:

- who owns the task now
- who is next
- whether the task is waiting on review
- whether it reached the test gate

## 11. What v1 supports

Current version supports:

- reading canonical plan files
- activity bar tree
- summary cards
- kanban
- dependency graph
- selected task details
- owner breakdown
- event timeline
- artifact opening
- language selection for dashboard UI

## 12. What v1 does not support

Current version does not support:

- editing `TASK-PLAN.md` from the UI
- drag-and-drop kanban
- status mutation from the panel
- transcript-derived authoritative state
- multi-repo aggregation
- server sync

It is a read-only visualization layer over disciplined planning files.

## 13. Refresh model

Refresh can happen in two ways.

### Manual

Run:

- `Task Plan: Refresh`

### Automatic

The extension watches:

- `TASK-PLAN.md`
- `FEATURE-PREPARATION.md`
- `.task-plan/events.jsonl`

If the UI does not update:

1. Run `Task Plan: Refresh`
2. Reopen the dashboard
3. Reload the Antigravity window if needed

## 14. Troubleshooting

If the extension is not visible:

### Check 1. Folder exists

Verify:

- repository source folder: `extension/task-plan-dashboard`
- local install target: `<USER_HOME>/.antigravity/extensions/local.task-plan-dashboard-1.0.0`

### Check 2. Registry entry exists

Verify:

- local user registry: `<USER_HOME>/.antigravity/extensions/extensions.json`

There should be an entry for:

- `local.task-plan-dashboard`

### Check 3. Not marked as removed

Verify:

- local removed-extension marker: `<USER_HOME>/.antigravity/extensions/.obsolete`

If the extension appears there, Antigravity may suppress it.

### Check 4. Cached profile scan

Antigravity caches user extension scans.

After manual installation you may need:

- full restart
- cache refresh
- reload window

### Check 5. Logs

Useful logs:

- `<USER_HOME>/Library/Application Support/Antigravity/logs`

Especially:

- `sharedprocess.log`
- `window*/exthost/exthost.log`

Expected activation trace:

- `ExtensionService#_doActivateExtension local.task-plan-dashboard`

## 15. Smoke test

Recommended smoke flow:

1. Open Antigravity
2. Open [examples/demo-en](../../examples/demo-en)
3. Confirm the `Task Plan` activity item exists
4. Run `Task Plan: Open Dashboard`
5. Confirm that the panel shows:
   - summary cards
   - kanban
   - dependency graph
   - selected task details
   - owner breakdown
   - event timeline
6. Click a task card and confirm the selected-task panel updates
7. Click an artifact link and confirm the file opens

## 16. Using it with a real project

Recommended order:

1. Prepare `FEATURE-PREPARATION.md`
2. Prepare a normalized `TASK-PLAN.md`
3. Start writing `.task-plan/events.jsonl`
4. Open the workspace in Antigravity
5. Open the dashboard

The extension is an observer of that system, not a substitute for it.

## 17. Short version

In one sentence:

- `TASK-PLAN.md` holds the truth
- `FEATURE-PREPARATION.md` shows readiness
- `.task-plan/events.jsonl` shows progression
- the Antigravity extension makes all of that visible
