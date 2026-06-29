# Any-Agent Bootstrap Example

Use this workspace when you want another coding agent to bootstrap `TASK-PLAN v2` into a repository.

This example is designed for:

- Codex
- Claude Code
- Gemini
- GLM
- Kimi
- GitHub Copilot
- Qwen
- DeepSeek
- similar repository-capable coding agents

Files:

- `FEATURE-PREPARATION.md` - readiness gate for the bootstrap workflow
- `TASK-PLAN.md` - canonical control document for the bootstrap workflow

Recommended usage:

1. Give the agent one of the bootstrap prompts from `prompts/`.
2. Give the agent this workspace.
3. Provide real runtime inputs:
- source package path or URL
- target repository path or URL
- install mode
- install scope
- branch name
- GitHub auth status

Expected result:

- a fork or target branch prepared correctly
- root `FEATURE-PREPARATION.md` and `TASK-PLAN.md` installed in the target repository
- selected templates, docs, prompts, and optional dashboard assets copied into place
- real verification evidence
