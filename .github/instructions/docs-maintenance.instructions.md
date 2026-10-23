---
name: Documentation maintenance
description: Keep human-readable architecture, feature, metadata, and component guides aligned with code changes.
applyTo: "src/**/*,angular.json,README.md"
---

# Documentation maintenance

- At workspace initialization, review `docs/README.md` and `docs/architecture.md`; before a task, open the closest guide for the affected feature, route, service, metadata contract, or component.
- When a local Applegos URL contains `http://localhost:8080/%24content/`, consult `docs/content-data-guide.md` and map the decoded URL-relative path into `D:\code\oa\solutions\applegos\data` before deciding which file to edit.
- Update the relevant human-readable guide in `docs/` in the same change as any user-visible behavior, public configuration, route, service contract, or component change.
- Create a focused guide when no existing page adequately documents the changed feature; add it to `docs/README.md`.
- Verify examples, limitations, and relative source links against the current implementation. Correct stale documentation instead of copying or extending a contradicted example.
- Write for developers and application/metadata authors. Keep internal agent workflow instructions in agent customization files, not user-facing docs.
