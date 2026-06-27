---
name: legacy-audit
description: Run a deep, manual, project-wide audit for dead code, duplicated logic, stale wrappers, and legacy residue before major refactors or during periodic maintenance. Use this skill whenever a repository needs a human-reviewable cleanup plan across the whole codebase, especially when old architectural layers, abandoned adapters, or oversized legacy files may still be present.
---

# Legacy Audit

Use this skill for a repository-wide cleanup audit.

This skill reports and proposes. It does not perform broad automatic deletion by default.

## Trigger

Run this skill when:

- a maintainer invokes it manually;
- a major refactor is being prepared;
- the codebase has accumulated several implementation cycles without cleanup;
- the team wants a periodic entropy review, for example every N sprints or milestone cycles.

## Scope

The scope is the entire repository.

This includes:

- application code;
- shared libraries;
- scripts and tooling;
- configuration surfaces;
- legacy adapters, wrappers, and compatibility branches;
- tests that may preserve outdated integration paths.

## Inputs

Review as much of the following as is available:

- repository structure;
- current code paths;
- task plans and architecture notes;
- git history;
- changelog or release notes;
- migration or deprecation documents.

If historical context is missing, say so explicitly in the audit report.

## Audit Algorithm

### 1. Build a codebase-wide dead-code picture

Inspect modules for:

- apparently unused functions;
- apparently unused classes;
- obsolete helper layers;
- dead compatibility wrappers;
- old fallback paths;
- stale config surfaces;
- unreachable or superseded branches.

### 2. Look for duplicated logic

Identify logic that appears in multiple files or modules with only minor variation, especially when one version looks like a newer replacement for another.

### 3. Cross-check with historical decisions

Compare suspicious files and code paths against:

- git log;
- changelog entries;
- migration notes;
- architectural decision records where available.

The goal is to distinguish:

- intentionally retained compatibility layers;
- accidental leftovers from replaced designs.

### 4. Identify oversized legacy concentration

Flag files where more than 30% of lines appear to be:

- dead code;
- obsolete transitional code;
- commented-out legacy implementation;
- duplicate compatibility residue.

Treat this as an audit signal, not automatic proof that deletion is safe.

### 5. Separate safe and uncertain candidates

Classify findings into:

- likely safe deletion candidates;
- likely consolidation candidates;
- uncertain candidates needing human review;
- historical residue that should stay but needs documentation.

## Safety Rules

Do not treat naive search absence as sufficient proof that code is dead.

Before declaring something removable, consider:

- exports and re-exports;
- runtime registration;
- plugin discovery;
- DI containers;
- route wiring;
- CLI commands;
- config switches;
- framework conventions;
- test-only execution paths;
- reflection or dynamic loading.

If evidence is incomplete, lower confidence and mark the item for review.

## Output

Produce a structured audit report for human review before deletion.

Use this structure:

```md
# Legacy Audit Report

## Summary
- repository:
- audit_date:
- high_risk_areas:

## Findings
- file:
  category:
  estimated_dead_lines:
  confidence:
  rationale:
  recommended_action:

## Duplicate Logic
- file_pair_or_group:
  shared_behavior:
  likely_source_of_truth:
  recommendation:

## High Legacy Density Files
- file:
  estimated_legacy_ratio:
  notes:

## Uncertain Candidates
- file:
  reason_uncertain:
  required_followup:
```

Use confidence labels such as:

- `high`
- `medium`
- `low`

## Non-Goals

This skill does not:

- perform broad automatic deletions;
- rewrite the repository during the audit itself;
- replace task-scoped `post-implementation-cleanup`;
- treat historical suspicion as proof.
