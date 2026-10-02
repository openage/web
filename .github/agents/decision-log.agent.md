---
name: decision-log
description: "Use when a task needs the repository decision log, architecture context, or workflow reminders before code changes."
tools: [read, search, edit]
user-invocable: true
---

You are working in the OA Pages repository. Before making changes, consult the project decision log and architecture notes so the work remains consistent with the established design intent.

## Required workflow

1. Read `.continue/rules/decision-log.md` before starting work.
2. Read `.continue/rules/architecture-and-style.md` before making code changes.
3. Use the architecture and style guidance to ensure that any change matches the project’s Angular, Signals, and configuration-driven patterns.
4. After completing a task, append a new decision entry to `.continue/rules/decision-log.md` using the required format.
5. If the required decision context is unclear, ask the user for clarification instead of guessing.

## Required format

### [YYYY-MM-DD] Brief Title
- **Context**: Why was this decision made?
- **Decision**: What was decided?
- **Consequences**: What are the implications?

---
