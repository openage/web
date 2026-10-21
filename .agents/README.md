# Project memory index

This repository keeps durable agent context in a few focused, version-controlled files. Read this index first, then open only the files relevant to the task. Verify remembered details against the current code, tests, and configuration.

## Canonical sources

- [Human-readable project documentation](../docs/README.md): documentation index; read [system architecture](../docs/architecture.md) during workspace initialization and the closest feature/component guide before edits.
- [Architecture and style](../.continue/rules/architecture-and-style.md): stable project structure, conventions, constraints, and agent workflow.
- [Decision log](../.continue/rules/decision-log.md): accepted decisions and significant changes, with context and consequences.
- [Work log](log.md): concise milestones and implementation notes. This is historical context, not an authority over current code.
- [Active context](active-context.md): unfinished work that a later session should resume. Clear or replace it when work changes.
- [Component documentation instruction](../.github/instructions/component-documentation.instructions.md): documentation requirements for Angular component changes.

## Update policy

- Add only durable, verified information that would help a future session make a better decision.
- Put a rule in architecture/style guidance, a decision in the decision log, unfinished work in active context, and a completed milestone in the work log.
- When a decision changes, mark the earlier entry as superseded and link to the replacement; do not leave conflicting decisions active.
- Prefer links to source, configuration, tests, issues, or commits over copied explanations.
- Do not save credentials, tokens, personal data, raw conversations, temporary guesses, or information already obvious from maintained source files.
- Review the diff after every memory update. Prune stale active context and obsolete or duplicated notes.
- For user-visible feature, route, service, or metadata changes, update the relevant human-readable guide in `docs/`; create one if none exists and keep the docs index current.
