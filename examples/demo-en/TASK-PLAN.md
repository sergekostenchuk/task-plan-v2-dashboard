# TASK-PLAN v2

project: antigravity-task-plan-dashboard-demo
plan_id: PLAN-TPD-001
plan_version: 1.0
canonical_source: TASK-PLAN.md
dashboard_target: TASK-DASHBOARD.html
status: in_progress
owner_role: planner
created_at: 2026-04-22
updated_at: 2026-04-22

## Feature Layer

feature_id: F-TPD-001
feature_title: Antigravity Task Plan Dashboard
rationale: Give humans a stable visual cockpit over multi-agent execution without replacing Markdown as the source of truth.
priority: P1
status: in_progress
goal: Track 10 example tasks across planning, implementation, review, testing, docs sync, blockers, dependencies, and artifact evidence inside Antigravity.
scope_in:
- Parse canonical TASK-PLAN.md blocks
- Parse FEATURE-PREPARATION.md readiness checklist
- Parse .task-plan/events.jsonl timeline
- Render activity bar tree view
- Render dashboard with summary, kanban, dependency graph, selected task details, and event timeline
scope_out:
- Auto-generating plan state from chat transcripts
- Editing TASK-PLAN.md from inside the dashboard
- Multi-workspace aggregation
changed_subsystems:
- Antigravity extension host
- TASK-PLAN markdown schema
- Demo artifacts and event feed
constraints:
- Keep Markdown as source of truth
- Do not depend on remote services
- Use a local user extension format compatible with Antigravity
assumptions:
- Antigravity can load unpacked extensions from the user extension directory
- Demo workspace may be opened directly as a normal folder
open_questions:
- Whether transcript-derived state should ever be authoritative
- Whether review/test approvals should become separate machine-readable state files
risks:
- Parsing relaxed Markdown can become brittle
- Users may expect bi-directional editing in v1
regression_risks:
- Extension host load failures
- Dashboard drift if users edit non-normalized task blocks
security_privacy_notes:
- Do not store secrets in artifact_locations or wiki fields
- Event feed should contain task metadata, not credentials or transcript dumps
non_functional_requirements:
- Dashboard should open under 1 second on a 10-task demo plan
- Parsing should tolerate unknown fields without crashing
milestones:
- Extension shell installed
- Demo plan seeded
- Dashboard verified
timebox: 2026-04-22
wiki_pages_to_read_before:
- TASKS-GENERAL-INSTRUCTIONS/README.md
wiki_pages_to_update_after:
- wiki/task-plan-dashboard-contract.md
wiki_facts_to_capture:
- event schema
- supported task fields
- dashboard limitations
wiki_do_not_store:
- secrets
- personal data
- raw transcript dumps

## Pre-Implementation Gate

feature_preparation_path: FEATURE-PREPARATION.md
preimplementation_status: conditionally_ready
entry_rule: No implementation task may move to ready until the feature-preparation gate is complete or explicitly accepted with documented gaps.

## Execution Policy

orchestration_mode: sequential_multi_agent
default_agent_sequence:
- planner
- implementer
- reviewer
- tester
- docs_sync
status_legend:
- draft
- ready
- in_progress
- blocked
- needs_review
- approved
- done
- dropped

## Task Register

| task_id | title | status | priority | owner_role | depends_on | required_approvals |
| --- | --- | --- | --- | --- | --- | --- |
| T-001 | Parser core | done | P1 | docs_sync | [] | [design-review, code-review, qa-signoff] |
| T-002 | Event log reader | done | P1 | docs_sync | [T-001] | [code-review, qa-signoff] |
| T-003 | Activity bar tree | approved | P1 | tester | [T-001] | [code-review, qa-signoff] |
| T-004 | Webview dashboard shell | in_progress | P1 | implementer | [T-001, T-002] | [code-review, qa-signoff] |
| T-005 | Kanban board rendering | needs_review | P1 | reviewer | [T-004] | [code-review] |
| T-006 | Dependency graph renderer | blocked | P2 | implementer | [T-004] | [code-review, qa-signoff] |
| T-007 | Review queue analytics | ready | P2 | implementer | [T-002, T-003] | [code-review] |
| T-008 | Test gate analytics | draft | P2 | planner | [T-002] | [design-review, qa-signoff] |
| T-009 | Demo seed data and artifacts | done | P1 | docs_sync | [] | [qa-signoff] |
| T-010 | Transcript auto-sync spike | dropped | P3 | planner | [T-002] | [design-review] |

## Tasks

### TASK T-001

task_id: T-001
title: Parser core
rationale: The dashboard needs a stable parser for canonical task blocks before any UI can trust the plan.
priority: P1
status: done
owner_role: docs_sync
agent_sequence:
- planner
- implementer
- reviewer
- tester
- docs_sync
required_approvals:
- design-review
- code-review
- qa-signoff
max_review_loops: 2
escalation_rule:
- If the parser cannot reliably read task blocks, escalate back to planner and tighten the Markdown contract.
dependencies:
- none
blocked_by:
- none
unblocks:
- T-002
- T-003
- T-004
task_size: M
decomposition_rule:
- Split if parser changes and schema changes can be delivered independently.
milestones:
- header fields parsed
- task blocks parsed
- arrays normalized
timebox: 2026-04-22 morning
goal: Parse the demo TASK-PLAN.md into stable task objects with ids, statuses, roles, dependencies, checks, and artifact locations.
scope_in:
- extension parser logic
- normalized TASK-PLAN task blocks
scope_out:
- graph layout
- webview rendering
changed_subsystems:
- extension parser
candidate_files:
- extension.js
- TASK-PLAN.md
forbidden_areas:
- Antigravity built-in app bundle
constraints:
- tolerate unknown keys
- prefer line-oriented parsing
assumptions:
- task blocks begin with `### TASK <id>`
open_questions:
- none
risks:
- parsing errors can mislabel task state in the dashboard
regression_risks:
- future freeform prose may break extraction
security_privacy_notes:
- parser should not ingest secrets from unrelated files
non_functional_requirements:
- parsing stays fast on small and medium plans
tests_required: yes
test_levels:
- unit
test_targets:
- task block parsing
- array field normalization
negative_tests:
- unknown field preserved without crash
fixtures:
- TASK-PLAN.md
test_data_origin:
- synthetic
oracle:
- parsed tasks match expected ids and statuses
determinism_notes:
- same file should always produce the same task ordering
flakiness_risk:
- low
commands_run:
- node smoke parser
stop_on_failure: true
expected_artifacts:
- parser summary
- parser test log
- review note
code_artifacts:
- parser implementation in extension.js
test_artifacts:
- artifacts/T-001/parser-smoke.log
review_artifacts:
- artifacts/T-001/review-note.md
artifact_locations:
- artifacts/T-001/impl-summary.md
- artifacts/T-001/parser-smoke.log
- artifacts/T-001/review-note.md
acceptance_criteria:
- TASK-PLAN.md tasks are parsed into stable objects
- key arrays are normalized
- no crash on unknown fields
acceptance_checks:
- parser returns 10 tasks
- parsed status counts match the plan
exit_criteria:
- parser output stable
- review and QA signoff recorded
rollback_plan:
- remove parser changes and fall back to static demo data
observability:
- parser errors surface in extension host logs
decision_log:
- [2026-04-22] Parser chosen as a line-oriented reader for the v1 demo.
summary_format:
- changed files
- parsing facts
- checks run
- next owner

### TASK T-002

task_id: T-002
title: Event log reader
rationale: The dashboard needs recent agent events to show progress over time and handoffs between roles.
priority: P1
status: done
owner_role: docs_sync
agent_sequence:
- planner
- implementer
- reviewer
- tester
- docs_sync
required_approvals:
- code-review
- qa-signoff
max_review_loops: 2
escalation_rule:
- If the event schema becomes unstable, freeze v1 on a minimal JSONL contract and defer richer ingestion.
dependencies:
- T-001
blocked_by:
- none
unblocks:
- T-004
- T-007
- T-008
- T-010
task_size: S
decomposition_rule:
- Keep timeline parsing together with schema validation.
milestones:
- JSONL schema accepted
- timeline sorted descending
timebox: 2026-04-22 morning
goal: Read `.task-plan/events.jsonl` and expose a recent timeline plus latest event per task.
scope_in:
- JSONL event parsing
- timeline sorting
scope_out:
- transcript mining
- remote event sinks
changed_subsystems:
- extension event reader
candidate_files:
- extension.js
- .task-plan/events.jsonl
forbidden_areas:
- external network
constraints:
- ignore malformed lines without crashing the dashboard
assumptions:
- each line is a standalone JSON object
open_questions:
- none
risks:
- malformed feed lines can hide a real task transition
regression_risks:
- timeline ordering can drift if timestamps become non-ISO
security_privacy_notes:
- event lines should contain metadata only, not transcript contents
non_functional_requirements:
- parse 100 lines instantly
tests_required: yes
test_levels:
- unit
test_targets:
- JSONL parsing
- sort order
negative_tests:
- malformed line ignored
fixtures:
- .task-plan/events.jsonl
test_data_origin:
- synthetic
oracle:
- timeline count and ordering match the fixture
determinism_notes:
- ISO timestamps required
flakiness_risk:
- low
commands_run:
- node smoke events
stop_on_failure: true
expected_artifacts:
- event schema note
- smoke log
code_artifacts:
- extension event reader
test_artifacts:
- artifacts/T-002/events-smoke.log
review_artifacts:
- artifacts/T-002/review-note.md
artifact_locations:
- artifacts/T-002/event-schema.md
- artifacts/T-002/events-smoke.log
- artifacts/T-002/review-note.md
acceptance_criteria:
- timeline renders recent task events
- malformed lines do not crash the panel
acceptance_checks:
- 18 demo events parsed
- latest event mapped per task
exit_criteria:
- event feed renders in dashboard
- QA signoff captured
rollback_plan:
- disable timeline panel and use task status only
observability:
- JSON parse failures logged in extension host
decision_log:
- [2026-04-22] JSONL chosen for append-only local event storage.
summary_format:
- feed facts
- checks run
- next owner

### TASK T-003

task_id: T-003
title: Activity bar tree
rationale: Users need a compact task navigator before opening the full dashboard panel.
priority: P1
status: approved
owner_role: tester
agent_sequence:
- planner
- implementer
- reviewer
- tester
- docs_sync
required_approvals:
- code-review
- qa-signoff
max_review_loops: 2
escalation_rule:
- If the activity bar view is too noisy, escalate back to planner and tighten group-level summaries.
dependencies:
- T-001
blocked_by:
- none
unblocks:
- T-007
task_size: M
decomposition_rule:
- Keep the tree provider and command wiring together.
milestones:
- root actions visible
- status groups visible
- task items reveal dashboard
timebox: 2026-04-22 midday
goal: Show root actions plus status-grouped tasks in the Antigravity activity bar.
scope_in:
- views container
- tree provider
- open dashboard command wiring
scope_out:
- kanban and graph rendering
changed_subsystems:
- extension UI surface
candidate_files:
- package.json
- extension.js
forbidden_areas:
- built-in Antigravity commands beyond dashboard-related ones
constraints:
- avoid requiring a build step
assumptions:
- activity bar icons and tree views work like standard VS Code
open_questions:
- whether counts should be shown in the tree item description or label
risks:
- status groups can become cluttered on large plans
regression_risks:
- extension activation regressions can hide the activity bar item
security_privacy_notes:
- tree labels should not expose secret task names in sensitive workspaces
non_functional_requirements:
- first tree render should feel immediate
tests_required: yes
test_levels:
- manual
- integration
test_targets:
- activity bar container
- openDashboardForTask command
negative_tests:
- no TASK-PLAN found state renders helpful fallback
fixtures:
- TASK-PLAN.md
test_data_origin:
- synthetic
oracle:
- tree view reflects the demo task distribution
determinism_notes:
- status group order fixed
flakiness_risk:
- low
commands_run:
- antigravity --list-extensions
- open tree view manually
stop_on_failure: true
expected_artifacts:
- tree QA note
- extension discovery log
code_artifacts:
- tree view registration
test_artifacts:
- artifacts/T-003/tree-qa.md
review_artifacts:
- artifacts/T-003/review-note.md
artifact_locations:
- artifacts/T-003/tree-qa.md
- artifacts/T-003/review-note.md
acceptance_criteria:
- activity bar item appears
- status groups render with counts
- clicking a task opens the dashboard focused on that task
acceptance_checks:
- extension is listed by Antigravity CLI
- tree shows grouped demo tasks
exit_criteria:
- code review passed
- ready for tester validation
rollback_plan:
- remove tree view registration and keep command-only access
observability:
- activation failures visible in extension host logs
decision_log:
- [2026-04-22] Tree view kept intentionally compact and status-driven.
summary_format:
- UI facts
- test notes
- next owner

### TASK T-004

task_id: T-004
title: Webview dashboard shell
rationale: The demo needs a high-density visual board where humans can inspect plan state quickly.
priority: P1
status: in_progress
owner_role: implementer
agent_sequence:
- planner
- implementer
- reviewer
- tester
- docs_sync
required_approvals:
- code-review
- qa-signoff
max_review_loops: 2
escalation_rule:
- If the panel becomes too dense, split layout refinements from data rendering and continue with the data-first shell.
dependencies:
- T-001
- T-002
blocked_by:
- none
unblocks:
- T-005
- T-006
task_size: L
decomposition_rule:
- Split follow-up visual modules after the shell renders real data end to end.
milestones:
- summary cards
- side panel
- command buttons
timebox: 2026-04-22 afternoon
goal: Open a webview panel that renders summary cards, feature prep progress, owner breakdown, a selected task panel, and an event timeline.
scope_in:
- webview HTML generation
- summary cards
- selected task panel
- event feed panel
scope_out:
- edit-in-place plan mutations
- transcript sync
changed_subsystems:
- webview renderer
candidate_files:
- extension.js
forbidden_areas:
- built-in Antigravity renderer internals
constraints:
- self-contained HTML, CSS, and JS
- no remote assets
assumptions:
- webview with inline script nonce is acceptable
open_questions:
- whether layout should eventually move to a dedicated source file
risks:
- large inline HTML can become hard to maintain
regression_risks:
- broken escaping can corrupt payload rendering
security_privacy_notes:
- escape task content before injecting into HTML
non_functional_requirements:
- open under one second on the demo plan
tests_required: yes
test_levels:
- manual
- integration
test_targets:
- webview render
- selected task switching
negative_tests:
- no plan found state handled gracefully
fixtures:
- TASK-PLAN.md
- .task-plan/events.jsonl
test_data_origin:
- synthetic
oracle:
- dashboard panels all render without script errors
determinism_notes:
- selected task defaults to first task when not specified
flakiness_risk:
- medium
commands_run:
- open dashboard manually
stop_on_failure: true
expected_artifacts:
- panel mock note
- script error check
code_artifacts:
- webview generation logic
test_artifacts:
- artifacts/T-004/render-check.md
review_artifacts:
- artifacts/T-004/current-notes.md
artifact_locations:
- artifacts/T-004/render-check.md
- artifacts/T-004/current-notes.md
acceptance_criteria:
- dashboard opens
- summary, selected task, owners, and timeline panels render
- refresh command updates the view
acceptance_checks:
- no runtime errors in the webview
- selected task updates when clicking a card
exit_criteria:
- reviewer can inspect real data flow
- QA signoff still pending
rollback_plan:
- keep tree view only and defer the panel
observability:
- console errors in the webview developer tools
decision_log:
- [2026-04-22] v1 keeps all rendering in one extension file for speed of iteration.
summary_format:
- render facts
- script checks
- next owner

### TASK T-005

task_id: T-005
title: Kanban board rendering
rationale: Users need status columns to see work distribution and bottlenecks at a glance.
priority: P1
status: needs_review
owner_role: reviewer
agent_sequence:
- planner
- implementer
- reviewer
- tester
- docs_sync
required_approvals:
- code-review
max_review_loops: 2
escalation_rule:
- If the kanban is visually noisy, return to implementer with a narrower card payload instead of redesigning the whole panel.
dependencies:
- T-004
blocked_by:
- none
unblocks:
- none
task_size: M
decomposition_rule:
- Keep card rendering and status bucketing together.
milestones:
- status columns
- task cards
- selected card highlighting
timebox: 2026-04-22 afternoon
goal: Render all demo tasks into stable status columns with task cards showing owner, next role, approvals, and dependency counts.
scope_in:
- kanban column layout
- task cards
- click-to-select interactions
scope_out:
- drag and drop
- editing task status from the UI
changed_subsystems:
- webview kanban
candidate_files:
- extension.js
forbidden_areas:
- source-of-truth markdown editing
constraints:
- keep card content dense but readable
assumptions:
- 10 demo tasks are enough to validate the column layout
open_questions:
- whether approvals should display by count or by labels
risks:
- cards may become visually crowded
regression_risks:
- selected task state may desync from the side panel
security_privacy_notes:
- card titles may be sensitive in real workspaces
non_functional_requirements:
- selected card state updates immediately
tests_required: yes
test_levels:
- manual
test_targets:
- status bucketing
- selected card state
negative_tests:
- empty column renders a clear fallback
fixtures:
- TASK-PLAN.md
test_data_origin:
- synthetic
oracle:
- each task appears in the correct status column
determinism_notes:
- status order fixed
flakiness_risk:
- low
commands_run:
- open dashboard manually
stop_on_failure: true
expected_artifacts:
- review checklist
- screenshot note
code_artifacts:
- kanban renderer
test_artifacts:
- artifacts/T-005/kanban-qa.md
review_artifacts:
- artifacts/T-005/review-request.md
artifact_locations:
- artifacts/T-005/kanban-qa.md
- artifacts/T-005/review-request.md
acceptance_criteria:
- all statuses visible in a predictable order
- task selection from cards works
- owner and next-role hints are visible
acceptance_checks:
- 10 demo tasks distributed across visible columns
- selected card border updates on click
exit_criteria:
- reviewer signoff pending
rollback_plan:
- collapse kanban into a simple task list
observability:
- card click handler output in devtools if needed
decision_log:
- [2026-04-22] Kanban cards kept compact to maximize information density.
summary_format:
- render facts
- review findings
- next owner

### TASK T-006

task_id: T-006
title: Dependency graph renderer
rationale: The dashboard should show the critical path and blockers visually, not only as text fields.
priority: P2
status: blocked
owner_role: implementer
agent_sequence:
- planner
- implementer
- reviewer
- tester
- docs_sync
required_approvals:
- code-review
- qa-signoff
max_review_loops: 2
escalation_rule:
- If graph readability stays poor, escalate and reduce v1 to a simpler graph rather than blocking the whole dashboard.
dependencies:
- T-004
blocked_by:
- edge routing polish unresolved
- node density rules not finalized
unblocks:
- none
task_size: M
decomposition_rule:
- Keep layout and node-edge rendering together for now.
milestones:
- depth layout
- SVG edges
- click-to-select nodes
timebox: 2026-04-22 afternoon
goal: Render task dependencies into a simple SVG graph with colored status nodes and directional edges.
scope_in:
- node layout
- edge drawing
- graph click selection
scope_out:
- automatic cycle recovery UI
- editable graph
changed_subsystems:
- graph panel
candidate_files:
- extension.js
forbidden_areas:
- remote graph libraries
constraints:
- no external scripts
assumptions:
- demo graph depth is shallow
open_questions:
- how much text to show on each node
risks:
- edge overlap can make the graph hard to read
regression_risks:
- graph can mislead if dependencies are parsed incorrectly
security_privacy_notes:
- same sensitivity concerns as kanban titles
non_functional_requirements:
- graph should remain legible on 10 tasks
tests_required: yes
test_levels:
- manual
test_targets:
- edge count
- node selection
negative_tests:
- task with no dependencies still renders correctly
fixtures:
- TASK-PLAN.md
test_data_origin:
- synthetic
oracle:
- graph shows all declared edges
determinism_notes:
- node positions follow dependency depth
flakiness_risk:
- low
commands_run:
- open dashboard manually
stop_on_failure: true
expected_artifacts:
- blocker note
- graph polish TODO
code_artifacts:
- graph renderer
test_artifacts:
- artifacts/T-006/blocker-note.md
review_artifacts:
- none
artifact_locations:
- artifacts/T-006/blocker-note.md
acceptance_criteria:
- every declared dependency becomes an edge
- clicking a node focuses the selected task
acceptance_checks:
- edge count equals filtered dependency count
- graph remains readable
exit_criteria:
- currently blocked
rollback_plan:
- hide graph panel until layout stabilizes
observability:
- graph node coordinates visible in devtools
decision_log:
- [2026-04-22] v1 accepts a simple depth-based layout before any advanced routing.
summary_format:
- blocker facts
- next action

### TASK T-007

task_id: T-007
title: Review queue analytics
rationale: Humans should immediately see which tasks are waiting on review and why.
priority: P2
status: ready
owner_role: implementer
agent_sequence:
- planner
- implementer
- reviewer
- tester
- docs_sync
required_approvals:
- code-review
max_review_loops: 2
escalation_rule:
- If review state is ambiguous, use explicit status fields first and defer derived analytics.
dependencies:
- T-002
- T-003
blocked_by:
- none
unblocks:
- none
task_size: S
decomposition_rule:
- Keep review queue metrics in one task.
milestones:
- review queue count
- explanation text
timebox: 2026-04-22 evening
goal: Surface tasks waiting on reviewer or carrying reviewer ownership as a dedicated summary metric.
scope_in:
- review queue metric
- review-specific hints
scope_out:
- reviewer workload forecasting
changed_subsystems:
- summary cards
candidate_files:
- extension.js
forbidden_areas:
- event schema changes
constraints:
- rely on existing fields first
assumptions:
- needs_review and reviewer ownership together approximate the queue
open_questions:
- whether approved tasks should remain visible in review metrics
risks:
- derived queue rules can confuse users if too implicit
regression_risks:
- queue count drift when statuses change
security_privacy_notes:
- none
non_functional_requirements:
- card count updates on refresh
tests_required: yes
test_levels:
- manual
test_targets:
- review queue count
negative_tests:
- zero-review queue still renders
fixtures:
- TASK-PLAN.md
test_data_origin:
- synthetic
oracle:
- count matches the demo tasks
determinism_notes:
- same task should not be double-counted
flakiness_risk:
- low
commands_run:
- open dashboard manually
stop_on_failure: true
expected_artifacts:
- analytics note
code_artifacts:
- summary metric logic
test_artifacts:
- artifacts/T-007/analytics-note.md
review_artifacts:
- none
artifact_locations:
- artifacts/T-007/analytics-note.md
acceptance_criteria:
- review queue metric visible
- logic explained in code comments or notes
acceptance_checks:
- review queue count equals demo expectation
exit_criteria:
- task ready for implementation
rollback_plan:
- remove the metric and rely on status groups only
observability:
- summary metric visible in the panel
decision_log:
- [2026-04-22] Review queue uses explicit status plus owner role.
summary_format:
- metric facts
- next owner

### TASK T-008

task_id: T-008
title: Test gate analytics
rationale: The dashboard should tell humans which tasks are in or approaching the tester phase.
priority: P2
status: draft
owner_role: planner
agent_sequence:
- planner
- implementer
- reviewer
- tester
- docs_sync
required_approvals:
- design-review
- qa-signoff
max_review_loops: 2
escalation_rule:
- If test state logic becomes unclear, keep v1 on owner-role and approved-status heuristics only.
dependencies:
- T-002
blocked_by:
- metric rules not finalized
unblocks:
- none
task_size: S
decomposition_rule:
- Keep metric derivation and UI label together.
milestones:
- test queue count
- tooltip copy
timebox: 2026-04-22 evening
goal: Add a summary metric for tasks currently owned by tester or approved for testing.
scope_in:
- test queue metric
- QA-oriented summary copy
scope_out:
- automated test reruns
changed_subsystems:
- summary cards
candidate_files:
- extension.js
forbidden_areas:
- artifact generation
constraints:
- avoid double counting tasks
assumptions:
- approved status is a reasonable pre-test indicator
open_questions:
- whether done tasks should remain in historical test statistics
risks:
- metric can mislead if statuses are not maintained honestly
regression_risks:
- queue count drift
security_privacy_notes:
- none
non_functional_requirements:
- metric should update on refresh
tests_required: yes
test_levels:
- manual
test_targets:
- test queue count
negative_tests:
- empty queue state visible
fixtures:
- TASK-PLAN.md
test_data_origin:
- synthetic
oracle:
- metric matches demo state
determinism_notes:
- count rules remain deterministic
flakiness_risk:
- low
commands_run:
- none
stop_on_failure: true
expected_artifacts:
- planner note
code_artifacts:
- not started
test_artifacts:
- none
review_artifacts:
- none
artifact_locations:
- artifacts/T-008/planner-note.md
acceptance_criteria:
- test queue metric visible
- empty and non-empty states both understandable
acceptance_checks:
- metric matches demo state
exit_criteria:
- still draft
rollback_plan:
- omit the metric from v1
observability:
- summary card changes on refresh
decision_log:
- [2026-04-22] Deferred until review queue metric is stable.
summary_format:
- planning facts
- next owner

### TASK T-009

task_id: T-009
title: Demo seed data and artifacts
rationale: The dashboard needs a believable workspace with multiple states, dependencies, approvals, and artifacts.
priority: P1
status: done
owner_role: docs_sync
agent_sequence:
- planner
- implementer
- reviewer
- tester
- docs_sync
required_approvals:
- qa-signoff
max_review_loops: 1
escalation_rule:
- If the demo is unclear, add more explicit artifacts instead of increasing task count further.
dependencies:
- none
blocked_by:
- none
unblocks:
- user onboarding
task_size: M
decomposition_rule:
- Keep demo plan, prep, events, and artifacts in one deliverable.
milestones:
- 10 tasks created
- event feed written
- artifact files seeded
timebox: 2026-04-22
goal: Create a demo workspace that exercises every major dashboard panel.
scope_in:
- TASK-PLAN.md
- FEATURE-PREPARATION.md
- events.jsonl
- artifacts folder
scope_out:
- realistic production code
changed_subsystems:
- demo workspace
candidate_files:
- TASK-PLAN.md
- FEATURE-PREPARATION.md
- .task-plan/events.jsonl
- artifacts/**
forbidden_areas:
- user production repositories
constraints:
- keep paths local and deterministic
assumptions:
- demo data may be synthetic
open_questions:
- none
risks:
- demo may drift from the real recommended schema
regression_risks:
- artifact links can go stale if files move
security_privacy_notes:
- demo data must remain synthetic
non_functional_requirements:
- demo must load quickly
tests_required: yes
test_levels:
- manual
test_targets:
- all dashboard panels
negative_tests:
- some tasks intentionally incomplete or blocked
fixtures:
- demo workspace itself
test_data_origin:
- synthetic
oracle:
- all dashboard panels have meaningful content
determinism_notes:
- demo files committed as static fixtures
flakiness_risk:
- low
commands_run:
- open demo workspace manually
stop_on_failure: true
expected_artifacts:
- demo readme
- seeded artifact files
code_artifacts:
- demo files
test_artifacts:
- artifacts/T-009/demo-checklist.md
review_artifacts:
- none
artifact_locations:
- artifacts/T-009/demo-checklist.md
acceptance_criteria:
- every major status is represented
- timeline has meaningful events
- artifacts can be opened from the dashboard
acceptance_checks:
- 10 tasks visible
- events feed non-empty
- artifact buttons resolve to files
exit_criteria:
- demo complete
rollback_plan:
- delete demo workspace and keep extension only
observability:
- manual walkthrough notes
decision_log:
- [2026-04-22] Demo includes all status columns and representative artifacts.
summary_format:
- demo facts
- walkthrough notes

### TASK T-010

task_id: T-010
title: Transcript auto-sync spike
rationale: Auto-generating state from chat logs is attractive but risky, so it is tracked as a low-priority exploration.
priority: P3
status: dropped
owner_role: planner
agent_sequence:
- planner
- implementer
- reviewer
- tester
- docs_sync
required_approvals:
- design-review
max_review_loops: 1
escalation_rule:
- If transcript sync threatens source-of-truth stability, drop it from the milestone.
dependencies:
- T-002
blocked_by:
- transcript contract undefined
unblocks:
- none
task_size: M
decomposition_rule:
- only revive when a machine-readable transcript protocol exists
milestones:
- spike notes only
timebox: later
goal: Evaluate whether event files can be generated from agent transcripts without becoming authoritative.
scope_in:
- design spike only
scope_out:
- production ingestion
- automatic task status edits
changed_subsystems:
- future event pipeline
candidate_files:
- none
forbidden_areas:
- current v1 demo path
constraints:
- Markdown must remain source of truth
assumptions:
- transcript data will stay noisy for now
open_questions:
- how to distinguish user intent from agent narration
risks:
- source of truth becomes ambiguous
regression_risks:
- false status transitions from noisy transcripts
security_privacy_notes:
- transcripts can contain sensitive data and should not be ingested blindly
non_functional_requirements:
- none
tests_required: no
test_levels:
- none
test_targets:
- none
negative_tests:
- none
fixtures:
- none
test_data_origin:
- none
oracle:
- none
determinism_notes:
- none
flakiness_risk:
- high
commands_run:
- none
stop_on_failure: true
expected_artifacts:
- drop note
code_artifacts:
- none
test_artifacts:
- none
review_artifacts:
- none
artifact_locations:
- artifacts/T-010/drop-note.md
acceptance_criteria:
- task explicitly marked dropped
- rationale and risk clearly recorded
acceptance_checks:
- dropped status visible in dashboard
exit_criteria:
- dropped intentionally
rollback_plan:
- revive later under a new task id
observability:
- none
decision_log:
- [2026-04-22] Dropped from v1 to protect source-of-truth clarity.
summary_format:
- drop rationale
- revisit trigger
