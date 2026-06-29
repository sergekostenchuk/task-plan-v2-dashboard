# TASK-PLAN v2

template_note:
- This bootstrap plan is meant to be handed to another coding agent together with the matching bootstrap prompt.
- `T-001` may start immediately after runtime inputs are supplied.
- Every later task depends on validated access and install-mode decisions from `T-001`.

project: task-plan-v2-bootstrap
plan_id: BOOTSTRAP-AGENT-INSTALL-001
plan_version: 0.1.0
canonical_source: TASK-PLAN.md
dashboard_target: TASK-DASHBOARD.html
status: ready
owner_role: planner
created_at: 2026-06-29
updated_at: 2026-06-29

## Feature Layer

feature_id: BOOTSTRAP-TASK-PLAN-V2
feature_title: Fork the package or install TASK-PLAN v2 into a target repository
rationale:
- External agents need a real control document if they are expected to fork this package or install it correctly into another repository.
- A bootstrap workflow without a canonical plan usually degenerates into partial file copying and fake completion claims.
priority: P1
status: ready
goal:
- Provide a reusable, non-fiction bootstrap workflow that installs the canonical planning system into a target repository.
scope_in:
- validate runtime inputs
- prepare a standalone fork or an in-repo bootstrap target
- install canonical root planning files
- install reusable templates
- optionally install docs, prompts, examples, and dashboard assets according to requested scope
- update target `README.md` with a short entrypoint
- validate the installation
- commit, push, and open a PR only if requested and possible
scope_out:
- target product implementation work
- custom CI beyond the chosen install scope
- marketplace publication
- speculative repository restructuring unrelated to planning-system installation
changed_subsystems:
- target repository root planning docs
- `templates/`
- optional `docs/`
- optional `prompts/`
- optional `extension/task-plan-dashboard/`
- optional examples or selected media
- git branch and remote state
constraints:
- no silent mocks
- no silent placeholders
- no fake git or GitHub success
- no overwrite of unrelated target-repo files
- no secrets or machine-local profile files
- no dashboard validation command unless dashboard scope is actually installed
assumptions:
- the user will supply real runtime inputs before execution
- the package repository is available either locally or by URL
- the target repository is accessible locally and/or through GitHub when requested
open_questions:
- install mode
- install scope
- target repository path or URL
- GitHub auth availability
- whether push or PR work is required
risks:
- missing auth can block fork or PR work
- dirty target repositories can require manual conflict resolution
- over-installing optional assets can pollute an existing codebase
regression_risks:
- accidental overwrite of existing planning files
- mismatch between requested scope and installed scope
- documentation drift if README is not updated
security_privacy_notes:
- never copy secrets, local editor profiles, or private tokens
- never store machine-local installation metadata in the target repository
non_functional_requirements:
- deterministic install scope
- readable root planning files
- verification evidence recorded with real commands
milestones:
- validate inputs
- prepare fork or branch
- install core
- install optional scope
- verify and hand off
timebox:
- one validation cycle
- one repository-preparation cycle
- one install cycle
- one validation and handoff cycle
wiki_pages_to_read_before:
- `examples/agent-bootstrap/FEATURE-PREPARATION.md`
- `templates/FEATURE-PREPARATION-CHECKLIST.md`
- `templates/TASK-PLAN-v2.template.md`
- `templates/CLAUDE-CODE.tasks-projection.md`
- `templates/IMPLEMENTATION-PLAN.runtime.md`
- `docs/en/TASKS-GENERAL-INSTRUCTIONS.md`
wiki_pages_to_update_after:
- target `README.md`
- target root `FEATURE-PREPARATION.md`
- target root `TASK-PLAN.md`
wiki_facts_to_capture:
- install mode actually used
- install scope actually used
- verification commands that actually ran
- final branch, commit, and PR state if created
wiki_do_not_store:
- secrets
- private tokens
- cookies
- machine-specific profile state

## Pre-Implementation Gate

feature_preparation_path: FEATURE-PREPARATION.md
preimplementation_status: ready
entry_rule: `T-001` may move to `in_progress` once runtime inputs are provided. `T-002` through `T-005` may move to `ready` only after `T-001` validates inputs, access, and install mode.

## Active Alarms

feature_active_alarms:
- none
feature_resolved_alarms:
- none

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

## Execution Governance

mode: CODE-FIRST, NO-FICTION, ONE-TASK-ONLY
no_fiction_policy:
- if required input is missing, return `INVALID_INPUT` instead of guessing
- do not invent forks, branches, commits, pushes, pull requests, approvals, or passing checks
- critical unknowns block execution-ready states
mock_policy:
- fake installs, fake git operations, fake README updates, and fake evidence are forbidden
placeholder_policy:
- silent placeholders are forbidden in execution-ready work
- unresolved placeholders must become explicit alarms
prompt_policy:
- one task equals one prompt before `in_progress`
- every prompt must include scope, forbidden areas, and verification strategy
code_first_policy:
- install tasks must perform real file work before docs-sync closure
done_policy:
- dependencies closed
- approvals passed
- verification executed
- commands_run recorded
- rollback exists
- register and task block synchronized
failure_rule:
- failed required verification cannot be closed as `done`

## Verification Policy

verification_planning_rule:
- planner defines checks before install work
- reviewer checks the plan against requested scope
- tester runs the planned commands and records actual outputs
critical_verification_fields:
- tests_required
- test_levels
- test_targets
- test_data_origin
- oracle
- stop_on_failure
- commands_planned
test_level_enum:
- integration
- smoke
- manual-check-needed

## Task Register

| task_id | title | status | priority | owner_role | depends_on | required_approvals |
| --- | --- | --- | --- | --- | --- | --- |
| T-001 | Validate Inputs And Access | ready | P1 | planner | [] | [bootstrap-review] |
| T-002 | Prepare Fork Or Target Branch | draft | P1 | planner | [T-001] | [bootstrap-review] |
| T-003 | Install Core TASK-PLAN v2 Files | draft | P1 | planner | [T-001, T-002] | [code-review, qa-signoff] |
| T-004 | Install Optional Docs, Prompts, And Dashboard Assets | draft | P1 | planner | [T-003] | [code-review, qa-signoff] |
| T-005 | Verify, Commit, Push, And Handoff | draft | P1 | planner | [T-003, T-004] | [code-review, qa-signoff, docs-review] |

## Tasks

### TASK T-001

task_id: T-001
title: Validate Inputs And Access
rationale:
- No bootstrap work should start until install mode, target repository, scope, branch, and GitHub access state are explicit.
priority: P1
status: ready
owner_role: planner
active_alarm_ids:
- none
resolved_alarm_ids:
- none
agent_sequence:
- planner
- implementer
- reviewer
- tester
- docs_sync
agent_contracts:
- A1 planner validates the runtime input contract and blocks missing fields explicitly.
- A2 implementer inspects repository accessibility only; no install work starts here.
- A3 reviewer confirms that requested scope, mode, and auth state are coherent.
- A4 tester runs repository-state checks and records actual commands.
- A5 docs_sync records the resolved inputs back into the task summary.
required_approvals:
- bootstrap-review
max_review_loops: 2
escalation_rule:
- if install mode or target repository is still ambiguous after one clarification pass, stop with `INVALID_INPUT`
- if auth is missing for requested GitHub work, block and report it explicitly
dependencies:
- none
blocked_by:
- none
unblocks:
- T-002
- T-003
- T-004
- T-005
task_size: S
decomposition_rule:
- split only if repository-access validation must be separated from GitHub-access validation
milestones:
- validate source package
- validate target repository
- validate install mode
- validate install scope
- validate auth and branch expectations
timebox:
- one validation cycle
goal:
- Freeze all runtime inputs before branch or file work starts.
scope_in:
- input validation
- repository existence checks
- git access checks
scope_out:
- file copying
- README editing
- git push or PR creation
changed_subsystems:
- none; validation only
candidate_files:
- user-supplied source package path or URL
- user-supplied target repository path or URL
forbidden_areas:
- target repository file edits
- remote git mutations
constraints:
- no guessing
- no file edits
- no fake auth assumptions
assumptions:
- the user can answer missing-input questions if needed
open_questions:
- actual runtime values supplied by the user
risks:
- starting without validated inputs causes scope drift or fake success
regression_risks:
- none; this is a validation task
security_privacy_notes:
- do not request or store raw secrets in planning artifacts
non_functional_requirements:
- every later task has explicit inputs to reference

#### Active Alarms

active_alarms:
- none
resolved_alarms:
- none

#### Verification Strategy

tests_required: yes
test_levels:
- smoke
test_targets:
- source package reachability
- target repository reachability
- auth-state coherence
test_data_origin:
- runtime inputs supplied by the user
fixtures:
- bootstrap prompt
- bootstrap `FEATURE-PREPARATION.md`
- bootstrap `TASK-PLAN.md`
oracle:
- all required runtime inputs are explicit
- requested git operations are either feasible or blocked honestly
negative_tests:
- missing install mode returns `INVALID_INPUT`
- missing auth with requested PR returns `INVALID_INPUT`
determinism_notes:
- validation checks are deterministic for the supplied paths and auth state
flakiness_risk:
- low
stop_on_failure: true
commands_planned:
- `git status --short`
- `git remote -v`
- `pwd`
commands_run:
- no execution yet; task is still ready

#### Evidence and Closure

expected_artifacts:
- resolved runtime input set
- explicit install mode
- explicit scope
code_artifacts:
- none
test_artifacts:
- recorded validation commands
review_artifacts:
- reviewer note confirming inputs are execution-safe
artifact_locations:
- `TASK-PLAN.md`
acceptance_criteria:
- every downstream task can reference real runtime inputs
- no fake auth assumption remains
acceptance_checks:
- install mode explicit
- target repo explicit
- scope explicit
- branch explicit
exit_criteria:
- bootstrap review passed
- validation evidence recorded
rollback_plan:
- not applicable beyond clearing invalid assumptions
observability:
- validation outcome should be visible in the task summary and status
decision_log:
- [2026-06-29] Validation task created
summary_format:
- inputs resolved
- commands run
- blockers
- next task

### TASK T-002

task_id: T-002
title: Prepare Fork Or Target Branch
rationale:
- The bootstrap workflow needs the correct repository and branch before files are installed.
priority: P1
status: draft
owner_role: planner
active_alarm_ids:
- none
resolved_alarm_ids:
- none
agent_sequence:
- planner
- implementer
- reviewer
- tester
- docs_sync
agent_contracts:
- A1 planner freezes whether this is `standalone-fork` or `in-repo-bootstrap`.
- A2 implementer creates the fork or working branch in the correct repository.
- A3 reviewer checks that the repo target matches the resolved mode.
- A4 tester records real git state after branch preparation.
- A5 docs_sync records the actual repo, branch, and remote state.
required_approvals:
- bootstrap-review
max_review_loops: 2
escalation_rule:
- if the repository already has conflicting branch state, block and escalate instead of rewriting history
dependencies:
- T-001
blocked_by:
- validated runtime inputs from `T-001`
unblocks:
- T-003
task_size: S
decomposition_rule:
- split only if standalone fork and in-repo branch prep need different operators
milestones:
- create or open the correct repository
- create the requested branch
- confirm remote state
timebox:
- one repository-preparation cycle
goal:
- Ensure the bootstrap work happens in the right repository on the right branch.
scope_in:
- fork creation when requested and possible
- local checkout of the target repository
- branch creation or checkout
scope_out:
- file installation
- README editing
- PR creation
changed_subsystems:
- git remotes
- git branch state
candidate_files:
- target repository `.git` state
forbidden_areas:
- unrelated repository history rewrite
- destructive reset
constraints:
- no destructive git operations
- no fake fork success
assumptions:
- `T-001` validated access
open_questions:
- none once `T-001` is done
risks:
- remote permissions or existing branch conflicts
regression_risks:
- accidental work in the wrong repository
security_privacy_notes:
- do not print secrets or tokens into logs
non_functional_requirements:
- final repo and branch state must be unambiguous

#### Active Alarms

active_alarms:
- none
resolved_alarms:
- none

#### Verification Strategy

tests_required: yes
test_levels:
- integration
- smoke
test_targets:
- repository identity
- branch identity
- remote identity
test_data_origin:
- live git state
fixtures:
- target repository
oracle:
- worktree points at the intended repository and branch
- remote state matches requested mode
negative_tests:
- do not continue if branch creation fails
- do not continue if fork was requested but not created
determinism_notes:
- git identity checks are deterministic
flakiness_risk:
- low
stop_on_failure: true
commands_planned:
- `git status --short`
- `git remote -v`
- `git branch --show-current`
commands_run:
- no execution yet; task is still draft

#### Evidence and Closure

expected_artifacts:
- branch prepared
- remote state recorded
code_artifacts:
- repository branch state only
test_artifacts:
- recorded git-state commands
review_artifacts:
- reviewer note confirming correct repository target
artifact_locations:
- `TASK-PLAN.md`
acceptance_criteria:
- bootstrap work is pointed at the correct repo and branch
acceptance_checks:
- repo identity confirmed
- branch identity confirmed
- remote identity confirmed
exit_criteria:
- bootstrap review passed
- git state recorded
rollback_plan:
- delete the working branch or abandon the fork if preparation was incorrect
observability:
- repo and branch should be stated explicitly in the task summary
decision_log:
- [2026-06-29] Repository-preparation task created
summary_format:
- repo
- branch
- remote state
- next task

### TASK T-003

task_id: T-003
title: Install Core TASK-PLAN v2 Files
rationale:
- The canonical planning system is not installed until the target repository has root planning files and reusable templates.
priority: P1
status: draft
owner_role: planner
active_alarm_ids:
- none
resolved_alarm_ids:
- none
agent_sequence:
- planner
- implementer
- reviewer
- tester
- docs_sync
agent_contracts:
- A1 planner freezes the exact core file set.
- A2 implementer installs core files and preserves unrelated repository contents.
- A3 reviewer checks boundary compliance and root-file correctness.
- A4 tester verifies the file set exists where expected.
- A5 docs_sync records the installed core paths and any target-repo-specific adaptations.
required_approvals:
- code-review
- qa-signoff
max_review_loops: 2
escalation_rule:
- if target-root planning files already exist and conflict materially, block instead of overwriting silently
dependencies:
- T-001
- T-002
blocked_by:
- correct repository and branch from `T-002`
unblocks:
- T-004
- T-005
task_size: M
decomposition_rule:
- split only if root planning files and templates need separate ownership
milestones:
- install root `FEATURE-PREPARATION.md`
- install root `TASK-PLAN.md`
- install canonical templates
- adapt root planning docs to the target repository
timebox:
- one install cycle
goal:
- Leave the target repository with the canonical root planning system installed.
scope_in:
- root `FEATURE-PREPARATION.md`
- root `TASK-PLAN.md`
- `templates/FEATURE-PREPARATION-CHECKLIST.md`
- `templates/TASK-PLAN-v2.template.md`
- `templates/CLAUDE-CODE.tasks-projection.md`
- `templates/IMPLEMENTATION-PLAN.runtime.md`
scope_out:
- optional docs and prompts
- optional dashboard extension
- push and PR work
changed_subsystems:
- target repository root planning files
- target `templates/`
candidate_files:
- target root `FEATURE-PREPARATION.md`
- target root `TASK-PLAN.md`
- target `templates/`
forbidden_areas:
- unrelated product code
- unrelated repo docs unless required for root bootstrap references
constraints:
- preserve existing product files
- do not silently replace existing planning docs with incompatible content
- no fake copied files
assumptions:
- target repository accepts the core planning layout
open_questions:
- target-specific feature title and scope wording
risks:
- existing planning assets may need merge logic
regression_risks:
- repository README may still not point to the new system until later tasks
security_privacy_notes:
- do not import secrets from the source package
non_functional_requirements:
- core files should be readable and canonical

#### Active Alarms

active_alarms:
- none
resolved_alarms:
- none

#### Verification Strategy

tests_required: yes
test_levels:
- smoke
- manual-check-needed
test_targets:
- root planning files
- template file set
- scope-boundary compliance
test_data_origin:
- live target repository filesystem
fixtures:
- package templates
- bootstrap planning workspace
oracle:
- target root contains `FEATURE-PREPARATION.md` and `TASK-PLAN.md`
- target `templates/` contains the canonical file set
- unrelated product code was not modified
negative_tests:
- stop if an existing root plan would be overwritten incorrectly
- stop if required template files are missing after copy
determinism_notes:
- file existence checks are deterministic
flakiness_risk:
- low
stop_on_failure: true
commands_planned:
- `git status --short`
- `rg --files . | rg "FEATURE-PREPARATION.md|TASK-PLAN.md|templates/"`
- `ls -la templates`
commands_run:
- no execution yet; task is still draft

#### Evidence and Closure

expected_artifacts:
- root planning files
- installed template set
- boundary-safe file diff
code_artifacts:
- target root planning files
- target `templates/`
test_artifacts:
- file-existence command outputs
review_artifacts:
- reviewer note confirming only approved paths changed
artifact_locations:
- target root
- target `templates/`
acceptance_criteria:
- the core planning system is installed
- target root files are repository-specific, not generic leftovers
acceptance_checks:
- root files exist
- templates exist
- diff stays within scope
exit_criteria:
- code review passed
- QA signoff passed
- verification recorded
rollback_plan:
- revert copied root and template files if the install was wrong
observability:
- file paths and git diff should make the install visible immediately
decision_log:
- [2026-06-29] Core-install task created
summary_format:
- files installed
- repo-specific adaptations
- checks run
- next task

### TASK T-004

task_id: T-004
title: Install Optional Docs, Prompts, And Dashboard Assets
rationale:
- Some repositories only need the core planning system, while others need docs, prompts, and the dashboard extension.
priority: P1
status: draft
owner_role: planner
active_alarm_ids:
- none
resolved_alarm_ids:
- none
agent_sequence:
- planner
- implementer
- reviewer
- tester
- docs_sync
agent_contracts:
- A1 planner freezes the optional install scope.
- A2 implementer installs only the requested optional assets.
- A3 reviewer checks scope boundaries and rejects over-installation.
- A4 tester runs optional-scope validation, including dashboard checks when relevant.
- A5 docs_sync records what optional assets were installed or intentionally skipped.
required_approvals:
- code-review
- qa-signoff
max_review_loops: 2
escalation_rule:
- if the requested optional scope conflicts with the target repository structure, block and escalate instead of forcing the install
dependencies:
- T-003
blocked_by:
- core install complete
unblocks:
- T-005
task_size: M
decomposition_rule:
- split only if dashboard install needs a separate operator from docs and prompts
milestones:
- install requested docs
- install requested prompts
- install requested dashboard assets if `full` scope was selected
- preserve optional assets not requested by the user
timebox:
- one optional-scope cycle
goal:
- Install only the optional surfaces the user explicitly requested.
scope_in:
- `docs/` when requested
- `prompts/` when requested
- `extension/task-plan-dashboard/` when requested
- `examples/demo-en/` and `examples/demo-ru/` when requested
- selected `media/` only when explicitly requested
scope_out:
- any optional surface not requested by the chosen scope
- unrelated target product assets
changed_subsystems:
- optional docs, prompts, extension, examples, and selected media
candidate_files:
- target `docs/`
- target `prompts/`
- target `extension/task-plan-dashboard/`
- target `examples/demo-en/`
- target `examples/demo-ru/`
- target selected `media/`
forbidden_areas:
- optional assets not approved by scope
- unrelated product directories
constraints:
- no scope widening
- dashboard checks only if dashboard scope is installed
- media copies only if explicitly requested
assumptions:
- the target repository can host the selected optional assets
open_questions:
- whether media is desired
risks:
- over-installation can clutter the target repo
- dashboard assets may require Node for verification
regression_risks:
- README or docs references can drift if partial optional scope is installed
security_privacy_notes:
- keep repository-safe assets only
non_functional_requirements:
- optional assets should remain navigable and self-describing

#### Active Alarms

active_alarms:
- none
resolved_alarms:
- none

#### Verification Strategy

tests_required: yes
test_levels:
- integration
- smoke
- manual-check-needed
test_targets:
- optional file presence
- optional scope boundaries
- dashboard syntax and locale validity when relevant
test_data_origin:
- live target repository filesystem
fixtures:
- package docs
- package prompts
- package dashboard extension
oracle:
- only the requested optional assets are installed
- dashboard assets pass syntax and locale checks when installed
negative_tests:
- stop if a non-requested optional surface would be copied
- stop if dashboard syntax fails after install
determinism_notes:
- file-presence checks are deterministic
- dashboard validation depends on Node availability
flakiness_risk:
- low
stop_on_failure: true
commands_planned:
- `git status --short`
- `rg --files docs prompts extension examples media`
- `node -c extension/task-plan-dashboard/extension.js`
- `node -e "const fs=require('fs'); const path=require('path'); const dir='extension/task-plan-dashboard/resources/locales'; if (fs.existsSync(dir)) { for (const name of fs.readdirSync(dir)) { if (name.endsWith('.json')) { JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')); } } }"`
commands_run:
- no execution yet; task is still draft

#### Evidence and Closure

expected_artifacts:
- requested optional assets installed
- optional-scope validation evidence
code_artifacts:
- target optional asset paths selected by scope
test_artifacts:
- scope-validation and optional-dashboard command outputs
review_artifacts:
- reviewer note confirming no over-installation
artifact_locations:
- target optional asset paths
acceptance_criteria:
- selected optional scope is installed and nothing more
- dashboard assets validate if installed
acceptance_checks:
- installed scope matches requested scope
- optional validations recorded
exit_criteria:
- code review passed
- QA signoff passed
- optional validation recorded
rollback_plan:
- remove optional assets that were installed incorrectly
observability:
- file paths and git diff should show the optional install clearly
decision_log:
- [2026-06-29] Optional-scope task created
summary_format:
- optional scope installed
- files changed
- checks run
- remaining gaps

### TASK T-005

task_id: T-005
title: Verify, Commit, Push, And Handoff
rationale:
- Bootstrap work is only useful when verification is real, README entrypoints exist, and git outcomes match reality.
priority: P1
status: draft
owner_role: planner
active_alarm_ids:
- none
resolved_alarm_ids:
- none
agent_sequence:
- planner
- implementer
- reviewer
- tester
- docs_sync
agent_contracts:
- A1 planner freezes the final verification matrix from the selected scope.
- A2 implementer applies only closure edits, including target README entrypoint updates.
- A3 reviewer checks README accuracy, diff boundaries, and git claims.
- A4 tester runs the final command set and records actual results.
- A5 docs_sync finalizes evidence, summary, commit, push, and PR state.
required_approvals:
- code-review
- qa-signoff
- docs-review
max_review_loops: 2
escalation_rule:
- if required verification fails, reopen the failing install task instead of closing bootstrap
- if push or PR was requested but still impossible, mark the bootstrap as blocked with the exact reason
dependencies:
- T-003
- T-004
blocked_by:
- installed scope must be complete
unblocks:
- none
task_size: M
decomposition_rule:
- split only if git handoff becomes materially separate from README or verification work
milestones:
- update target `README.md`
- run final verification
- commit if requested
- push if requested and possible
- open PR if requested and possible
- produce final handoff report
timebox:
- one closure cycle
goal:
- Close the bootstrap honestly with real verification and real git state.
scope_in:
- target `README.md` entrypoint update
- final verification commands
- commit, push, and PR work when requested
- final summary and evidence sync
scope_out:
- new feature work
- unrequested repository cleanup
changed_subsystems:
- target `README.md`
- git history and PR state if requested
candidate_files:
- target `README.md`
- all installed planning paths for verification
forbidden_areas:
- unrelated product docs rewrites
- fake commit or PR claims
constraints:
- README must describe real installed entrypoints
- commit, push, and PR claims must match reality
- no closure without recorded commands
assumptions:
- earlier tasks installed the requested scope cleanly
open_questions:
- whether the user wants a single bootstrap commit or a small commit stack
risks:
- final verification may surface hidden scope drift
- PR creation may still be blocked by permissions
regression_risks:
- README can drift from installed scope if not reviewed carefully
security_privacy_notes:
- do not leak credentials in git remotes or logs
non_functional_requirements:
- final report should be short, accurate, and reusable by the repository owner

#### Active Alarms

active_alarms:
- none
resolved_alarms:
- none

#### Verification Strategy

tests_required: yes
test_levels:
- integration
- smoke
- manual-check-needed
test_targets:
- final file set
- target `README.md`
- git status
- commit, push, and PR state when requested
test_data_origin:
- live repository state
fixtures:
- target repository
- installed planning paths
oracle:
- installed files match requested scope
- README points to the real entrypoints
- commit, push, and PR state are reported truthfully
negative_tests:
- do not mark done if verification commands fail
- do not report push or PR success if they did not happen
determinism_notes:
- file and git-state checks are deterministic
- PR creation depends on remote permissions
flakiness_risk:
- low
stop_on_failure: true
commands_planned:
- `git status --short`
- `git diff --stat`
- `rg --files . | rg "FEATURE-PREPARATION.md|TASK-PLAN.md|templates|docs|prompts|extension/task-plan-dashboard"`
- `git rev-parse HEAD`
commands_run:
- no execution yet; task is still draft

#### Evidence and Closure

expected_artifacts:
- updated target `README.md`
- final verification evidence
- commit SHA if created
- PR URL if created
code_artifacts:
- target `README.md`
- installed planning paths
test_artifacts:
- final command outputs
review_artifacts:
- reviewer note confirming README and git-state honesty
artifact_locations:
- target repository root
acceptance_criteria:
- target repository has a usable planning entrypoint
- final verification is recorded
- git outcome matches reality
acceptance_checks:
- README updated
- commands_run populated with real executions
- commit SHA present only if a commit was actually created
- PR URL present only if a PR was actually created
exit_criteria:
- code review passed
- QA signoff passed
- docs review passed
- final evidence recorded
rollback_plan:
- revert README and bootstrap install commits if closure was incorrect
observability:
- final branch, commit, and PR state should be explicit in the summary
decision_log:
- [2026-06-29] Closure task created
summary_format:
- scope installed
- commands run
- commit state
- PR state
