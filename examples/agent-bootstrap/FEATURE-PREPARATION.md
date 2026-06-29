# FEATURE-PREPARATION

feature_id: BOOTSTRAP-TASK-PLAN-V2
feature_title: Fork the package or install TASK-PLAN v2 into a target repository
status: ready
owner_role: planner
last_updated: 2026-06-29

## 1. Problem and goal
- [x] The feature is named in one clear sentence
- [x] The user problem is explicit
- [x] The primary user is defined
- [x] The feature value is explicit
- [x] The out-of-scope boundary is explicit

## 2. User intents
- [x] Collected 5-10 typical user commands
- [x] Core user flows are described
- [x] Ambiguous requests are described
- [x] Errors and edge cases are described
- [x] Clarification triggers are defined

## 3. UI/UX
- [x] The entry point is defined
- [x] The main UI pattern is defined
- [x] Result preview behavior is defined
- [x] Apply or confirm behavior is defined
- [x] Undo or rollback behavior is defined
- [x] UI states are described
- [x] Low-confidence and error behavior is described

## 4. Technical design
- [x] Affected subsystems are defined
- [x] The runtime entry point is defined
- [x] The path from intent to internal action is described
- [x] Required APIs, events, and contracts are defined
- [x] Constraints and forbidden areas are defined
- [x] Preview or dry-run mode decision is recorded
- [x] No mock, stub, or placeholder is allowed without an explicit alarm

## 5. Verification
- [x] Acceptance criteria exist
- [x] Every key scenario has a verification path
- [x] Unit, integration, e2e, smoke, and manual coverage were considered
- [x] Sample data and fixtures are identified
- [x] Success oracles are explicit
- [x] Negative tests are defined
- [x] Regression risks are defined
- [x] No silent temporary element is left without a replacement condition

## 6. Delivery and rollout
- [x] The MVP slice is defined
- [x] Deferred scope is defined
- [x] Feature flag decision is recorded
- [x] Rollback and fallback are defined
- [x] Wiki and docs updates are defined
- [x] Required Codex artifacts are defined

## Decisions

problem_statement:
- Users want to hand a single prompt and a canonical plan to an external coding agent so that the agent can fork this package or install it into another repository without improvising the planning system.
- Without a reusable bootstrap package, each agent tends to invent its own structure, skip the feature gate, or install only fragments of the system.

primary_user:
- Repository owner who wants to bootstrap `TASK-PLAN v2` into a new or existing repository by delegating the work to an external agent.

value:
- The bootstrap workflow becomes repeatable across Codex, Claude Code, Gemini, GLM, Kimi, GitHub Copilot, Qwen, DeepSeek, and similar agents.
- Users can hand over a real prompt plus a real plan instead of a vague instruction.
- The target repository receives canonical planning files instead of an ad hoc checklist.

mvp_slice:
- Support two modes:
- `standalone-fork`
- `in-repo-bootstrap`
- Install the canonical root `FEATURE-PREPARATION.md` and `TASK-PLAN.md`
- Install reusable templates
- Optionally install docs, prompts, examples, and dashboard extension assets by scope

deferred_scope:
- custom CI pipelines
- repository-specific product implementation
- marketplace publishing of the dashboard extension
- organization-specific governance beyond the canonical package

feature_flag:
- No feature flag is needed.
- The workflow is gated by explicit runtime inputs and approvals instead of a runtime toggle.

rollback:
- revert the bootstrap commit or branch in the target repository
- remove copied planning assets if the install scope was wrong
- restore the target `README.md` if the entrypoint was added incorrectly

required_artifacts:
- a reusable agent prompt
- a canonical bootstrap `FEATURE-PREPARATION.md`
- a canonical bootstrap `TASK-PLAN.md`
- a README entrypoint that tells users how to hand the package to their agents

wiki_updates:
- record only repository-safe guidance
- never store secrets, tokens, cookies, private URLs, or machine-specific user profile state

runtime_inputs:
- `source_package`
- `install_mode`
- `target_repository`
- `install_scope`
- `default_docs_language`
- `branch_name`
- `push_expected`
- `pr_expected`
- `github_auth_available`

typical_user_commands:
- "Fork this package into my GitHub and prepare it for use."
- "Install TASK-PLAN v2 into my existing repository without touching product code."
- "Copy only the core planning system."
- "Copy the full package including docs, prompts, and dashboard extension."
- "Create the root `FEATURE-PREPARATION.md` and `TASK-PLAN.md` for my repo."
- "Update the target README with a short TASK-PLAN entrypoint."
- "Open a PR only if GitHub auth is available."
- "Return `INVALID_INPUT` instead of pretending the fork or push worked."

core_user_flows:
- The user gives the agent the bootstrap prompt, the bootstrap workspace, and runtime inputs; the agent validates access and performs a `standalone-fork`.
- The user gives the agent the bootstrap prompt, the bootstrap workspace, and runtime inputs; the agent installs the planning system into an existing repository as `in-repo-bootstrap`.
- The agent creates the canonical root planning files, copies the approved scope, validates the result, and reports real evidence.

ambiguous_requests:
- Whether the target needs `core`, `core+docs`, `core+docs+prompts`, or `full` must be explicit before file copying starts.
- Whether the user wants a standalone planning repo or an in-repo bootstrap must be explicit before git operations start.
- Whether push and PR work are required must be explicit before GitHub operations start.

errors_and_edge_cases:
- GitHub auth may be unavailable even when fork or PR work is requested.
- The target repository may already contain planning files or a dirty worktree.
- The user may ask for the full dashboard package in a repository that does not want extension assets.
- The target repository may not have Node installed even when dashboard scope is requested.

clarification_triggers:
- Ask for clarification only if install mode is missing.
- Ask for clarification only if install scope is missing.
- Ask for clarification only if target repository path or URL is missing.
- Ask for clarification only if GitHub auth status is missing while fork, push, or PR work is requested.

ui_entry_point:
- The entrypoint is documentation-driven.
- Users start from `README.md`, then hand a bootstrap prompt and the bootstrap workspace to their agent.

ui_pattern:
- Prompt plus canonical Markdown planning workspace.

preview_behavior:
- The bootstrap workspace itself is the preview of the installation method.

apply_and_undo:
- Apply by running the bootstrap workflow in the target repository.
- Undo by reverting the bootstrap commit, branch, or copied files.

ui_states:
- inputs missing
- inputs validated
- fork or branch prepared
- core installed
- optional scope installed
- verification passed
- push or PR completed
- blocked by missing auth or target-repo conflict

technical_design:
- Affected subsystems:
- target repository root planning files
- `templates/`
- optional `docs/`
- optional `prompts/`
- optional `extension/task-plan-dashboard/`
- optional examples and media selected by scope
- Runtime entry point:
- the agent prompt plus the canonical bootstrap `TASK-PLAN.md`
- Intent to action path:
- user supplies runtime inputs
- agent validates them
- agent forks or opens target repository
- agent copies the approved scope
- agent validates the install
- agent commits, pushes, or opens a PR only if requested and possible

constraints_and_forbidden_areas:
- No silent mocks.
- No silent placeholders.
- No invented git success.
- No overwrite of unrelated target-repo files.
- No secret capture.
- No machine-specific profile files from Antigravity or VS Code.

preview_or_dry_run_decision:
- No separate dry-run mode is required.
- Input validation plus file-level verification are the safe gating mechanism.

verification_strategy:
- Always verify root planning files exist.
- Always verify copied scope matches the request.
- Always record real git state.
- When dashboard scope is installed, run `node -c extension/task-plan-dashboard/extension.js`.
- When dashboard scope is installed, parse locale JSON files.

negative_tests:
- request fork or PR work with no GitHub auth and verify `INVALID_INPUT`
- request `full` scope in a repo that should only receive `core` and verify the agent does not widen scope silently
- detect pre-existing planning files and surface conflict instead of overwriting silently

regression_risks:
- bootstrap work can overwrite repository-specific planning files if the agent does not boundary-check
- fake git success claims can create false confidence
- copying too much scope into an existing product repository can pollute the repo

implementation_policy:
- No mocks.
- No placeholders.
- Missing credentials, missing repository paths, and missing mode selections must stay explicit and blocking.
