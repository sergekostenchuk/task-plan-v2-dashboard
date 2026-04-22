# Claude Code Tasks Projection

Use this as a projection derived from the canonical `TASK-PLAN.md`.

## Source

- canonical_plan: TASK-PLAN.md
- feature_prep: FEATURE-PREPARATION.md
- projection_target: .claude/specs/<feature>/tasks.md

## Rules

- Include only tasks that are implementation-ready.
- Keep task ids identical to the canonical plan.
- Preserve dependency order.
- Do not invent new acceptance criteria here.
- If the projection and canonical plan diverge, update the canonical plan first.

## Example

- [ ] 1. T-001 Implement scoped feature slice
  - Objective: implement the task exactly as defined in `TASK-PLAN.md`
  - Owner role: implementer
  - Depends on: T-000
  - Acceptance: match canonical `acceptance_criteria`
  - Checks: match canonical `acceptance_checks`

- [ ] 2. T-002 Add verification coverage
  - Objective: execute the required tests and record evidence
  - Owner role: tester
  - Depends on: T-001
  - Acceptance: match canonical `acceptance_criteria`
  - Checks: match canonical `acceptance_checks`
