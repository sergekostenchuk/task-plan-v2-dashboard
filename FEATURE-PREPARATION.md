# FEATURE-PREPARATION

feature_id: EXT-DEMO-PARITY
feature_title: Integrate demo animated web controls into the production Task Plan Dashboard extension
status: ready
owner_role: planner
last_updated: 2026-06-29

## 1. Problem and goal
- [x] The feature is named in one clear sentence
- [x] The user problem is explicit
- [x] The primary user is defined
- [x] The feature value is explicit
- [x] The out-of-scope boundary is explicit

## 2. User intents
- [x] Collected 5-10 typical user commands
- [x] Core user flows are described
- [x] Ambiguous requests are described
- [x] Errors and edge cases are described
- [x] Clarification triggers are defined

## 3. UI/UX
- [x] The entry point is defined
- [x] The main UI pattern is defined
- [x] Result preview behavior is defined
- [x] Apply or confirm behavior is defined
- [x] Undo or rollback behavior is defined
- [x] UI states are described
- [x] Low-confidence and error behavior is described

## 4. Technical design
- [x] Affected subsystems are defined
- [x] The runtime entry point is defined
- [x] The path from intent to internal action is described
- [x] Required APIs, events, and contracts are defined
- [x] Constraints and forbidden areas are defined
- [x] Preview or dry-run mode decision is recorded
- [x] No mock, stub, or placeholder is allowed without an explicit alarm

## 5. Verification
- [x] Acceptance criteria exist
- [x] Every key scenario has a verification path
- [x] Unit, integration, e2e, smoke, and manual coverage were considered
- [x] Sample data and fixtures are identified
- [x] Success oracles are explicit
- [x] Negative tests are defined
- [x] Regression risks are defined
- [x] No silent temporary element is left without a replacement condition

## 6. Delivery and rollout
- [x] The MVP slice is defined
- [x] Deferred scope is defined
- [x] Feature flag decision is recorded
- [x] Rollback and fallback are defined
- [x] Wiki and docs updates are defined
- [x] Required Codex artifacts are defined

## Decisions

problem_statement:
- The repository already contains a polished standalone demo at `examples/demo-animated-web.html`, but the production extension at `extension/task-plan-dashboard` does not yet expose the same language switching, audio controls, role-based TTS narration, or smarter dependency routing.
- This creates a gap between the GitHub demo and the real in-editor dashboard experience.

primary_user:
- Repository maintainer who wants the production extension to match the public demo.
- Operator using the dashboard view inside Antigravity or VS Code to inspect a real `TASK-PLAN.md`.

value:
- The extension becomes the real product rather than a reduced viewer.
- Public GitHub documentation and the in-editor behavior stay aligned.
- Multi-language and audio affordances make agent progress more legible during live work.

mvp_slice:
- Ship demo-parity for four areas:
- live language switching for `en`, `ru`, `es`, `fr`, `de`, `zh`, and `ja`
- floating audio drawer with independent BGM and SFX controls
- role-based `speechSynthesis` helper for planner, implementer, reviewer, tester, and docs roles
- dependency graph routing that chooses top, bottom, left, or right ports based on node geometry
- use the repository-local track `media/deep-techno-mix-2026.mp3` as the default BGM source

deferred_scope:
- marketplace packaging or VSIX publishing
- external audio services or remote APIs
- server-side TTS
- broad dashboard redesign outside the requested parity items
- new telemetry or analytics

feature_flag:
- No dedicated feature flag is planned.
- The implementation must degrade gracefully when `speechSynthesis` or audio playback is unavailable.

rollback:
- Revert changes in `extension/task-plan-dashboard/extension.js`
- Remove new locale files if the parity work is rolled back
- Restore prior locale keys in `en.json` and `ru.json` if translations are reverted

required_artifacts:
- Updated production extension code in `extension/task-plan-dashboard/extension.js`
- Expanded locale pack in `extension/task-plan-dashboard/resources/locales/`
- Validation notes recorded back in `TASK-PLAN.md`
- Docs sync for extension usage if runtime behavior changes
- Wiring from the extension webview to `media/deep-techno-mix-2026.mp3`

wiki_updates:
- Update GitHub-facing usage notes only if the final implementation changes operator workflow
- Do not store machine-local profile metadata, secrets, or personal paths outside repository-relative references

typical_user_commands:
- "Bring the demo language switcher into the real dashboard."
- "Let me switch the dashboard to Japanese without reopening the panel."
- "Add the floating audio drawer with separate music and effects volume."
- "Give each agent role its own voice style for step narration."
- "Make dependency lines choose better ports so they stop tangling."
- "Keep the Markdown-first plan flow intact while adding the demo behaviors."
- "Do not invent a build step that this extension does not have."
- "Keep the extension safe when browser audio or speech APIs are blocked."

core_user_flows:
- The operator opens the Task Plan Dashboard view, changes the language from the dashboard UI, and all visible labels update in place without a full panel reload.
- The operator opens the floating audio drawer, the dashboard resolves the default BGM from `media/deep-techno-mix-2026.mp3`, the operator adjusts BGM and SFX independently, and sees the current now-playing state without breaking the rest of the dashboard.
- When a task or step bubble is narrated, the extension uses role-specific TTS pitch and rate settings, or safely skips playback if the runtime lacks support.
- The operator inspects the dependency graph and sees cleaner routing because vertical relationships use top or bottom ports and horizontal relationships use left or right ports.

ambiguous_requests:
- Whether TTS should auto-play on every relevant bubble or stay user-triggered must be frozen before implementation code starts.
- Whether the language switcher should reuse extension configuration or live entirely inside the webview must be frozen before implementation code starts.
- Whether the audio drawer should expose only the bundled default track or also preserve the demo-only upload workflow must be frozen before implementation code starts.

errors_and_edge_cases:
- Locale file missing a key must fall back cleanly instead of rendering raw `undefined`.
- Unsupported dashboard language must fall back to English or current existing default behavior.
- `speechSynthesis` may be unavailable or voices may load late in the webview runtime.
- Audio playback may require a user gesture before it can start.
- The webview may fail to resolve the bundled `media/deep-techno-mix-2026.mp3` URI if the extension-side path conversion is incorrect.
- Graph lines must not crash if a node is filtered out or has no measured coordinates yet.

clarification_triggers:
- Ask for clarification only if the maintainer wants autoplay behavior that conflicts with webview audio restrictions.
- Ask for clarification only if the maintainer wants the extension configuration schema expanded beyond the current runtime model.
- Ask for clarification only if the maintainer wants multi-track playlist behavior instead of the single bundled `media/deep-techno-mix-2026.mp3` baseline.

ui_entry_point:
- The feature lives inside the existing Task Plan Dashboard webview in the `taskPlanDashboardView` activity bar container.

ui_pattern:
- The base pattern stays a dashboard webview.
- New controls are layered into the existing panel as lightweight in-webview UI, not as separate commands or modal windows.

preview_behavior:
- The existing dashboard itself is the preview surface.
- `examples/demo-animated-web.html` is the visual reference oracle, not the runtime target.

apply_and_undo:
- Language changes apply immediately in-session.
- Audio drawer state is reversible by closing the drawer or resetting slider values.
- Code rollback remains a normal git revert or forward-fix workflow.

ui_states:
- default dashboard loaded
- alternate language selected
- audio drawer closed
- audio drawer open
- TTS available
- TTS unavailable fallback
- audio blocked until user gesture
- dependency graph rendered with updated routes

technical_design:
- Affected subsystems:
- `extension/task-plan-dashboard/extension.js`
- `extension/task-plan-dashboard/resources/locales/*.json`
- `media/deep-techno-mix-2026.mp3`
- extension-facing documentation if the operator workflow changes
- Runtime entry point:
- the `renderWebview(...)` HTML, CSS, and client-side script block inside `extension.js`
- Intent to action path:
- locale switcher updates webview strings and visible DOM labels
- audio drawer updates local webview state and shared audio engine volumes
- extension runtime resolves a safe webview URI for `media/deep-techno-mix-2026.mp3`
- TTS helper maps agent role and language into `SpeechSynthesisUtterance` settings
- graph routing recomputes ports before path generation
- Required APIs and contracts:
- `speechSynthesis` and `SpeechSynthesisUtterance` when available
- existing dashboard locale loading and fallback contract
- existing node coordinate and graph redraw lifecycle in the webview

constraints_and_forbidden_areas:
- Keep Markdown as the canonical workflow source; this feature is webview behavior only.
- Do not invent `npm run watch`; the extension currently has no build step in `package.json`.
- Do not overwrite unrelated dirty worktree changes already present in docs, templates, or extension files outside the scoped implementation.
- Do not add mocks, fake translations, fake audio backends, or placeholder assets.
- Do not switch the baseline BGM source to user-upload-only flow unless the scope is explicitly widened.
- Do not commit machine-specific Antigravity metadata or user profile files.

preview_or_dry_run_decision:
- No separate dry-run mode is needed.
- The safe preview surface is the local extension host plus manual dashboard smoke validation.

verification_strategy:
- Static validation:
- `node -c extension/task-plan-dashboard/extension.js`
- parse every locale JSON file with Node before closure
- Runtime smoke:
- open the dashboard and switch languages live
- open and close the audio drawer
- verify the dashboard resolves and can play `media/deep-techno-mix-2026.mp3`
- change BGM and SFX sliders independently
- trigger TTS behavior in a supported runtime or verify graceful no-support fallback
- inspect the dependency graph for cleaner routing
- Oracle:
- no syntax errors
- no JSON parse errors
- visible labels update live
- volume labels and controls stay in sync
- TTS does not crash the webview
- graph routing visibly reduces line tangles

negative_tests:
- set an unsupported language value and verify fallback
- verify the dashboard still renders when no speech voices are available
- verify the dashboard still renders when audio cannot autoplay
- verify the dashboard stays stable if the bundled mp3 cannot be resolved
- verify routing skips missing node coordinates without throwing

regression_risks:
- breaking current `en` or `ru` locale fallback
- introducing stale DOM labels after language switch
- destabilizing graph redraw timing
- bloating the webview with audio logic that breaks existing interactions

implementation_policy:
- No mocks.
- No placeholders.
- If a temporary replacement is truly unavoidable, the implementation task must create an explicit blocking alarm that states what is missing, how it will be replaced, and what closure is blocked.
