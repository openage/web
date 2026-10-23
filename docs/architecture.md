# OA Pages system architecture

OA Pages is an Angular application that renders configurable web applications from application and page metadata. The repository combines an app-specific shell and feature routes in `src/app` with reusable OA controls and services in `src/lib/oa`.

## Runtime flow

1. Application startup configures the router, HTTP support, and application providers in `src/app/app.config.ts` and bootstraps the app from `src/main.ts`.
2. Route guards and `RouteDataResolver` resolve access and page/navigation data for route-driven pages.
3. `DynamicPageComponent` uses the resolved metadata and shared `oa-layout` renderer to display configured sections and controls.
4. The layout resolves component control names to registered standalone controls. Page JSON defines composition and options while controls implement reusable behavior.
5. `ContextService`, `NavService`, and `UxService` coordinate shared application/page state, navigation, theme styling, and UI state.

## Route and feature boundaries

- `src/app/app.routes.ts` declares error, diagnostics, builder, and nested dynamic-page routes.
- `src/app/dynamic-page/` hosts metadata-driven pages.
- `src/app/page-builder/` hosts the builder page, which extends the dynamic-page lifecycle and composes builder regions from reusable controls.
- `src/lib/oa/core/` contains shared services, guards, models, and layout infrastructure.
- `src/lib/oa/ux/` contains reusable UX controls, including form, list, layout, canvas, toolbox, and properties controls.
- `src/lib/oa/components/` contains additional domain-oriented reusable controls.

The dynamic builder route is `/:area/:collection/:code/builder`; `canvas/pages/:code/builder` is also supported, and the legacy application-builder path redirects to the Console application builder. The route and metadata definitions in the current source are authoritative if examples elsewhere have drifted.

## Configuration-driven composition

Application metadata controls shared shell elements, theme, and navigation. Page metadata controls data sources, actions, layout sections, and components. Nested sections and component arrays are rendered through the common layout path, so new user-facing page behavior should normally extend the metadata contract or reusable control rather than add a route-specific hard-coded screen.

In local Applegos development, runtime application and page content may be served from the separate data repository through `/$content/` URLs. Map those URLs to the external data root using the [runtime content data guide](./content-data-guide.md); do not confuse served content files with application source code.

Builder metadata configures the canvas, toolbox groups, editable properties, and validation schema. `BuilderPageComponent` coordinates their data and events: the canvas reads the configured root from `ContextService.data`, the toolbox emits selected tools, and Properties emits edited objects. The controls do not receive a shared builder workspace object. See [the builder page guide](./builder-page-component.md), [control data-flow guide](./builder-workspace.md), and [page metadata guide](./page-meta-components.md).

## State and data responsibilities

- `ContextService` owns shared reactive application, user/session, navigation, page, permissions, theme, and UI state.
- `NavService` resolves navigation and page metadata and performs path-driven navigation.
- `DataService` and `DataSourceService` implement shared data access and data-source behavior for configured controls.
- `UxService` coordinates UI-level state such as progress and dynamically applied theme/application styles.
- `CacheService` provides the configured client-side caching used for drafts and other cached data.

Prefer local signals for component state and use shared services for state that crosses component boundaries. Preserve the existing RxJS stream contracts where asynchronous data or event flows already use them.

## Server rendering

The Angular application includes `@angular/ssr` and an Express server entry point. Any code that uses `window`, `document`, storage, or other browser-only APIs must respect the server/browser boundary. Keep rendering and hydration behavior in mind when adding startup logic, effects, or DOM manipulation.

## Development and verification

- Local development: `npm run local` (port 4210).
- Local build: `npm run build:local -- --progress=false`.
- Unit tests: `npm test`, using the Angular unit-test builder and Vitest.
- Lint: inspect `npm run lint` before running because it enables `--fix`.

The detailed project rules live in [architecture and style memory](../.continue/rules/architecture-and-style.md). This guide describes the system for human readers; verify implementation details in the linked source before editing.
