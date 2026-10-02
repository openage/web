## Architecture

- The application is an Angular 21 SPA built around a JSON-driven page model rather than a static set of prebuilt screens.
- The app shell lives under `src/app`, with `app.component.ts` and `app.component.html` acting as the global layout wrapper around header, sidebar, footer, and routed content.
- Route structure is intentionally hierarchical in `src/app/app.routes.ts`:
  - `/` redirects to `/home`
  - `/errors/:code` handles error screens
  - `/debug` is a guarded debug route
  - `/:area/:collection/:code/:action` resolves dynamic page instances via page guards and route data resolution
- Dynamic page rendering is centered on the `DynamicPageComponent`, while the app uses `ContextService`, `NavService`, and `UxService` to keep page metadata, navigation state, and theme/style state consistent across the app.
- `ContextService` is the central state container. It exposes signals for application metadata, user/session context, permissions, navigation, page selection, theme, and maintenance/processing flags.
- `NavService` resolves page metadata and navigation links from app configuration and route data, and is responsible for path-driven navigation behavior.
- `UxService` is the UI orchestration layer: it injects theme CSS and app styles into the document head, tracks progress items, and manages common UI state resets.
- The repository is organized into a reusable library under `src/lib/oa` and a feature app under `src/app`:
  - `core/` contains services, guards, models, and shared UI building blocks
  - `components/` and other feature directories contain page components and reusable UI modules
- The README documents a strong design goal: application structure and page structure are defined via JSON metadata, so pages, sections, components, and layout behavior can be configured without creating many hard-coded screens.
- The system emphasizes environment-specific configuration (`local`, `dev`, `qa`, `prod`) through Angular build targets and environment files.

## Coding Style

- TypeScript and Angular conventions are followed consistently:
  - classes use PascalCase (`AppComponent`, `ContextService`, `NavService`)
  - methods, properties, and signals use camelCase (`setTheme`, `underMaintenance`, `layoutType`)
  - Angular dependency injection uses `inject()` and `signal()` prominently
- State management follows Angular Signals patterns, especially for app-global state and reactive UI updates:
  - `signal()` for state
  - `computed()` for derived values
  - `effect()` for side effects tied to state changes
- The code favors explicit, small, self-contained services over broad global orchestration.
- Imports are grouped by domain and framework, with Angular/core imports before local modules; classes generally have clear constructor injection and root-level `providedIn: 'root'` services.
- TypeScript style is explicit and defensive:
  - early returns for invalid states
  - null-safe checks before property access
  - clear guard logic (`pageGuard`, `roleGuard`, `sessionGuard`)
- Templates use Angular’s modern control-flow syntax (`@if`, `@switch`), but older structural directives and template outlets still coexist in the app.
- The codebase generally prefers simple, readable formatting and explicit naming over abstraction-heavy patterns.
- Error handling is pragmatic:
  - route guards limit unauthorized navigation
  - logger utilities provide structured debugging
  - UI fallbacks such as `NotAvailableComponent` and `ErrorComponent` are used for unavailable content or failure states

## Key Constraints and Decisions

- The app is intentionally configuration-driven: page and application metadata are treated as first-class inputs, which makes the platform adaptable to many use cases without code rewrites.
- The app assumes a single root application shell with dynamic page composition, rather than a route-per-screen architecture.
- Layout and theme choice are determined at runtime from application metadata (`app.layout`, page metadata, and theme styles), which means visual behavior is inherited from configuration as much as component code.
- Guarded navigation is a core design constraint: access checks are enforced before route resolution and page rendering.
- The platform is designed to support tenant- and role-aware behavior via `ContextService` and permission checks.
- Styling is partially theme-driven and partially component-scoped; global CSS is injected dynamically into the document head to support theme switching and shared app styling.
- The project is strongly tied to Angular and the Angular CLI ecosystem; build and run flows are aligned with environment-specific Angular configuration files.

## Agent Workflow Instructions

1. **Before starting any task**, read `decision-log.md` to understand prior decisions.
2. **Before modifying code**, refer to the architecture and style sections above to ensure consistency.
3. **After completing a task**, append a new entry to `decision-log.md` using the format specified in that file.
4. **When uncertain**, ask the user for clarification rather than guessing at architectural intent.
5. **For release-related work**, follow the repository release workflow in `.github/agents/update-releaselog.agent.md`: inspect git history and diffs, classify the SemVer bump using evidence, update only `package.json` and `CHANGELOG.md`, and validate with `git diff --check`.
6. **Do not fabricate version history, PR attribution, or comparison links**; if those details cannot be verified, state the limitation explicitly instead of guessing.
