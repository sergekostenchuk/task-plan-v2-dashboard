# Task Plan Dashboard Extension

This folder contains the GitHub-ready source for the `Task Plan Dashboard` Antigravity / VS Code-compatible extension.

Purpose:

- visualize `TASK-PLAN.md`
- visualize `FEATURE-PREPARATION.md`
- visualize `.task-plan/events.jsonl`
- show task status, owner flow, review queue, test queue, dependencies, and artifacts

Current implementation notes:

- plain JavaScript extension
- no build step required for the current version
- locale files live in `resources/locales`
- demo workspaces are resolved relative to the repository:
  - `../../examples/demo-ru`
  - `../../examples/demo-en`

Recommended repository-facing install and packaging work:

1. Keep the source in this folder.
2. Optionally package it as a VSIX later.
3. Keep runtime-specific user profile files out of the repository.

Important:

- Do not commit `.antigravity/extensions/extensions.json`
- Do not commit `.obsolete`
- Do not commit machine-specific installation metadata
