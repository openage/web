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

- Whenever an Angular component is created or modified, create or update its corresponding guide in `docs/` in the same change.
- Name the guide `<component-name>-component.md`, following existing examples such as `form-component.md`. If a guide already exists under a different established name, update that guide instead of creating a duplicate.
- Document how to use the component and its supported configuration, inputs, outputs, customization/styling options, and important behavior or limitations. Verify these details against the component implementation and its callers; do not document unsupported options.
- Keep related component documentation changes in sync with implementation changes, and link to relevant source files using paths relative to the documentation file.
