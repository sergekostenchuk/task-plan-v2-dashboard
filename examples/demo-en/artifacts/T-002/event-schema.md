# Event Schema

Minimal JSONL line:

```json
{
  "ts": "2026-04-22T11:51:00Z",
  "task_id": "T-006",
  "role": "implementer",
  "event": "blocked",
  "summary": "Human-readable event text",
  "next_role": "reviewer",
  "path": "artifacts/T-006/blocker-note.md"
}
```

Rules:

- One JSON object per line.
- ISO timestamp in `ts`.
- `summary` is human-readable and short.
- `path` is optional and relative to the plan root.
