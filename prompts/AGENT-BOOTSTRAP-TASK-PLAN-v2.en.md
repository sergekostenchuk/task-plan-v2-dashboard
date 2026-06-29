# AGENT BOOTSTRAP PROMPT: FORK OR INSTALL TASK-PLAN v2

Use this prompt with Codex, Claude Code, Gemini, GLM, Kimi, GitHub Copilot, Qwen, DeepSeek, or a similar coding agent.

## Mission

Fork the `TASK-PLAN v2` package or install it into a target repository, then leave the target repository with a working canonical planning setup:

- `FEATURE-PREPARATION.md`
- `TASK-PLAN.md`
- reusable planning templates
- optional docs, prompts, examples, and dashboard extension

## Supported install modes

- `standalone-fork`
  The user wants a dedicated planning repository based on this package.
- `in-repo-bootstrap`
  The user wants this system installed into an existing product repository without replacing the product codebase.

## Required user inputs

Do not guess these. If any required item is missing, return `INVALID_INPUT` and list the missing fields.

- `source_package`
  Repository URL or local path for this package.
- `install_mode`
  `standalone-fork` or `in-repo-bootstrap`.
- `target_repository`
  GitHub URL and/or local filesystem path for the target repository.
- `install_scope`
  `core`, `core+docs`, `core+docs+prompts`, or `full`.
- `default_docs_language`
  `en`, `ru`, or `both`.
- `branch_name`
  Branch name for the bootstrap work.
- `push_expected`
  `true` or `false`.
- `pr_expected`
  `true` or `false`.
- `github_auth_available`
  `true` or `false`.

## Mandatory reads before any edits

Read these files from the package first:

- `examples/agent-bootstrap/FEATURE-PREPARATION.md`
- `examples/agent-bootstrap/TASK-PLAN.md`
- `templates/FEATURE-PREPARATION-CHECKLIST.md`
- `templates/TASK-PLAN-v2.template.md`
- `templates/CLAUDE-CODE.tasks-projection.md`
- `templates/IMPLEMENTATION-PLAN.runtime.md`
- `docs/en/TASKS-GENERAL-INSTRUCTIONS.md`

Read these additionally when the chosen scope includes the dashboard:

- `extension/task-plan-dashboard/README.md`
- `extension/task-plan-dashboard/package.json`

## Execution rules

- Use `examples/agent-bootstrap/TASK-PLAN.md` as the canonical control document for the bootstrap work.
- Create or update a target-repository `FEATURE-PREPARATION.md` and `TASK-PLAN.md` with real repository-specific facts.
- Preserve Markdown as the source of truth.
- Use sequential handoff per task: `planner -> implementer -> reviewer -> tester -> docs_sync`.
- No silent mocks.
- No silent placeholders.
- Do not invent forks, remotes, branches, commits, pushes, pull requests, approvals, or passing checks.
- Do not overwrite unrelated user code or unrelated dirty files in the target repository.
- If the user requested fork, push, or PR work but GitHub auth is unavailable, return `INVALID_INPUT` instead of pretending success.

## Scope contract

`core` must install:

- root `FEATURE-PREPARATION.md`
- root `TASK-PLAN.md`
- `templates/FEATURE-PREPARATION-CHECKLIST.md`
- `templates/TASK-PLAN-v2.template.md`
- `templates/CLAUDE-CODE.tasks-projection.md`
- `templates/IMPLEMENTATION-PLAN.runtime.md`

`core+docs` adds:

- `docs/en/`
- `docs/ru/`
- `docs/reference/` when relevant

`core+docs+prompts` adds:

- all of the above
- `prompts/`

`full` adds:

- all of the above
- `extension/task-plan-dashboard/`
- `examples/demo-en/`
- `examples/demo-ru/`
- selected `media/` only if the user explicitly wants demo media copied

## Required workflow

1. Validate all inputs and repository access.
2. Decide whether this is `standalone-fork` or `in-repo-bootstrap`.
3. If `standalone-fork` and GitHub auth is available:
- fork the package repository
- clone or open the fork locally
- create the requested working branch
4. If `in-repo-bootstrap`:
- open the target repository
- create the requested working branch
- preserve existing product code and docs outside the approved scope
5. Install the selected scope.
6. Create or update root `FEATURE-PREPARATION.md` and `TASK-PLAN.md` in the target repository.
7. Update the target `README.md` with a short “TASK-PLAN v2” entrypoint section.
8. Verify the installation with real commands.
9. Commit only after verification passes.
10. Push and open a PR only if requested and actually possible.

## Verification requirements

Always run and record:

- `git status --short`
- `rg --files` on the installed planning paths
- existence checks for root `FEATURE-PREPARATION.md` and `TASK-PLAN.md`

Run these when the dashboard extension is installed:

- `node -c extension/task-plan-dashboard/extension.js`
- JSON parse checks for `extension/task-plan-dashboard/resources/locales/*.json`

Run repository-safe Markdown or docs checks only if the target repository already has them or the chosen scope includes them.

## Required outputs

Return a concise report with:

- install mode
- target repository
- branch name
- selected scope
- files added or updated
- commands actually run
- validation result
- commit SHA if created
- PR URL if created
- unresolved blockers or alarms

## Definition of done

The task is done only if:

- the selected scope is installed in the correct repository
- root `FEATURE-PREPARATION.md` and `TASK-PLAN.md` exist
- required verification ran and was recorded
- README entrypoint was added
- no fake evidence was reported
- push or PR status matches reality

## Final instruction

If the user gives you this prompt together with the bootstrap planning workspace, treat that planning workspace as binding. Do not replace it with your own ad hoc checklist.
