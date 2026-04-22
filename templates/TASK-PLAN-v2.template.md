# TASK-PLAN v2

project:
plan_id:
plan_version:
canonical_source: TASK-PLAN.md
dashboard_target: TASK-DASHBOARD.html
status: draft
owner_role: planner
created_at:
updated_at:

## Feature Layer

feature_id:
feature_title:
rationale:
priority:
status:
goal:
scope_in:
- TBD
scope_out:
- TBD
changed_subsystems:
- TBD
constraints:
- TBD
assumptions:
- TBD
open_questions:
- TBD
risks:
- TBD
regression_risks:
- TBD
security_privacy_notes:
- TBD
non_functional_requirements:
- TBD
milestones:
- TBD
timebox:
wiki_pages_to_read_before:
- TBD
wiki_pages_to_update_after:
- TBD
wiki_facts_to_capture:
- TBD
wiki_do_not_store:
- secrets
- personal data

## Pre-Implementation Gate

feature_preparation_path: FEATURE-PREPARATION.md
preimplementation_status: draft
entry_rule: No implementation task may move to ready until the feature-preparation gate is complete.

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
| T-001 | Example task | draft | P1 | planner | [] | [design-review, code-review] |

## Tasks

### TASK T-001

task_id: T-001
title:
rationale:
priority: P1
status: draft
owner_role: planner
agent_sequence:
- planner
- implementer
- reviewer
- tester
- docs_sync
agent_contracts:
- A1
- A2
- A3
- A4
- A5
required_approvals:
- design-review
- code-review
- qa-signoff
max_review_loops: 2
escalation_rule:
- if review loops exceed max_review_loops, escalate to project owner or tech lead
- if a blocker changes scope, send the task back to planner
dependencies:
- TBD
blocked_by:
- TBD
unblocks:
- TBD
task_size: M
decomposition_rule:
- split the task if it touches 3+ subsystems or mixes product and infra changes
milestones:
- TBD
timebox:
goal:
scope_in:
- TBD
scope_out:
- TBD
changed_subsystems:
- TBD
candidate_files:
- TBD
forbidden_areas:
- TBD
constraints:
- TBD
assumptions:
- TBD
open_questions:
- TBD
risks:
- TBD
regression_risks:
- TBD
security_privacy_notes:
- TBD
non_functional_requirements:
- TBD
tests_required: yes
test_levels:
- unit
- integration
test_targets:
- TBD
negative_tests:
- TBD
fixtures:
- TBD
test_data_origin:
- synthetic
oracle:
- TBD
determinism_notes:
- TBD
flakiness_risk:
- TBD
commands_run:
- TBD
stop_on_failure: true
expected_artifacts:
- updated code
- test evidence
- review notes
code_artifacts:
- TBD
test_artifacts:
- TBD
review_artifacts:
- TBD
artifact_locations:
- TBD
acceptance_criteria:
- TBD
acceptance_checks:
- TBD
exit_criteria:
- code merged or locally validated
- required approvals collected
- required artifacts stored
rollback_plan:
- revert the code change
- disable the feature flag if present
observability:
- TBD
decision_log:
- [YYYY-MM-DD] Initial task created
summary_format:
- changed files
- checks run
- blockers
- next owner

#### Agent Contracts

##### A1
agent_id: A1
role: planner
entry_criteria:
- feature-preparation gate is complete
- dependencies are understood
input_artifacts:
- FEATURE-PREPARATION.md
- TASK-PLAN.md
steps:
- refine scope
- freeze candidate files
- resolve open questions or mark blockers
output_artifacts:
- updated task block
- planner handoff note
handoff_to: A2
approval_gate:
- design-review
stop_conditions:
- missing dependency
- unresolved scope conflict

##### A2
agent_id: A2
role: implementer
entry_criteria:
- planner handoff complete
- candidate files frozen
input_artifacts:
- updated task block
- planner handoff note
steps:
- implement the scoped change
- keep within allowed files
- record code artifacts
output_artifacts:
- code diff
- implementation notes
handoff_to: A3
approval_gate:
- code-review
stop_conditions:
- scope break
- blocked environment

##### A3
agent_id: A3
role: reviewer
entry_criteria:
- implementation diff exists
input_artifacts:
- code diff
- implementation notes
steps:
- review correctness and boundary adherence
- request correction or approve
output_artifacts:
- review notes
- approval or correction request
handoff_to: A4
approval_gate:
- code-review
stop_conditions:
- review loop exhausted

##### A4
agent_id: A4
role: tester
entry_criteria:
- review approved or conditionally approved
input_artifacts:
- code diff
- review notes
steps:
- execute required checks
- record failures and evidence
output_artifacts:
- test report
- logs or screenshots
handoff_to: A5
approval_gate:
- qa-signoff
stop_conditions:
- required test failure
- missing test data

##### A5
agent_id: A5
role: docs_sync
entry_criteria:
- tests passed or accepted per policy
input_artifacts:
- test report
- final decision
steps:
- sync docs or wiki targets
- close the task record
output_artifacts:
- updated docs
- final summary
handoff_to:
approval_gate:
- completion-signoff
stop_conditions:
- wiki target unresolved

## Dependency Graph

```mermaid
flowchart TD
    T001["T-001: Example task"]
```
