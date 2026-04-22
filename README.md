# TASK-PLAN v2 GitHub Package

This folder is a GitHub-ready bundle for publishing the `TASK-PLAN v2` planning system, the Antigravity dashboard extension, bilingual docs, demo workspaces, and media.

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

## Publish checklist

Before pushing to GitHub:

1. Review the extension id, publisher, and packaging strategy.
2. Decide whether demo media should remain in the main branch or move to Releases.
3. Add a repository license if needed.
4. Add CI or VSIX packaging later if you want installable release artifacts.

## Main entry points

Start here:

- [English general guide](./docs/en/TASKS-GENERAL-INSTRUCTIONS.md)
- [Russian general guide](./docs/ru/TASKS-GENERAL-INSTRUCTIONS.md)
- [English dashboard guide](./docs/en/ANTIGRAVITY-TASK-PLAN-DASHBOARD.md)
- [Russian dashboard guide](./docs/ru/ANTIGRAVITY-TASK-PLAN-DASHBOARD.md)
- [Extension source](./extension/task-plan-dashboard/README.md)
