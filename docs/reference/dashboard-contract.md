# Dashboard Contract

Keep HTML as a visual layer over Markdown.

## Source Of Truth

- `TASK-PLAN.md` is canonical
- `TASK-DASHBOARD.html` is derived
- if both exist and disagree, Markdown wins

## Minimum Fields Needed For Reliable Dashboard Rendering

Every task block should expose at least:
- `task_id`
- `title`
- `status`
- `priority`
- `owner_role`
- `agent_sequence`
- `dependencies`
- `blocked_by`
- `required_approvals`
- `tests_required`
- `acceptance_checks`
- `artifact_locations`
- `timebox`

These minimum fields unlock:
- kanban by status
- dependency graph
- critical path view
- owner or role view
- test gate view
- review gate view

## Good Dashboard Views

### 1. Task Board

Columns:
- `draft`
- `ready`
- `in_progress`
- `blocked`
- `needs_review`
- `approved`
- `done`

### 2. Dependency Graph

Nodes:
- task id
- short title
- status

Edges:
- `dependencies`

### 3. Critical Path View

Highlight:
- tasks with no slack
- blockers that gate multiple downstream tasks

### 4. Agent Occupancy View

Show:
- current `owner_role`
- next role in `agent_sequence`
- tasks waiting on approval

### 5. Verification View

Show:
- tasks with `tests_required: yes`
- required test levels
- missing artifacts
- stop-on-failure status

## Regeneration Rule

Preferred flow:
1. edit Markdown
2. parse normalized task blocks
3. regenerate HTML

Avoid:
- patching HTML by hand while leaving Markdown stale
- extracting meaning from loose prose paragraphs

## Parsing Guidance

Prefer these structures:
- stable Markdown headings per task
- `key: value` lines
- flat bullet lists

Avoid:
- deeply nested prose
- inconsistent task headings
- changing field names across tasks

## Optional Dashboard Metadata

If you need richer visual output, add these optional fields:
- `current_gate`
- `last_updated`
- `last_decision`
- `latest_review_artifact`
- `latest_test_artifact`
- `health`

## Safe Fallback

If no generator exists yet:
- keep the dashboard optional
- first normalize `TASK-PLAN.md`
- add a small "dashboard-ready" note rather than inventing a brittle HTML layer
