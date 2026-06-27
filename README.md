# TASK-PLAN v2 Dashboard

TASK-PLAN v2 Dashboard is a public package for making agentic software work reviewable. It combines a Markdown control-document format, an Antigravity/VS Code-style dashboard extension, bilingual docs, templates, demo workspaces, and media that show how multi-agent plans can be tracked from feature gate to verification.

## Why this matters

Agentic coding sessions often fail because plans, blockers, test evidence, and review state are scattered across chat history and local files. TASK-PLAN v2 gives maintainers a canonical `TASK-PLAN.md` contract with explicit status, dependencies, verification commands, approvals, rollback notes, and progress events. The dashboard makes that contract visible enough for a human reviewer to decide whether work is ready, blocked, or still needs evidence.

This is relevant to Codex-style OSS maintenance because it turns agent work into auditable maintainer workflow: issues can map to tasks, tasks can map to checks, and release decisions can be backed by recorded verification rather than chat memory.

## Quick start

1. Read the English guide: [`docs/en/TASKS-GENERAL-INSTRUCTIONS.md`](./docs/en/TASKS-GENERAL-INSTRUCTIONS.md).
2. Copy [`templates/TASK-PLAN-v2.template.md`](./templates/TASK-PLAN-v2.template.md) into a project as `TASK-PLAN.md`.
3. Open one of the demo workspaces in [`examples/`](./examples/) to see a filled plan.
4. Inspect the dashboard extension source in [`extension/task-plan-dashboard/`](./extension/task-plan-dashboard/).

Status: public OSS package, documentation-first, with extension packaging and CI planned as next steps.

## What is included

### Docs

- `docs/en/`
- `docs/ru/`
- `docs/reference/`

### Templates

- `templates/FEATURE-PREPARATION-CHECKLIST.md`
- `templates/TASK-PLAN-v2.template.md`
- `templates/CLAUDE-CODE.tasks-projection.md`
- `templates/IMPLEMENTATION-PLAN.runtime.md`

### Skills

- `skills/post-implementation-cleanup/`
- `skills/legacy-audit/`

The skills layer is authored in English to keep execution semantics stable across Codex, Claude Code, Gemini, and Antigravity, while the surrounding human-facing documentation remains bilingual in `docs/en/` and `docs/ru/`.

### Extension source

- `extension/task-plan-dashboard/`

This is the repository-safe source version of the local Antigravity dashboard extension.

### Examples

- `examples/demo-en/`
- `examples/demo-ru/`

Each example includes:

- `FEATURE-PREPARATION.md`
- `TASK-PLAN.md`
- `.task-plan/events.jsonl`
- task artifacts

### Prompts

- `prompts/REMOTION-PROMPT-TASK-PLAN-DASHBOARD.en.md`
- `prompts/REMOTION-PROMPT-TASK-PLAN-DASHBOARD.ru.md`

### Media

- `media/task-plan-dashboard-presentation.mp4`
- `media/screenshots/`

## Recommended repository layout

If you move this bundle into a real repository, keep the structure mostly unchanged:

```text
docs/
  en/
  ru/
  reference/
templates/
skills/
extension/
  task-plan-dashboard/
examples/
  demo-en/
  demo-ru/
prompts/
media/
```

## What was intentionally excluded

The following machine-specific files are intentionally not part of this package:

- `~/.antigravity/extensions/extensions.json`
- `~/.antigravity/extensions/.obsolete`
- `Library/Application Support/Antigravity/...`
- local cache files
- user profile state

## Roadmap

- Package the dashboard extension as a reproducible VSIX build.
- Add CI for template validation and extension smoke checks.
- Move large demo media to GitHub Releases if repository size becomes a problem.
- Add more examples for Codex, Claude Code, and Antigravity workflows.

## Main entry points

Start here:

- [English general guide](./docs/en/TASKS-GENERAL-INSTRUCTIONS.md)
- [Russian general guide](./docs/ru/TASKS-GENERAL-INSTRUCTIONS.md)
- [English dashboard guide](./docs/en/ANTIGRAVITY-TASK-PLAN-DASHBOARD.md)
- [Russian dashboard guide](./docs/ru/ANTIGRAVITY-TASK-PLAN-DASHBOARD.md)
- [Extension source](./extension/task-plan-dashboard/README.md)

## License

MIT, see [`LICENSE`](./LICENSE).
