---
name: OA Pages project memory
alwaysApply: true
---

At workspace initialization, review `docs/README.md` and `docs/architecture.md`. At the start of each task, read `.agents/README.md`, the relevant architecture/decision notes, and the closest feature or component guide under `docs/`. Verify notes and documentation against current source, tests, configuration, and Git state.

At a meaningful milestone or before ending work, update only durable, verified memory:

- Record accepted architectural decisions in `.continue/rules/decision-log.md` using its existing format.
- Update `.continue/rules/architecture-and-style.md` only when stable architecture or conventions change.
- Keep `.agents/active-context.md` limited to unfinished work; clear or replace stale content.
- Add a concise completed milestone to `.agents/log.md`; do not copy the conversation.
- For user-visible feature, route, service behavior, metadata, or component changes, update the relevant human-readable guide in `docs/` in the same change. Create a focused guide if missing and update `docs/README.md` when its catalog changes.

Before saving, check for stale or conflicting entries, duplicate content, unsupported claims, and secrets or personal data. Supersede changed decisions with a link to the new entry. Keep source code and configuration authoritative when notes disagree.
