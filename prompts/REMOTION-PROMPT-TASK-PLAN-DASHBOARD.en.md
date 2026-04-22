# REMOTION PROMPT: TASK-PLAN DASHBOARD

Use this prompt as a production-ready brief for a Remotion implementation pass.

## Prompt

You are working as a senior Remotion engineer and motion designer.

Your task is to create a short product-demo video about the `TASK-PLAN v2` system and the local `Task Plan Dashboard` extension for Antigravity.

Create a **clean, professional, visually dense but easy-to-read video** that explains:

1. why `TASK-PLAN v2` exists;
2. how one task moves through multiple agents using the `implementer -> reviewer -> tester` chain;
3. how the dashboard makes progress, blockers, review queue, test queue, dependencies, and artifacts visible;
4. what this looks like inside Antigravity.

## Video goal

Within 45-60 seconds, the viewer should understand:

- what the system is;
- how it differs from a plain Markdown task list;
- why a multi-agent task pipeline matters;
- how the dashboard exposes the full execution flow.

## Format

- Resolution: `1920x1080`
- FPS: `30`
- Duration: `45-60 seconds`
- Style: modern product demo / clean software promo / editorial motion
- On-screen language: `English`
- Keep code and data labels in their original technical form

## Source context

Use these files as the authoritative source for meaning and terminology:

- `docs/en/TASKS-GENERAL-INSTRUCTIONS.md`
- `docs/en/ANTIGRAVITY-TASK-PLAN-DASHBOARD.md`
- `examples/demo-en/TASK-PLAN.md`
- `examples/demo-en/FEATURE-PREPARATION.md`
- `examples/demo-en/.task-plan/events.jsonl`

Additional screenshots and images are available here:

- `media/screenshots`

If you use local images in Remotion:

- copy the selected assets into `public/`
- reference them via `staticFile()`
- use the Remotion `<Img />` component, never a raw HTML `<img>`

## Must-show elements

The video must visually present:

- `FEATURE-PREPARATION.md`
- `TASK-PLAN.md`
- `.task-plan/events.jsonl`
- the `Task Plan` activity bar item
- summary cards
- kanban
- dependency graph
- selected task details
- owner breakdown
- event timeline

It must also clearly show the logic of:

- one task
- multiple agents
- sequential handoff
- review gate
- test gate

## Suggested scene structure

### Scene 1. Hook / Why This Exists

Show the problem with a plain task list:

- lots of Markdown
- no clear owner visibility
- no review visibility
- no blocker visibility

Example on-screen copy:

- `A checklist is not an execution system`
- `You need visibility across planning, review, testing, and handoff`

### Scene 2. The Model

Show the three layers:

- `FEATURE-PREPARATION.md`
- `TASK-PLAN.md`
- `Dashboard`

On-screen copy:

- `Preparation`
- `Canonical plan`
- `Operational visibility`

### Scene 3. Multi-Agent Task Flow

Focus on one task.

Show that this is **not three separate tasks**, but one task moving through:

- `Planner`
- `Implementer`
- `Reviewer`
- `Tester`
- `Docs Sync`

Make the handoff animation explicit:

- worker finishes
- reviewer inspects
- tester validates

On-screen copy:

- `One task`
- `Multiple agents`
- `Sequential control`

### Scene 4. Dashboard in Antigravity

Show the extension UI:

- activity bar
- opening the dashboard
- summary cards
- kanban
- dependency graph

The viewer should understand that the dashboard is an operational cockpit, not a replacement source of truth.

On-screen copy:

- `Markdown stays canonical`
- `Dashboard makes execution visible`

### Scene 5. Review / Test Visibility

Highlight:

- `needs_review`
- `approved`
- `blocked`
- `done`

Show the event timeline and explain that it reveals:

- who started the task
- who handed it off
- where a blocker happened
- where tests passed

### Scene 6. Closing Message

Final message:

- `Plan clearly`
- `Hand off explicitly`
- `Review honestly`
- `Test before done`

## Visual style

Do not make a generic corporate slideshow.

The video should feel like:

- a serious engineering tool
- a modern control room
- a structured execution system

Recommended direction:

- dark background with cool blue/cyan accents
- bright cards and panels floating above a dark field
- grid-based transitions
- restrained glow/highlight effects
- smooth zoom and pan motion across UI
- graphical arrows between roles

## Animation

Use:

- soft entrance animations
- clear scene sequencing
- scale / opacity / slide transitions
- subtle highlight pulses for statuses and handoff points

Avoid:

- chaotic camera moves
- excessive spring effects
- visual noise

## Practical implementation requirements

1. Create a dedicated Remotion composition for this video.
2. Structure scenes as readable React components.
3. Use local assets through `public/` + `staticFile()`.
4. Use `<Img />` for still images.
5. If you show UI screenshots, present them as a product showcase:
   - frame
   - zoom
   - crop
   - callouts
6. Keep text and images easy to replace later.

## Expected output

Deliver:

- a working Remotion composition
- all required asset imports
- a clean scene structure
- something ready to preview in Remotion Studio

Also provide:

- a short note about the main entry files;
- a list of which images from the `PICS` folder were used;
- if some images were not used, a short explanation why.
