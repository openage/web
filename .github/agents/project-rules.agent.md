---
name: project-rules
description: "Use for repository-specific architecture, style, and workflow guidance for the OA Pages app."
tools: [read, search, edit]
user-invocable: true
---

You are working in the OA Pages Angular application. Follow the repository's architecture and coding guidance before making changes.

## Architecture

- This is an Angular 21 SPA built around a JSON-driven page model rather than a static set of hard-coded screens.
- The root app shell is in `src/app` and is responsible for the global layout wrapper around the header, sidebar, footer, and routed content.
- Route configuration in `src/app/app.routes.ts` is hierarchical and supports dynamic route-driven pages via guards and route data resolution.
- The application centralizes state in `ContextService`, with support from `NavService` and `UxService` for navigation, metadata, theming, and UI orchestration.
- Page structure, layout, and configuration are driven by JSON metadata and runtime app/page settings rather than route-specific screens only.
- The project is organized into reusable library code under `src/lib/oa` and app-specific feature code under `src/app`.
- Environment-specific builds are managed through Angular configuration targets such as `local`, `dev`, `qa`, and `prod`.

## Coding Style

- Use TypeScript and Angular conventions consistently.
- Use PascalCase for classes and camelCase for methods, properties, and signals.
- Prefer Angular `signal()`, `computed()`, and `effect()` for reactive state and side effects.
- Keep services explicit, small, and focused; avoid broad, opaque orchestration layers.
- Follow clear import grouping and dependency injection patterns.
- Prefer defensive checks, early returns, and explicit guard logic.
- Existing templates mix modern Angular control flow (`@if`, `@switch`) with older structural conventions, so keep compatibility in mind when editing templates.
- Use logger utilities and UI fallback components for failure/maintenance states instead of silent error handling.

## Key Constraints and Decisions

- The app is intentionally configuration-driven and should be extended in a way that preserves JSON-driven page composition.
- Prefer a single root application shell pattern over route-by-route screen code when adding new behavior.
- Layout and theme choices are runtime-driven from app metadata and page metadata; preserve this behavior when changing styling or layout logic.
- Guarded navigation is a core design constraint: respect role/session/page access checks.
- The platform is designed to support tenant-aware and role-aware behavior through the shared context layer.
- Styling can be theme-driven and global; do not bypass the existing theming and injected style pattern.

## Workflow Instructions

1. **Before starting any task**, read `.continue/rules/decision-log.md` to understand prior decisions.
2. **Before modifying code**, align with the architecture and style notes above and with the project rules in `.continue/rules/architecture-and-style.md`.
3. **After completing a task**, append a new entry to `.continue/rules/decision-log.md` using the format defined there.
4. **For release-related work**, follow `.github/agents/update-releaselog.agent.md` and validate changes with the repository release workflow.
5. **When uncertain**, ask the user for clarification instead of guessing at architectural intent.
