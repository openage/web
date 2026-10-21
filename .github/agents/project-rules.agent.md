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

- Use Angular 21 and TypeScript 5.9 strict-mode conventions consistently; components, directives, and pipes are standalone, and new NgModules are not allowed.
- Use PascalCase for classes and camelCase for methods, properties, and signals.
- Prefer Angular `signal()`, `computed()`, `effect()`, `linkedSignal()`, and `resource()` where appropriate for local reactive state and data fetching. Use RxJS for asynchronous streams, events, and service-level cross-component messaging; bridge with `toSignal()` / `toObservable()` when appropriate.
- Use `inject()` instead of constructor injection where possible.
- Use `@if`, `@else`, `@for`, `@switch`, and `@defer` in templates; do not add deprecated `*ngIf` or `*ngFor` syntax.
- Prefer Angular host metadata/bindings to `@HostBinding` and `@HostListener` for new code.
- Keep TypeScript strict and avoid `any`; add or update focused Vitest tests for changed logic and do not introduce Jasmine/Karma tests.
- Preserve SSR and hydration compatibility: guard browser-only APIs and keep server/browser behavior boundaries explicit.
- Build accessible UI with semantic HTML, keyboard support, labels, focus behavior, and ARIA when native semantics are insufficient.
- Keep services explicit, small, and focused; avoid broad, opaque orchestration layers.
- Follow clear import grouping and dependency injection patterns.
- Prefer defensive checks, early returns, and explicit guard logic.
- Existing templates may still use legacy structural directives; use modern Angular control flow in changed templates and avoid adding more legacy syntax.
- Use logger utilities and UI fallback components for failure/maintenance states instead of silent error handling.

## Key Constraints and Decisions

- The app is intentionally configuration-driven and should be extended in a way that preserves JSON-driven page composition.
- Prefer a single root application shell pattern over route-by-route screen code when adding new behavior.
- Layout and theme choices are runtime-driven from app metadata and page metadata; preserve this behavior when changing styling or layout logic.
- Guarded navigation is a core design constraint: respect role/session/page access checks.
- The platform is designed to support tenant-aware and role-aware behavior through the shared context layer.
- Styling can be theme-driven and global; do not bypass the existing theming and injected style pattern.

## Workflow Instructions

1. **At workspace initialization**, review `docs/README.md` and `docs/architecture.md`; inspect the docs index against the source tree and note stale/missing relevant guides.
2. **Before starting a task**, read `.continue/rules/decision-log.md` and the guide in `docs/` that covers the affected feature/component.
3. **Before modifying code**, align with the architecture and style notes above and `.continue/rules/architecture-and-style.md`.
4. **With every user-visible feature, route, service behavior, metadata, or component change**, update the closest human-readable guide in `docs/`; create one if absent and update `docs/README.md` when the guide catalog changes. Verify behavior and source links against the current implementation.
5. **After a significant architectural decision**, append an entry to `.continue/rules/decision-log.md` using the format defined there.
6. **For release-related work**, follow `.github/agents/update-releaselog.agent.md` and validate changes with the repository release workflow.
7. **When uncertain**, ask the user for clarification instead of guessing at architectural intent.
