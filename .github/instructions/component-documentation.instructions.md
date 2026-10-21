---
description: "Use when creating or modifying an Angular UI component in pages-app. Keep the matching component guide in docs accurate with its usage, options, styling, and behavior."
name: "Component Documentation"
applyTo:
  - "src/**/*.component.ts"
  - "src/**/*.component.html"
  - "src/**/*.component.scss"
  - "src/**/*.component.css"
---

# Component documentation

- Whenever an Angular component is created or modified, create or update its corresponding human-readable guide in `docs/` in the same change.
- Name the guide `<component-name>-component.md`, following existing examples such as `form-component.md`. If a guide already exists under a different established name, update that guide instead of creating a duplicate.
- Document how to use the component and its supported configuration, inputs, outputs, customization/styling options, and important behavior or limitations. Verify these details against the component implementation and its callers; do not document unsupported options.
- Keep related component documentation changes in sync with implementation changes, and link to relevant source files using paths relative to the documentation file.
- At the start of a workspace session, review `docs/README.md` and `docs/architecture.md`; for each task, read the relevant guide before implementation and verify it against current code.
- Apply the same documentation requirement to user-visible route, service, data-flow, or metadata-contract changes. If no guide covers the feature, create a focused guide and add it to `docs/README.md`.
- Write for developers and metadata authors: document supported behavior, configuration, examples, accessibility or SSR constraints where relevant, and known limitations. Do not document unsupported behavior or put internal agent-memory instructions in user-facing guides.
- Review Markdown source links and examples whenever the implementation changes; fix stale paths or contracts in the same change.
