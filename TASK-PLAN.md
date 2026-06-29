# TASK-PLAN v2

template_note:
- This plan is already normalized for the Task Plan Dashboard extension workflow.
- No silent mock, silent placeholder, or invented evidence is allowed.
- Only `T-001` is ready to start immediately; all code-bearing tasks stay `draft` until `T-001` freezes the final runtime decisions.

project: task-plan-v2-dashboard
plan_id: EXT-DEMO-PARITY-PLAN-001
plan_version: 0.1.0
canonical_source: TASK-PLAN.md
dashboard_target: TASK-DASHBOARD.html
status: ready
owner_role: planner
created_at: 2026-06-29
updated_at: 2026-06-29

## Feature Layer

feature_id: EXT-DEMO-PARITY
feature_title: Demo Animated Web Parity For The Production Task Plan Dashboard Extension
rationale:
- The public repository already shows a richer standalone demo than the actual extension.
- The production webview must absorb the demo's useful behaviors without breaking the Markdown-first dashboard model.
priority: P1
status: ready
goal:
- Ship a production-ready extension experience that matches the demo for live language switching, audio controls, role-based TTS, and smarter dependency routing.
scope_in:
- `extension/task-plan-dashboard/extension.js` webview HTML, CSS, and client script updates
- locale expansion in `extension/task-plan-dashboard/resources/locales/`
- default BGM wiring for the repository-local asset `media/deep-techno-mix-2026.mp3`
- any required `package.json` configuration update if the language model is extended beyond `auto`, `en`, and `ru`
- regression validation against the existing demo workspaces and the standalone HTML demo
- extension-facing documentation sync if the operator workflow changes
scope_out:
- marketplace publishing or VSIX packaging
- external audio services, remote APIs, or telemetry
- server-side TTS
- broad dashboard redesign outside the requested parity areas
- changes to unrelated dirty worktree files unless a reviewer explicitly widens scope
changed_subsystems:
- extension runtime webview renderer
- locale resources
- bundled media asset resolution
- dependency graph routing logic
- extension configuration schema if required
- extension-facing documentation
constraints:
- keep Markdown as the canonical source of truth
- keep the extension plain JavaScript unless an explicit follow-up task authorizes a build step
- do not invent `npm run watch`; `extension/task-plan-dashboard/package.json` currently has no scripts
- do not overwrite unrelated dirty worktree changes already present in docs, templates, or other files
- no mocks, fake translations, fake audio backends, or silent placeholders
- no machine-specific Antigravity metadata in the repository
assumptions:
- `examples/demo-animated-web.html` is the visual and behavior reference
- manual smoke checks in the extension host are acceptable because this repo does not ship an automated UI harness
- `examples/demo-en` and `examples/demo-ru` are stable fixtures for dashboard validation
- `media/deep-techno-mix-2026.mp3` is the baseline BGM source for the extension integration
open_questions:
- whether the in-webview language switcher should also widen the persisted extension configuration enum
- whether TTS is automatic on specific step events or only user-triggered
- whether the audio drawer should stay single-track by default or preserve the demo upload workflow as an additional advanced path
risks:
- live DOM relabeling can leave stale labels if the update model is incomplete
- webview audio rules may block autoplay without user gesture
- speech synthesis behavior differs across platforms and voice availability
- graph routing changes can regress existing line rendering if redraw timing is fragile
regression_risks:
- current `en` and `ru` fallback behavior
- current graph redraw behavior in the dashboard
- task card interaction and panel responsiveness
- language persistence and refresh behavior
security_privacy_notes:
- no external network calls are needed for this feature
- no microphone or user audio capture is allowed
- audio and speech use browser-provided client APIs only when available
non_functional_requirements:
- no syntax regressions in `extension.js`
- no JSON parse regressions in locale files
- graceful degradation when speech or audio playback is unavailable
- reduced visual line tangling in the dependency graph
- dashboard remains usable on existing supported panel sizes
milestones:
- freeze parity scope and runtime constraints
- ship locale switcher and locale pack
- ship audio drawer and independent BGM or SFX controls
- ship role-based TTS helper
- ship optimal dependency routing
- complete regression validation and docs sync
timebox:
- one planning cycle for `T-001`
- four implementation cycles for `T-002` through `T-005`
- one closure cycle for `T-006`
wiki_pages_to_read_before:
- `FEATURE-PREPARATION.md`
- `examples/demo-animated-web.html`
- `examples/demo-en/TASK-PLAN.md`
- `examples/demo-ru/TASK-PLAN.md`
- `extension/task-plan-dashboard/README.md`
- `extension/task-plan-dashboard/package.json`
- `docs/reference/dashboard-contract.md`
wiki_pages_to_update_after:
- `extension/task-plan-dashboard/README.md`
- `README.md`
- `docs/en/TASKS-GENERAL-INSTRUCTIONS.md` only if operator workflow changes must be documented there
- `docs/ru/TASKS-GENERAL-INSTRUCTIONS.md` only if operator workflow changes must be documented there
wiki_facts_to_capture:
- supported dashboard languages
- runtime fallback behavior for speech and audio
- the extension-side URI strategy for `media/deep-techno-mix-2026.mp3`
- dependency graph routing contract
- exact no-build-step validation workflow for the extension
wiki_do_not_store:
- secrets
- personal data
- machine-specific Antigravity installation metadata
- local absolute profile paths outside repository-root references

## Pre-Implementation Gate

feature_preparation_path: FEATURE-PREPARATION.md
preimplementation_status: ready
entry_rule: `T-001` may move to `in_progress` immediately. `T-002` through `T-006` may move to `ready` only after `T-001` resolves the runtime decisions for language persistence, TTS trigger mode, and bundled mp3 URI strategy.

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
- do not invent files, commits, test results, approvals, blockers, or artifact paths
- use explicit unknowns only in non-critical planning notes
- critical unknowns block `ready`, `in_progress`, `approved`, and `done`
mock_policy:
- mocks, stubs, fake integrations, dummy outputs, and pretend backends are forbidden by default
- if a mock is temporarily unavoidable, create an explicit active alarm instead of hiding it in prose
- each active mock alarm must state `missing_to_replace`, `replacement_target`, `replacement_plan`, and `blocks`
placeholder_policy:
- silent placeholders are forbidden
- placeholder translation strings are forbidden
- placeholder audio assets are forbidden
- placeholder evidence is forbidden
- placeholder tests are forbidden
alarm_propagation_policy:
- every active alarm must be copied into the task prompt
- every active alarm must be copied into runtime projections
- every active alarm must be repeated in handoff summaries until resolved
- each alarm must say exactly what is missing to replace the temporary element
prompt_policy:
- one task equals one prompt
- every execution prompt must include `RESUME_FROM`
- every execution prompt must include `scope_in`, `scope_out`, `forbidden_areas`, and `verification_strategy`
- every relevant active alarm must be included in the prompt
code_first_policy:
- implementation tasks require concrete code progress before docs-sync closure
- docs-only closure is allowed only for explicit docs tasks
- planning notes cannot close implementation tasks
done_policy:
- dependencies are `done` or explicitly accepted as external pending dependency
- required approvals passed
- planned verification executed
- `commands_run` recorded with real executed actions only
- test evidence recorded when `tests_required` is `yes`
- review evidence recorded
- rollback plan exists
- Task Register and Task Block are synchronized
- no forbidden area was touched without reviewer approval
commit_policy:
- implementation tasks require implementation evidence
- docs sync is separate from implementation evidence
- if commits are produced later, full SHAs must be verified with `git rev-parse` and be reachable from `HEAD`
sync_audit_policy:
- Task Register status must match each Task Block
- `owner_role` must match the active execution state
- dependencies and unblocks must be bidirectional
- dashboard projections must not contradict `TASK-PLAN.md`
boundary_audit_policy:
- forbidden areas must be checked before `done`
- changes outside scope require reviewer approval
- scope violations move the task to `needs_review` or `blocked`
rollback_policy:
- failed required checks cannot go to `done`
- choose `REVERT` or `FORWARD_FIX`
- reopened tasks require a new prompt with `RESUME_FROM`
- direct reopen-to-done is forbidden
timeout_escalation_policy:
- work beyond the declared timebox requires escalation
- review loops beyond the cap require escalation
- every blocker must be named explicitly in `blocked_by`

## Verification Policy

verification_planning_rule:
- planner defines verification before implementer starts
- reviewer validates the verification strategy before code-review approval
- tester executes planned checks and records `commands_run` plus `test_artifacts`
- implementer must not silently weaken planned checks after coding
critical_verification_fields:
- tests_required
- test_levels
- test_targets
- test_data_origin
- oracle
- stop_on_failure
- commands_planned
test_level_enum:
- unit
- integration
- e2e
- smoke
- manual-check-needed
planned_vs_executed_rule:
- `commands_planned` is filled before implementation
- `commands_run` is filled only after actual execution
- `commands_run` must never be copied from `commands_planned` unless it truly ran
failure_rule:
- if `stop_on_failure` is `true`, the task cannot pass to `docs_sync` after a required red check
- failed checks require `blocked`, `reopened`, `revert`, or `forward-fix`

## Task Register

| task_id | title | status | priority | owner_role | depends_on | required_approvals |
| --- | --- | --- | --- | --- | --- | --- |
| T-001 | Parity Audit And Runtime Freeze | ready | P1 | planner | [] | [plan-review] |
| T-002 | Locale Pack Expansion And Live Language Switcher | draft | P1 | planner | [T-001] | [code-review, qa-signoff] |
| T-003 | Audio Drawer And Independent BGM Or SFX Controls | draft | P1 | planner | [T-001, T-002] | [code-review, qa-signoff] |
| T-004 | Role-Based TTS Bubble Narration | draft | P1 | planner | [T-001, T-002] | [code-review, qa-signoff] |
| T-005 | Optimal Port Routing For Dependency Graph | draft | P1 | planner | [T-001] | [code-review, qa-signoff] |
| T-006 | End-To-End Validation And Docs Sync | draft | P1 | planner | [T-002, T-003, T-004, T-005] | [code-review, qa-signoff, docs-review] |

## Tasks

### TASK T-001

task_id: T-001
title: Parity Audit And Runtime Freeze
rationale:
- The implementation prompt contains real targets, but several runtime decisions must be frozen before code work starts so later tasks do not invent behavior or change scope mid-flight.
- The demo already contains routing and audio-drawer reference behavior, while the extension still lacks those features.
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
- A1 planner compares the demo, current extension, and locale schema and freezes the implementation boundary.
- A2 implementer updates only planning artifacts or scoped audit notes produced by this task.
- A3 reviewer confirms that scope, candidate files, and verification are explicit and non-contradictory.
- A4 tester verifies that planned commands are real and available in this repository.
- A5 docs_sync synchronizes the final frozen decisions back into the task block before closure.
required_approvals:
- plan-review
max_review_loops: 2
escalation_rule:
- if the runtime decisions cannot be frozen without changing product scope, escalate to the project owner
- if the audit discovers a missing repository dependency for parity, block downstream tasks explicitly
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
- split only if parity audit uncovers a separate infra or asset-preparation track
milestones:
- compare current extension against `examples/demo-animated-web.html`
- freeze language persistence approach
- freeze TTS trigger mode
- freeze the webview URI strategy for `media/deep-techno-mix-2026.mp3`
- confirm exact candidate files for downstream tasks
timebox:
- one planning cycle
goal:
- Produce a non-fiction implementation freeze for all downstream code tasks.
- Confirm that graph routing changes belong to the demo reference and not the current extension baseline.
scope_in:
- read-only comparison of the demo HTML and current extension runtime
- decision capture for locale switching, TTS trigger behavior, and bundled mp3 URI resolution
- verification contract finalization for downstream tasks
scope_out:
- editing `extension.js`
- editing locale JSON files
- editing docs outside this plan unless scope freeze requires a planning note
changed_subsystems:
- planning artifacts only
candidate_files:
- `TASK-PLAN.md`
- `FEATURE-PREPARATION.md`
- read-only inspection of `extension/task-plan-dashboard/extension.js`
- read-only inspection of `extension/task-plan-dashboard/package.json`
- read-only inspection of `extension/task-plan-dashboard/resources/locales/`
- read-only inspection of `media/deep-techno-mix-2026.mp3`
forbidden_areas:
- any production code change
- unrelated dirty worktree files in `docs/` or `templates/`
- machine-local metadata
constraints:
- no placeholder decision text
- every downstream command must be executable in this repository
- the bundled mp3 path must be repository-relative and webview-safe
- if a required runtime decision stays unresolved, downstream tasks remain `draft`
assumptions:
- the existing prompt and demo are sufficient to freeze the implementation path
open_questions:
- whether to persist language choice through extension config, webview state, or both
- whether TTS is passive, explicit, or event-driven
- whether the demo upload flow should remain as a secondary capability after the bundled track is added
risks:
- downstream tasks start with contradictory assumptions if this audit is weak
regression_risks:
- low direct runtime risk because this task is planning-only
security_privacy_notes:
- planning-only task; no new data surface
non_functional_requirements:
- downstream tasks must be unambiguous after closure

#### Active Alarms

active_alarms:
- none
resolved_alarms:
- none

#### Verification Strategy

tests_required: no
test_levels:
- manual-check-needed
test_targets:
- prompt scope
- current extension runtime constraints
- availability of planned local commands
test_data_origin:
- repository-local source files
fixtures:
- `examples/demo-animated-web.html`
- `examples/demo-en/TASK-PLAN.md`
- `examples/demo-ru/TASK-PLAN.md`
oracle:
- downstream tasks contain explicit scope, candidate files, and real verification commands
- no required field is left as a placeholder
negative_tests:
- reject any invented build step
- reject any task that depends on a silent mock or placeholder
determinism_notes:
- repository file inspection is deterministic
flakiness_risk:
- low
stop_on_failure: true
commands_planned:
- `rg -n "resolveDashboardLanguage|loadDashboardStrings|renderWebview|renderGraph" extension/task-plan-dashboard/extension.js`
- `sed -n '1,220p' extension/task-plan-dashboard/package.json`
- `find extension/task-plan-dashboard/resources/locales -maxdepth 1 -type f | sort`
commands_run:
- no execution yet; task is still ready

#### Evidence and Closure

expected_artifacts:
- frozen implementation decisions
- updated task plan fields for downstream tasks
- review note confirming no invented commands or scope drift
code_artifacts:
- none; this is a planning task
test_artifacts:
- updated verification fields in `TASK-PLAN.md`
review_artifacts:
- reviewer signoff captured in the task summary
artifact_locations:
- `TASK-PLAN.md`
- `FEATURE-PREPARATION.md`
acceptance_criteria:
- downstream implementation tasks can start without inventing missing behavior
- language, TTS, bundled mp3 URI, and graph-baseline decisions are explicit
- planned commands match the actual repository shape
acceptance_checks:
- no `TBD` or silent placeholder remains
- no downstream task references a non-existent script
- the candidate file lists are concrete
exit_criteria:
- scope freeze recorded
- plan review collected
- Task Register remains synchronized
rollback_plan:
- revert only planning-document edits if the freeze is incorrect
observability:
- progress is visible in the dashboard by promoting downstream tasks from `draft` only after freeze
decision_log:
- [2026-06-29] Initial parity audit task created
summary_format:
- decisions frozen
- commands validated
- downstream tasks unblocked
- remaining open items

### TASK T-002

task_id: T-002
title: Locale Pack Expansion And Live Language Switcher
rationale:
- The production extension currently exposes a smaller language model than the demo and must support live in-session relabeling without reopening the dashboard.
- The demo parity reference already contains the new dependency routing behavior, so language work must avoid mixing in unrelated graph changes.
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
- A1 planner freezes the locale persistence choice from `T-001` before code starts.
- A2 implementer updates locale resources and webview label-refresh logic only within scoped files.
- A3 reviewer checks fallback behavior, missing-key handling, and config boundary compliance.
- A4 tester runs syntax and JSON parse checks plus live language-switch smoke validation.
- A5 docs_sync records supported languages and fallback behavior if the operator workflow changes.
required_approvals:
- code-review
- qa-signoff
max_review_loops: 2
escalation_rule:
- if the runtime needs a wider configuration enum than originally frozen, escalate before touching unrelated config surfaces
- if translations cannot be delivered with real values, block the task instead of using placeholders
dependencies:
- T-001
blocked_by:
- T-001 must freeze language persistence and config scope
unblocks:
- T-003
- T-004
- T-006
task_size: M
decomposition_rule:
- split only if config-schema work becomes materially separate from webview relabeling
milestones:
- add required `webview` locale keys for all supported languages
- create `es.json`, `fr.json`, `de.json`, `zh.json`, and `ja.json` with real translations
- implement live DOM label update path
- preserve fallback behavior for missing or unsupported locales
timebox:
- one implementation cycle
goal:
- Deliver real multi-language support with live DOM updates in the production dashboard.
scope_in:
- locale JSON updates under `extension/task-plan-dashboard/resources/locales/`
- in-webview language switcher and live text refresh behavior in `extension.js`
- `package.json` language enum update only if `T-001` decides it is required
scope_out:
- audio drawer logic
- TTS logic
- dependency graph routing
- unrelated dashboard styling
changed_subsystems:
- locale resources
- webview state and text rendering
- extension configuration schema only if explicitly required
candidate_files:
- `extension/task-plan-dashboard/extension.js`
- `extension/task-plan-dashboard/package.json`
- `extension/task-plan-dashboard/resources/locales/en.json`
- `extension/task-plan-dashboard/resources/locales/ru.json`
- `extension/task-plan-dashboard/resources/locales/es.json`
- `extension/task-plan-dashboard/resources/locales/fr.json`
- `extension/task-plan-dashboard/resources/locales/de.json`
- `extension/task-plan-dashboard/resources/locales/zh.json`
- `extension/task-plan-dashboard/resources/locales/ja.json`
forbidden_areas:
- audio runtime logic outside text refresh hooks
- graph routing logic
- unrelated docs and template files
- machine-local metadata
constraints:
- real translations only
- fallback must remain deterministic
- live DOM updates must not require a full panel reopen
- no new build step or framework
assumptions:
- `T-001` provides the final persistence model for selected language
open_questions:
- whether language state also persists in user configuration or only in the panel session
risks:
- stale labels can remain if not all visible nodes are retranslated
- adding language files without fallback discipline can break older keys
regression_risks:
- existing `en` and `ru` behavior
- dashboard title or button labels not refreshing
security_privacy_notes:
- locale changes are local and do not introduce new data exposure
non_functional_requirements:
- switching languages feels immediate
- missing keys fail safely
- JSON stays valid and UTF-8 clean

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
- locale JSON validity
- webview language-switch behavior
- existing `en` and `ru` fallback logic
test_data_origin:
- repository locale files and demo workspaces
fixtures:
- `examples/demo-en/TASK-PLAN.md`
- `examples/demo-ru/TASK-PLAN.md`
- `examples/demo-animated-web.html`
oracle:
- all locale JSON files parse successfully
- language switch updates visible labels without reopening the dashboard
- unsupported or missing keys fall back cleanly instead of rendering broken text
negative_tests:
- force an unsupported language and verify fallback
- verify a missing optional key does not crash the webview
determinism_notes:
- JSON parsing and static fallback checks are deterministic
- manual UI relabel checks depend on extension host execution
flakiness_risk:
- low
stop_on_failure: true
commands_planned:
- `node -c extension/task-plan-dashboard/extension.js`
- `node -e "const fs=require('fs'); const path=require('path'); const dir='extension/task-plan-dashboard/resources/locales'; for (const name of fs.readdirSync(dir)) { if (name.endsWith('.json')) { JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')); } }"`
- manual: reload the extension host, open the Task Plan Dashboard, switch languages, and confirm labels update in place
commands_run:
- no execution yet; task is still draft

#### Evidence and Closure

expected_artifacts:
- updated locale files
- updated language-switch logic
- manual smoke evidence recorded in the task summary
code_artifacts:
- `extension/task-plan-dashboard/extension.js`
- `extension/task-plan-dashboard/resources/locales/`
- `extension/task-plan-dashboard/package.json` only if required by `T-001`
test_artifacts:
- `commands_run` entries with JSON parse and live switch validation
review_artifacts:
- reviewer note confirming fallback and boundary compliance
artifact_locations:
- `TASK-PLAN.md`
- `extension/task-plan-dashboard/`
acceptance_criteria:
- the dashboard supports `en`, `ru`, `es`, `fr`, `de`, `zh`, and `ja`
- labels update live after language change
- no fake translation strings are left behind
acceptance_checks:
- locale JSON files parse
- the dashboard remains readable in `en` and `ru`
- language switch does not require reopening the panel
exit_criteria:
- code review passed
- QA signoff passed
- required checks executed and recorded
rollback_plan:
- revert locale and webview text-refresh changes
- restore prior config enum if the schema was widened
observability:
- the dashboard immediately exposes success because visible labels and UI text change live
decision_log:
- [2026-06-29] Locale-switch task created from demo parity prompt
summary_format:
- files changed
- languages added
- checks run
- fallback behavior

### TASK T-003

task_id: T-003
title: Audio Drawer And Independent BGM Or SFX Controls
rationale:
- The demo includes a floating media controller that the production extension does not yet provide, and the extension needs independent control over background music and sound effects.
- The repository now already contains a concrete bundled music track at `media/deep-techno-mix-2026.mp3`, so the task should target a real asset rather than an abstract or upload-only source.
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
- A1 planner uses `T-001` decisions to freeze the local BGM source model before code starts.
- A2 implementer adds drawer markup, styles, playback state, and separate BGM or SFX control logic without leaving fake assets or dead code.
- A3 reviewer checks graceful no-audio fallback, scope compliance, and control-state correctness.
- A4 tester validates slider behavior, drawer toggling, and non-crashing behavior when autoplay is blocked.
- A5 docs_sync documents runtime behavior only if the operator workflow changes.
required_approvals:
- code-review
- qa-signoff
max_review_loops: 2
escalation_rule:
- if audio parity requires external assets or new packaging conventions outside the freeze, escalate before implementation
- if the bundled mp3 cannot be exposed safely to the webview, block the task rather than shipping a fake placeholder or upload-only substitute
dependencies:
- T-001
- T-002
blocked_by:
- T-001 must freeze bundled mp3 URI strategy
- T-002 must provide the audio-related locale keys
unblocks:
- T-006
task_size: M
decomposition_rule:
- split only if audio asset preparation becomes a distinct repository task
milestones:
- add audio drawer button and panel markup
- add audio drawer styles
- resolve the bundled `media/deep-techno-mix-2026.mp3` into the webview runtime
- add independent BGM and SFX volume state
- wire play, pause, close, and next-track controls
- preserve safe fallback when audio playback is blocked
timebox:
- one implementation cycle
goal:
- Deliver the floating audio controller with separate BGM and SFX controls in the production dashboard.
- Use the repository-local bundled track as the baseline BGM source.
scope_in:
- audio drawer HTML and CSS in the webview
- extension-side URI resolution for `media/deep-techno-mix-2026.mp3`
- local BGM and SFX state management in the dashboard script
- safe runtime behavior for blocked or unavailable audio playback
scope_out:
- audio file upload UI unless `T-001` explicitly keeps it in scope
- role-based TTS logic
- dependency graph routing
- unrelated dashboard feature work
changed_subsystems:
- webview UI controls
- webview audio engine or helpers
- bundled media path resolution
- locale-bound UI labels already prepared in `T-002`
candidate_files:
- `extension/task-plan-dashboard/extension.js`
- `media/deep-techno-mix-2026.mp3`
- `extension/task-plan-dashboard/resources/locales/en.json`
- `extension/task-plan-dashboard/resources/locales/ru.json`
- `extension/task-plan-dashboard/resources/locales/es.json`
- `extension/task-plan-dashboard/resources/locales/fr.json`
- `extension/task-plan-dashboard/resources/locales/de.json`
- `extension/task-plan-dashboard/resources/locales/zh.json`
- `extension/task-plan-dashboard/resources/locales/ja.json`
forbidden_areas:
- external streaming services
- unrelated docs and templates
- machine-local media paths
- fake or placeholder audio assets
constraints:
- no external network fetches
- the default playable track must come from `media/deep-techno-mix-2026.mp3`
- volume controls must be independent
- the drawer must remain usable without breaking the rest of the dashboard
- audio failure must degrade safely
assumptions:
- `T-001` confirms the URI conversion approach for `media/deep-techno-mix-2026.mp3`
open_questions:
- whether next-track should loop the single bundled track, stay disabled, or remain reserved for future multi-track scope
risks:
- browser autoplay restrictions
- state drift between slider labels and actual gain values
- excessive UI clutter if placement is poor
regression_risks:
- existing button styles and z-index layering
- dashboard responsiveness on smaller panel widths
security_privacy_notes:
- no audio input capture
- no remote media loading
non_functional_requirements:
- responsive drawer animation
- visible current playback state
- no crash when audio APIs are unavailable

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
- audio drawer open or close behavior
- independent BGM and SFX slider behavior
- bundled mp3 resolution and playback
- graceful fallback when playback is blocked
test_data_origin:
- repository-local extension code and demo parity reference
fixtures:
- `examples/demo-animated-web.html`
- `examples/demo-en/TASK-PLAN.md`
oracle:
- the drawer opens and closes correctly
- BGM and SFX controls display separate values and affect separate runtime state
- the dashboard can resolve and play `media/deep-techno-mix-2026.mp3` when allowed by the host
- blocked or unavailable playback does not crash the webview
negative_tests:
- trigger controls before audio can autoplay and verify safe fallback
- simulate missing or broken bundled mp3 resolution and verify safe fallback
- set sliders to `0` and `100` and verify label-state coherence
determinism_notes:
- syntax checks are deterministic
- runtime audio behavior depends on webview policy and host support
flakiness_risk:
- medium
stop_on_failure: true
commands_planned:
- `node -c extension/task-plan-dashboard/extension.js`
- manual: reload the extension host, open the dashboard, toggle the audio drawer, move both sliders, and verify independent state updates while the bundled track is the default source
- manual: validate that blocked autoplay or missing audio support does not break the panel
commands_run:
- no execution yet; task is still draft

#### Evidence and Closure

expected_artifacts:
- audio drawer UI
- independent BGM and SFX control logic
- bundled mp3 path wiring
- manual validation notes
code_artifacts:
- `extension/task-plan-dashboard/extension.js`
- `media/deep-techno-mix-2026.mp3` as an existing referenced asset
test_artifacts:
- `commands_run` entries for drawer, slider, and bundled-track validation
review_artifacts:
- reviewer note confirming no fake assets, no dead code, safe fallback behavior, and correct use of the bundled media file
artifact_locations:
- `TASK-PLAN.md`
- `extension/task-plan-dashboard/extension.js`
- `media/deep-techno-mix-2026.mp3`
acceptance_criteria:
- the production dashboard exposes the floating audio drawer from the parity spec
- BGM and SFX controls are separate and visible
- the bundled track is the baseline playable source
- no placeholder audio implementation is shipped
acceptance_checks:
- drawer toggle works
- volume labels stay in sync with current slider values
- the bundled mp3 resolves correctly in the extension host
- panel remains stable if playback cannot start
exit_criteria:
- code review passed
- QA signoff passed
- runtime validation recorded
rollback_plan:
- remove drawer UI and restore prior audio behavior
- remove bundled-track wiring if it destabilizes the webview
observability:
- drawer state, track label, slider labels, and bundled-track playback state are human-visible in the dashboard
decision_log:
- [2026-06-29] Audio drawer task created from demo parity prompt
- [2026-06-29] Bundled mp3 requirement captured from repository state
summary_format:
- files changed
- bundled track behavior
- checks run
- fallback behavior

### TASK T-004

task_id: T-004
title: Role-Based TTS Bubble Narration
rationale:
- The parity target includes voice narration whose pitch and rate differ by agent role, and the production extension needs a deterministic helper for that behavior.
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
- A1 planner freezes the event trigger contract for narration before code starts.
- A2 implementer adds `speakStepBubble` and role-specific voice configuration without leaking fake fallbacks into the runtime.
- A3 reviewer checks graceful handling for missing voices and verifies that the helper respects the frozen trigger scope.
- A4 tester validates supported and unsupported speech runtime behavior.
- A5 docs_sync records operator-facing behavior only if narration becomes user-visible or configurable.
required_approvals:
- code-review
- qa-signoff
max_review_loops: 2
escalation_rule:
- if narration requires UI controls or settings not covered by the frozen scope, escalate before widening the task
- if speech support cannot be delivered safely, block instead of shipping a fake voice path
dependencies:
- T-001
- T-002
blocked_by:
- T-001 must freeze the narration trigger model
- T-002 must finalize language handling used by TTS
unblocks:
- T-006
task_size: M
decomposition_rule:
- split only if narration controls become a separate UX surface
milestones:
- define role-to-voice presets
- add `speakStepBubble(role, text, lang)` helper
- wire helper into the approved runtime trigger path
- add graceful no-support fallback
timebox:
- one implementation cycle
goal:
- Deliver safe, role-based TTS narration aligned with the demo parity target.
scope_in:
- speech helper logic in `extension.js`
- role pitch or rate presets for planner, implementer, reviewer, tester, and docs roles
- graceful handling for unavailable voices or unsupported runtime APIs
scope_out:
- audio drawer controls
- unrelated accessibility redesign
- server-side or remote TTS
changed_subsystems:
- webview speech helper logic
- role metadata mapping for narration
candidate_files:
- `extension/task-plan-dashboard/extension.js`
- locale files only if role labels or messages require a real translated string
forbidden_areas:
- remote speech services
- microphone capture
- fake voice lists or placeholder messages
- unrelated docs and templates
constraints:
- must degrade safely when `speechSynthesis` is unavailable
- role presets must be explicit and deterministic
- no placeholder narration copy
assumptions:
- the webview runtime can safely no-op when speech APIs are unavailable
open_questions:
- whether repeated triggers should cancel the active utterance or queue the next one
risks:
- voices may load asynchronously or differ across operating systems
- auto-triggered narration can become noisy if not scoped carefully
regression_risks:
- webview runtime stability
- event sequencing around step or bubble updates
security_privacy_notes:
- speech is local output only
- no recording or external data transfer is allowed
non_functional_requirements:
- no crash on unsupported platforms
- role differentiation remains perceptible but not extreme

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
- `speakStepBubble` invocation path
- role preset mapping
- graceful fallback when speech support is unavailable
test_data_origin:
- repository-local extension code and manual runtime validation
fixtures:
- `examples/demo-animated-web.html`
- dashboard task cards and step bubbles in the extension host
oracle:
- supported runtimes speak with role-based preset differences
- unsupported runtimes do not crash and surface safe no-op behavior
- language is passed consistently with the frozen locale model
negative_tests:
- simulate missing voices and verify no crash
- retrigger narration rapidly and verify behavior matches the frozen trigger rule
determinism_notes:
- syntax checks are deterministic
- speech playback characteristics vary by host voice availability
flakiness_risk:
- medium
stop_on_failure: true
commands_planned:
- `node -c extension/task-plan-dashboard/extension.js`
- manual: reload the extension host, trigger narration in a supported runtime, and compare role-specific behavior
- manual: validate safe behavior when speech support is missing or disabled
commands_run:
- no execution yet; task is still draft

#### Evidence and Closure

expected_artifacts:
- `speakStepBubble` implementation
- role preset mapping
- runtime validation notes
code_artifacts:
- `extension/task-plan-dashboard/extension.js`
test_artifacts:
- `commands_run` entries for supported and unsupported speech validation
review_artifacts:
- reviewer note confirming trigger scope and safe fallback
artifact_locations:
- `TASK-PLAN.md`
- `extension/task-plan-dashboard/extension.js`
acceptance_criteria:
- planner, implementer, reviewer, tester, and docs roles have explicit voice presets
- unsupported runtimes fail safely
- no fake speech service or placeholder voice path is introduced
acceptance_checks:
- narration helper exists and uses the frozen trigger model
- role presets are explicit
- no runtime crash occurs when speech APIs are absent
exit_criteria:
- code review passed
- QA signoff passed
- narration validation recorded
rollback_plan:
- remove the narration helper and restore silent behavior
observability:
- narration behavior is visible through user-triggered runtime smoke checks and recorded in task evidence
decision_log:
- [2026-06-29] TTS task created from demo parity prompt
summary_format:
- files changed
- trigger behavior
- checks run
- fallback behavior

### TASK T-005

task_id: T-005
title: Optimal Port Routing For Dependency Graph
rationale:
- The current dashboard graph does not yet guarantee the cleaner top, bottom, left, or right port routing promised by the parity demo.
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
- A1 planner freezes the routing contract and redraw trigger points before code starts.
- A2 implementer updates the graph port-selection and path-generation logic only within the existing graph subsystem.
- A3 reviewer checks geometry correctness, redraw stability, and boundary compliance.
- A4 tester validates graph readability on demo workspaces and verifies no crash when nodes are missing or filtered.
- A5 docs_sync updates graph-behavior notes only if operator-facing guidance changes.
required_approvals:
- code-review
- qa-signoff
max_review_loops: 2
escalation_rule:
- if routing changes require a broader graph-layout rewrite, escalate before widening scope
- if missing node coordinates cannot be handled safely, block the task instead of shipping brittle logic
dependencies:
- T-001
blocked_by:
- T-001 must freeze redraw and graph-contract assumptions
unblocks:
- T-006
task_size: M
decomposition_rule:
- split only if graph layout and graph rendering become separate work tracks
milestones:
- add optimal port selection helper
- update graph line path generation
- preserve redraw behavior on existing dashboard interactions
- validate readability on demo fixtures
timebox:
- one implementation cycle
goal:
- Reduce line tangling in the dependency graph by selecting ports based on node geometry.
scope_in:
- graph node coordinate consumption
- port selection helper
- bezier path generation and redraw behavior
scope_out:
- task card copy
- locale work
- audio or TTS logic
- a full graph-layout engine rewrite
changed_subsystems:
- dependency graph rendering in `extension.js`
candidate_files:
- `extension/task-plan-dashboard/extension.js`
forbidden_areas:
- unrelated UI panels
- locale files
- docs and templates not needed for closure
- machine-local metadata
constraints:
- no new rendering library
- no regression in existing graph display
- missing coordinates must fail safely
assumptions:
- current graph rendering already has measurable node coordinates that the new helper can reuse
open_questions:
- whether self-referential or cyclical edges need a separate fallback rule
risks:
- redraw timing regressions
- path overlap may improve for many cases but still need edge-case review
regression_risks:
- graph repaint after dashboard refresh
- graph display when tasks are filtered or incomplete
security_privacy_notes:
- rendering-only change; no new data exposure
non_functional_requirements:
- graph stays readable
- route computation remains lightweight
- no visible render flicker introduced by the new logic

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
- optimal port selection
- graph redraw stability
- missing-coordinate fallback
test_data_origin:
- repository demo workspaces and current dashboard graph data
fixtures:
- `examples/demo-en/TASK-PLAN.md`
- `examples/demo-ru/TASK-PLAN.md`
- current repository `TASK-PLAN.md` after tasks are loaded
oracle:
- horizontal relationships prefer left or right ports
- vertical relationships prefer top or bottom ports
- graph remains stable when the dashboard refreshes or filters change
negative_tests:
- render with missing coordinates and verify safe fallback
- validate graph behavior on dense dependency sets from the demo workspaces
determinism_notes:
- geometry calculations are deterministic for a fixed layout
- manual readability inspection is visual and host-dependent
flakiness_risk:
- medium
stop_on_failure: true
commands_planned:
- `node -c extension/task-plan-dashboard/extension.js`
- manual: reload the extension host, open the dashboard, and inspect dependency routing in `examples/demo-en` and `examples/demo-ru`
- manual: refresh the dashboard and verify routes stay stable
commands_run:
- no execution yet; task is still draft

#### Evidence and Closure

expected_artifacts:
- updated graph routing helper
- manual readability validation notes
- review note covering redraw stability
code_artifacts:
- `extension/task-plan-dashboard/extension.js`
test_artifacts:
- `commands_run` entries for graph validation
review_artifacts:
- reviewer note confirming no scope drift beyond graph routing
artifact_locations:
- `TASK-PLAN.md`
- `extension/task-plan-dashboard/extension.js`
acceptance_criteria:
- dependency lines choose ports according to node geometry
- graph readability improves on the provided demo workspaces
- no graph crash occurs when nodes are missing or filtered
acceptance_checks:
- horizontal and vertical cases both route correctly
- refresh and redraw remain stable
- no unrelated UI behavior regresses
exit_criteria:
- code review passed
- QA signoff passed
- graph validation recorded
rollback_plan:
- revert graph routing changes and restore prior path generation
observability:
- routing improvements are directly visible in the dependency graph view
decision_log:
- [2026-06-29] Graph routing task created from demo parity prompt
summary_format:
- files changed
- route logic
- checks run
- remaining edge cases

### TASK T-006

task_id: T-006
title: End-To-End Validation And Docs Sync
rationale:
- The parity work only closes cleanly if the full feature set is validated together and the repository documentation stays aligned with the real extension behavior.
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
- A1 planner freezes the final regression checklist using the completed upstream tasks.
- A2 implementer performs only the scoped cleanup, documentation sync, and safe integration glue needed for closure.
- A3 reviewer checks that docs match runtime reality and that no out-of-scope files were touched.
- A4 tester executes the full manual and static regression pass and records actual results.
- A5 docs_sync closes the task only after evidence, review, and updated operator-facing docs are aligned.
required_approvals:
- code-review
- qa-signoff
- docs-review
max_review_loops: 2
escalation_rule:
- if any upstream parity task fails required validation, keep this task blocked and reopen the offending task
- if docs would require overwriting unrelated dirty changes, escalate and isolate the sync surface
dependencies:
- T-002
- T-003
- T-004
- T-005
blocked_by:
- all upstream implementation tasks must be done
unblocks:
- none
task_size: M
decomposition_rule:
- split only if documentation sync becomes materially separate from runtime regression
milestones:
- rerun syntax and locale validation
- execute live extension-host smoke across languages, audio, TTS, and graph routing
- update extension-facing docs if workflow changed
- close the plan with synchronized evidence
timebox:
- one closure cycle
goal:
- Prove that the shipped extension matches the parity target and that repository docs describe the actual runtime.
scope_in:
- end-to-end validation of all upstream parity changes
- scoped docs sync for extension and repository guidance if behavior changed
- cleanup of task evidence and closure fields
scope_out:
- new feature work
- unrelated repo maintenance
- packaging or publishing work
changed_subsystems:
- task evidence and docs
- extension-facing guidance
candidate_files:
- `TASK-PLAN.md`
- `extension/task-plan-dashboard/README.md`
- `README.md`
- `docs/en/TASKS-GENERAL-INSTRUCTIONS.md` if required
- `docs/ru/TASKS-GENERAL-INSTRUCTIONS.md` if required
forbidden_areas:
- unrelated dirty worktree files without reviewer approval
- new product scope
- machine-local metadata
constraints:
- docs must reflect real shipped behavior only
- no invented screenshots, logs, or passing checks
- closure requires synchronized Task Register and Task Blocks
assumptions:
- upstream tasks produce real code and evidence in their own blocks
open_questions:
- whether repository root `README.md` needs explicit parity feature callouts after implementation
risks:
- docs can drift from runtime if evidence is weak
- manual smoke may reveal integration issues only at the final stage
regression_risks:
- combined behavior across locale switching, audio, TTS, and graph routing
- cleanup accidentally removing necessary integration glue
security_privacy_notes:
- docs and validation only; no new data surface
non_functional_requirements:
- closure evidence is concise, accurate, and reproducible
- documentation remains GitHub-ready

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
- extension syntax
- locale JSON validity
- live language switching
- audio drawer and independent volume behavior
- role-based TTS behavior or safe fallback
- dependency graph routing readability
- docs or runtime alignment
test_data_origin:
- repository-local extension files and demo workspaces
fixtures:
- `examples/demo-en/TASK-PLAN.md`
- `examples/demo-ru/TASK-PLAN.md`
- `examples/demo-animated-web.html`
oracle:
- no syntax or locale parse errors remain
- parity features work together in the extension host
- docs describe the real runtime behavior
- Task Register, task blocks, and evidence fields stay synchronized
negative_tests:
- verify unsupported language fallback
- verify missing speech support does not crash the panel
- verify blocked audio playback does not break the panel
- verify graph still renders after refresh
determinism_notes:
- static checks are deterministic
- final smoke remains host-dependent and must be described precisely
flakiness_risk:
- medium
stop_on_failure: true
commands_planned:
- `node -c extension/task-plan-dashboard/extension.js`
- `node -e "const fs=require('fs'); const path=require('path'); const dir='extension/task-plan-dashboard/resources/locales'; for (const name of fs.readdirSync(dir)) { if (name.endsWith('.json')) { JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')); } }"`
- manual: reload the extension host and validate language switching, audio controls, TTS behavior or safe fallback, and graph readability on both demo workspaces
- manual: re-read updated docs and verify they match the shipped runtime
commands_run:
- no execution yet; task is still draft

#### Evidence and Closure

expected_artifacts:
- end-to-end validation notes
- docs sync summary
- final closure evidence in the task plan
code_artifacts:
- upstream code artifacts from `T-002` through `T-005`
test_artifacts:
- `commands_run` entries for all static and manual checks
review_artifacts:
- reviewer note confirming docs and runtime alignment
artifact_locations:
- `TASK-PLAN.md`
- `extension/task-plan-dashboard/README.md`
- `README.md`
- `docs/en/TASKS-GENERAL-INSTRUCTIONS.md` if updated
- `docs/ru/TASKS-GENERAL-INSTRUCTIONS.md` if updated
acceptance_criteria:
- all parity features work in the production extension
- documentation reflects reality
- no open blocker remains in the plan
acceptance_checks:
- all required checks ran and were recorded
- docs match runtime behavior
- Task Register and task blocks are synchronized
exit_criteria:
- code review passed
- QA signoff passed
- docs review passed
- final evidence recorded
rollback_plan:
- reopen and revert the specific upstream task that failed validation
- revert docs that overstate the shipped behavior
observability:
- the dashboard and the final task evidence both reflect the completed parity state
decision_log:
- [2026-06-29] Final validation and docs-sync task created from demo parity prompt
summary_format:
- files changed
- checks run
- docs updated
- final status
