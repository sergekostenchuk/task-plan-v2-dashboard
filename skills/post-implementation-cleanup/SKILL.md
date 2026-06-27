---
name: post-implementation-cleanup
description: Run a mandatory cleanup pass on files touched by the current implementation task before it can close. Use this skill whenever a task is moving from implementation/review/testing toward final done and there is any chance of dead helpers, unused imports, commented-out code, stale flags, obsolete wrappers, or duplicate transitional logic remaining in the touched files.
---

# Post-Implementation Cleanup

Use this skill after implementation and review corrections are complete, but before the task is allowed to close as `done`.

This is a narrow, task-scoped cleanup pass. It is not a repo-wide refactor tool.

## Trigger

Run this skill when:

- a task has completed implementation work;
- reviewer-requested corrections are already applied;
- the task is about to move into final closure;
- `docs_sync` is preparing to close the task record.

Hard rule:

- `docs_sync` must not close the task until this cleanup pass is complete.

## Scope

Work only inside files that were created or modified by the current task.

Do not:

- perform opportunistic cleanup in unrelated files;
- turn this pass into a broad architectural refactor;
- delete legacy-looking code outside the current task surface just because you noticed it.

## Inputs

Read these inputs before editing:

- the current task block in `TASK-PLAN.md`;
- the task's `candidate_files`;
- the task's `commands_planned`;
- the current diff or touched-file list;
- review notes and test notes for the same task.

If the touched-file list is unclear, stop and record that uncertainty instead of guessing.

## Cleanup Algorithm

Process every touched file deliberately.

### 1. Inspect imports

Check for:

- unused imports;
- stale re-exports;
- compatibility imports left behind by the replaced approach.

Remove imports only when they are truly unused in the current file or no longer required by the active implementation.

### 2. Inspect task-local dead code

Check for:

- helper functions introduced during the task but no longer called;
- classes, wrappers, adapters, or branches superseded by the final implementation;
- temporary transformation utilities that survived after refactoring.

Remove only what is no longer required.

### 3. Inspect commented-out code

Remove commented-out code blocks unless they are explicitly retained for a real reason such as:

- a `TODO` with a concrete follow-up;
- migration reasoning that must stay visible;
- a temporary note required by a live blocker.

If code is kept intentionally, the reason must be explicit in the comment or task notes.

### 4. Inspect stale configuration and flags

Look for:

- obsolete feature flags;
- dead config branches;
- env vars from replaced implementations;
- fallback switches that are no longer used;
- transitional compatibility shims.

Delete them if the final implementation no longer depends on them.

### 5. Inspect duplicate logic

Check whether the new implementation now coexists with older equivalent logic in the same touched surface.

If the old path is no longer needed, remove it.

If both paths are still intentionally present, record why.

## Safe Deletion Rules

Never delete code just because a simple text search found no obvious references.

Before deleting a function, class, module, wrapper, or config surface, check for:

- imports and exports;
- registry-based wiring;
- route registration;
- CLI entrypoints;
- config-based activation;
- test-only usage;
- dynamic invocation paths;
- framework conventions that may hide references.

Examples of hidden usage include:

- plugin registries;
- dependency injection containers;
- reflection-based loading;
- filesystem discovery;
- command auto-registration;
- route/module conventions.

If usage cannot be safely disproven:

- do not delete blindly;
- record a cleanup warning instead.

## Leave-No-Trace Rule

Do not close a task while touched files still contain removable legacy residue created or exposed by that task.

If cleanup is incomplete, the task is not ready for final `done`.

## Verification

After cleanup edits:

1. rerun the relevant checks for the task;
2. confirm the cleanup pass did not break behavior;
3. record only actually executed checks in `commands_run`;
4. attach cleanup evidence to the task artifacts.

Do not copy `commands_planned` into `commands_run` unless the command was actually executed.

## Output

Produce a brief cleanup report using this structure:

```md
# Cleanup Report

## Task
- task_id:

## Files Reviewed
- path/to/file

## Removed Items
- file:
  line_range:
  item_type:
  reason:

## Warnings
- file:
  suspected_dead_item:
  reason_not_removed:

## Verification
- command:
  result:
```

Keep the report concise, factual, and limited to the touched scope.

## Non-Goals

This skill does not:

- perform repo-wide cleanup;
- delete uncertain code by default;
- replace the deeper `legacy-audit` workflow;
- silently weaken verification to make cleanup appear complete.
