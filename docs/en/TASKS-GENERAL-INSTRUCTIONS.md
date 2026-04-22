# TASKS GENERAL INSTRUCTIONS

This document explains how the `TASK-PLAN v2` system works, why it exists, how tasks move through multiple agents, and how review, testing, wiki sync, and dashboards fit together.

This is the English companion to the Russian guide:

- [Russian version](../ru/TASKS-GENERAL-INSTRUCTIONS.md)

## 1. Why TASK-PLAN v2 exists

A plain checklist is not enough for AI-assisted delivery. It usually misses:

- a precise feature goal
- explicit scope boundaries
- dependency visibility
- handoff rules between agents
- hard review and test gates
- rollback logic
- wiki update discipline
- a stable structure for dashboard rendering

`TASK-PLAN v2` fixes that by turning planning into a structured operating document rather than a loose note.

## 2. The three-layer model

The system has three core layers:

1. `FEATURE-PREPARATION.md`
2. `TASK-PLAN.md`
3. `TASK-DASHBOARD.html` or an IDE dashboard view

### `FEATURE-PREPARATION.md`

This is the pre-implementation gate.

It proves that the feature is ready to be decomposed into execution tasks.

If this layer is incomplete, implementation work should stay `draft` or `blocked`, not `ready`.

### `TASK-PLAN.md`

This is the canonical source of truth.

It stores:

- feature-level context
- normalized task blocks
- current task status
- agent order and handoffs
- approvals
- tests
- artifacts
- rollback
- wiki sync obligations

### Dashboard

The dashboard is a visualization layer for humans.

It can show:

- kanban status
- dependency graph
- current owner
- review queue
- test queue
- blockers
- artifacts
- event timeline

The dashboard is not the source of truth. Markdown is.

## 3. The field layers

`TASK-PLAN v2` separates information into four logical layers.

### Feature level

This covers the whole initiative:

- `feature_id`
- `feature_title`
- `rationale`
- `priority`
- `status`
- `goal`
- `scope_in`
- `scope_out`
- `changed_subsystems`
- `constraints`
- `assumptions`
- `open_questions`
- `risks`
- `regression_risks`
- `security_privacy_notes`
- `non_functional_requirements`
- `milestones`
- `timebox`
- `wiki_pages_to_read_before`
- `wiki_pages_to_update_after`
- `wiki_facts_to_capture`
- `wiki_do_not_store`

### Task level

This covers one executable task:

- `task_id`
- `title`
- `rationale`
- `priority`
- `status`
- `dependencies`
- `blocked_by`
- `unblocks`
- `task_size`
- `decomposition_rule`
- `milestones`
- `timebox`
- `goal`
- `scope_in`
- `scope_out`
- `changed_subsystems`
- `candidate_files`
- `forbidden_areas`
- `constraints`
- `assumptions`
- `open_questions`
- `risks`
- `regression_risks`
- `security_privacy_notes`
- `non_functional_requirements`
- `acceptance_criteria`
- `acceptance_checks`
- `exit_criteria`
- `rollback_plan`

### Agent level

This defines how one task moves through several agents:

- `owner_role`
- `agent_sequence`
- `agent_contracts`
- `required_approvals`
- `max_review_loops`
- `escalation_rule`

### Execution and reporting level

This makes closure auditable:

- `tests_required`
- `test_levels`
- `test_targets`
- `negative_tests`
- `fixtures`
- `test_data_origin`
- `oracle`
- `determinism_notes`
- `flakiness_risk`
- `commands_run`
- `stop_on_failure`
- `expected_artifacts`
- `code_artifacts`
- `test_artifacts`
- `review_artifacts`
- `artifact_locations`
- `observability`
- `decision_log`
- `summary_format`

## 4. One task, many agents

The default model is not:

- one parent task plus child tasks for each role

The default model is:

- one task
- multiple agents working on it sequentially

That means:

- the `task_id` stays the same
- the task remains one unit of work
- the current `owner_role` changes over time
- every role receives a handoff from the previous role

Default sequence:

1. `planner`
2. `implementer`
3. `reviewer`
4. `tester`
5. `docs_sync`

You can rename `implementer` to `worker` if that fits the project better.

## 5. Worker -> Reviewer -> Tester

This is a core rule, not a vague recommendation.

### Worker / Implementer

The implementer:

- writes the change
- stays inside scope
- respects forbidden areas
- records code artifacts
- hands off code diff and notes

### Reviewer

The reviewer checks:

- correctness
- boundary adherence
- scope integrity
- acceptance alignment
- whether a correction pass is needed

The reviewer should either:

- approve
- request corrections

### Tester

The tester starts after review.

The tester:

- runs the required checks
- records test artifacts
- marks pass or fail
- blocks closure on required failures

The task should not go to `done` just because code exists.

It should go to `done` only after the test gate is satisfied.

## 6. When to split into multiple tasks

Keep a single task if:

- the outcome is atomic
- one sequential agent pipeline is enough
- the work does not need independent tracking by subpart

Split into multiple tasks if:

- the deliverables are genuinely separate
- dependencies differ
- scope boundaries differ
- one task unblocks another
- the task is too large to manage safely as one unit

Roles inside one task are not the same thing as sub-tasks.

## 7. Suggested status model

Recommended statuses:

- `draft`
- `ready`
- `in_progress`
- `blocked`
- `needs_review`
- `approved`
- `done`
- `dropped`

Typical flow:

- `draft -> ready -> in_progress -> needs_review -> approved -> done`

Correction loop:

- `in_progress -> needs_review -> in_progress -> needs_review -> approved`

Blocked path:

- `in_progress -> blocked`

## 8. Why feature preparation matters

Before coding begins, the feature should be ready enough that the team understands:

- what the feature is
- which problem it solves
- who the user is
- what flows matter
- what UI pattern is expected
- how rollback works
- what needs testing
- what is not in scope

Without this gate:

- scope drifts
- reviewers debate requirements instead of implementation
- testers do not know what success means

## 9. Review and test gates

Review and testing are not optional decorations.

They are structural gates.

### Review gate

Prevents premature `done` by checking:

- scope
- correctness
- acceptance fit
- rollback realism
- artifact completeness

### Test gate

Forces explicit verification through:

- `test_levels`
- `test_targets`
- `negative_tests`
- `commands_run`
- `stop_on_failure`
- `test_artifacts`

## 10. Wiki sync

The plan also needs to say:

- what to read before execution
- what to update after execution
- what facts to preserve
- what must never be stored

That is what the `wiki_*` fields are for.

## 11. Related references

Task-plan references and templates:

- [field-layers.md](../reference/field-layers.md)
- [runtime-adapters.md](../reference/runtime-adapters.md)
- [dashboard-contract.md](../reference/dashboard-contract.md)
- [FEATURE-PREPARATION-CHECKLIST.md](../../templates/FEATURE-PREPARATION-CHECKLIST.md)
- [TASK-PLAN-v2.template.md](../../templates/TASK-PLAN-v2.template.md)
- [CLAUDE-CODE.tasks-projection.md](../../templates/CLAUDE-CODE.tasks-projection.md)
- [IMPLEMENTATION-PLAN.runtime.md](../../templates/IMPLEMENTATION-PLAN.runtime.md)

Antigravity dashboard documentation:

- [ANTIGRAVITY-TASK-PLAN-DASHBOARD.md](./ANTIGRAVITY-TASK-PLAN-DASHBOARD.md)
- [Russian dashboard guide](../ru/ANTIGRAVITY-TASK-PLAN-DASHBOARD.md)

## 12. Short version

If you want the shortest explanation:

- prepare the feature first
- keep `TASK-PLAN.md` canonical
- run one task through several agents sequentially
- do not let the worker close the task alone
- require reviewer and tester gates
- sync knowledge back to wiki
- treat the dashboard as a visualization layer, not the truth source
