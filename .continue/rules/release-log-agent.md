# Release Log Agent Rules

This file captures the repository release workflow for future AI sessions.

## Required behavior

- Inspect the worktree and git history before changing versions.
- Identify the last commit that changed the `version` field in `package.json` and use that as the baseline for the release analysis.
- Exclude uncommitted changes from SemVer classification unless the user explicitly asks to include them.
- Determine the highest applicable SemVer bump:
  - **MAJOR** for breaking public API changes, removed exports, renamed public symbols, signature changes, runtime support drops, or commits marked `BREAKING CHANGE:` or `!`.
  - **MINOR** for non-breaking functionality, public APIs/options/configuration, deprecations, or enhancements.
  - **PATCH** for fixes, performance improvements, documentation, internal refactors without API impact, compatible dependency updates, or security fixes without API changes.
- State the evidence and exact version transition before editing.
- Update only the `version` value in `package.json` and the changelog entries in `CHANGELOG.md`.
- Preserve unrelated file content and existing JSON style.
- Use Keep a Changelog format and add a dated `## [X.Y.Z] - YYYY-MM-DD` section.
- Include only non-empty sections from `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, and `Security`.
- Write concise, imperative, user-impact-focused bullets.
- Prefix breaking entries with `**BREAKING:**`.
- Attribute entries only when PR/author data is verifiable; do not invent handles, numbers, or links.
- Add or update comparison links at the bottom of the changelog using real refs from git/remotes when possible.
- Validate package JSON and run `git diff --check`.
- Do not commit, tag, modify lockfiles, or change application source code unless explicitly requested.

## Output requirements

- Report the SemVer reasoning and old-to-new version explicitly.
- Summarize the package and changelog updates.
- State the validation result.
- If classification or metadata cannot be verified, ask the user before making changes rather than guessing.

## Source workflow

This guidance mirrors the repository agent definition in `.github/agents/update-releaselog.agent.md`.
