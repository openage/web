# OA Pages project instructions

## Project
- OA Pages is an Angular 21 application for building dynamic web applications from JSON-based page and application metadata.
- The application uses TypeScript 5.9 strict settings, Angular's standalone architecture, and Angular's Vitest unit-test builder.
- Server rendering is configured through `@angular/ssr` and Express. Keep browser-only APIs out of server execution paths and preserve SSR/hydration compatibility.
- App-specific features live in `src/app`; reusable OA controls and services live in `src/lib/oa`.
- Page composition, navigation, permissions, and theme behavior are configuration-driven. Preserve these patterns when changing the application.
- The current architecture and coding conventions are documented in `.continue/rules/architecture-and-style.md`.

## Working in this repository
- At workspace initialization, review `docs/README.md` and `docs/architecture.md`; use the index to understand available feature/component guides. Before each code change, inspect the relevant implementation, nearby tests, current Git diff, and the closest human-readable guide.
- Follow the Angular 21 standards in `.continue/rules/architecture-and-style.md`: standalone declarations, `inject()`-based dependency injection, signals for local reactive state, and modern template control flow (`@if`, `@for`, `@switch`, `@defer`). Do not introduce NgModules, deprecated structural directives, constructor injection, or new Jasmine/Karma tests.
- Use RxJS for asynchronous streams, event handling, and service-level cross-component messaging; use `toSignal` / `toObservable` at Angular boundaries where appropriate. Use `linkedSignal` or `resource` when they fit the data flow and the repository's established APIs.
- Keep TypeScript strict and fully typed; avoid `any`. Use accessible semantic HTML, labels, keyboard support, and ARIA where needed. Prefer Angular host metadata/bindings and `inject()` over `@HostBinding` / `@HostListener` and constructor injection for new code.
- Add or update focused Vitest tests when introducing or changing logic, following the configured Angular unit-test builder and existing test patterns.
- Use the package's configured environment scripts. Local development is `npm run local` (configured as `ng serve -c=local --open --port 4210`) or `ng serve -c=local --port 4210` when starting without the browser-open flag; use the matching `dev`, `qa`, or `production` configuration when required.
- When changing an Angular component, update or create its corresponding guide in `docs/` in the same change, following `.github/instructions/component-documentation.instructions.md`.
- For any user-visible feature, route, shared service behavior, or metadata-contract change, update the relevant guide in `docs/` in the same change. Create a focused human-readable guide if none exists, verify its claims and links against source, and update `docs/README.md` when adding, renaming, or removing a guide.
- Keep changes focused. Do not edit generated output or introduce dependencies, public API changes, or architectural patterns without a clear reason.
- Never record credentials, tokens, personal data, raw chat transcripts, or unverified assumptions in project memory.

## Commands
- Start local development: `npm run local` (serves on port 4210).
- Local build: `npm run build:local -- --progress=false`.
- Tests: `npm test` (Angular test target; inspect its configured runner before selecting a focused invocation).
- Lint: `npm run lint` runs the configured Angular lint target with `--fix`; inspect the target before running if avoiding automatic edits is important.
- Use only commands relevant to the change and report any validation not performed.

## Persistent project memory
- Read `.agents/README.md` to find the canonical memory files; verify notes against the current source and configuration.
- Record architectural decisions in `.continue/rules/decision-log.md`; update `.continue/rules/architecture-and-style.md` only when stable conventions or architecture change.
- Keep `.agents/active-context.md` limited to unfinished work and replace stale content when the task changes.
- Add concise milestone history to `.agents/log.md`; do not copy chat transcripts or duplicate the decision log.
- Review memory edits for evidence, contradictions, staleness, duplication, and sensitive information.
