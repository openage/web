# Change log

## 2026-10-20 — Establish docs review and maintenance workflow

### Intent
Make the repository's human-readable architecture, feature, and component documentation part of workspace initialization and every relevant code change.

### Key Changes
- Added `docs/README.md` as a human-facing guide index and `docs/architecture.md` as a verified system overview.
- Corrected stale builder route/model/source references, theme guide relative links, and the component-configuration guide filename.
- Updated action, context-menu, layout, JSON editor, toggler, and builder-workspace guides to match current behavior; added a focused validation-service guide for the builder schema subset.
- Added documentation review and same-change update requirements to Copilot, Cline, Roo Code, Continue, and path-specific VS Code instructions.
- Updated the root README to point to the docs index and corrected the current Angular version in its development setup section.

### Verification
- Audited all Markdown links in `docs/` against the workspace; no broken local links remain.
- Compared the builder guide's route and metadata descriptions with `app.routes.ts` and the current builder models.

## 2026-10-20 — Record Angular 21 development standards

### Intent
Carry the requested Angular 21, TypeScript 5.9, SSR, Vitest, and accessibility standards into future coding-agent sessions.

### Key Changes
- Expanded the canonical architecture and style guidance with Signals-first state, RxJS boundaries, standalone APIs, modern template control flow, `inject()`, strict typing, Vitest, accessibility, and SSR/hydration requirements.
- Updated Copilot repository instructions and the project-rules agent with concise versions of these standards.

### Verification
- Confirmed the repository uses TypeScript strict settings, Angular's `@angular/build:unit-test` target, and Vitest.
- Confirmed the local development script targets port 4210.

## 2026-10-20 — Add cross-session agent memory workflow

### Intent
Make verified OA Pages project context discoverable across Copilot, Cline, Roo Code, and Continue sessions, with a consistent process for updating and pruning memory.

### Key Changes
- Added repository-wide Copilot instructions covering the Angular 21 architecture, relevant commands, component documentation, and memory workflow.
- Added `.agents/README.md` as the canonical memory index and `.agents/active-context.md` as a concise resume-note template.
- Added matching memory workflow rules for Cline, Roo Code, and Continue.
- Kept existing architecture guidance, decision log, and work log as canonical sources instead of copying their content into new files.

### Verification
- Confirmed the referenced instruction and memory files exist and their paths are correct.
- Reviewed the repository's package scripts and Angular configuration when recording commands.

## 2026-10-15 — Add metadata-driven builder

### Intent
Add a reusable three-panel builder to pages-app with a working page workspace and metadata-driven extension points for forms, dashboards, workflows, and custom workspace types.

### Plan
Reuse the reference page-builder's nested page layout shape, add signal-based workspace state and metadata/schema utilities, wire a builder route and diagnostics entry point, then validate the app build and focused utilities.

### Files Affected
- `src/app/builder/`
- `src/app/app.routes.ts`
- `src/app/diagnostics/diagnostics.component.ts`
- `src/styles.scss`
- `docs/builder-component.md`

### Key Changes
- Added metadata types and a registry with built-in page, form, dashboard, and workflow configurations.
- Added an extensible standalone builder with toolbox filtering, CDK drag/drop, recursive page sections/components, selection, property editing, auxiliary data/actions, summary/structure/JSON views, and local draft saving.
- Added schema validation and nested path/ID utilities.
- Added route metadata inputs/loading and a renderer registration hook for workspace-specific canvases.
- Documented builder inputs, configuration, behavior, theme tokens, and current server-publishing limitations.

### Verification
- `npm run build:local -- --progress=false` — passed.
- `npm exec -- vitest run --globals src/app/builder/builder-metadata.service.spec.ts src/app/builder/builder-path.util.spec.ts src/app/builder/json-schema-validator.service.spec.ts` — passed (3 files, 9 tests).
- Browser smoke check of `/builder/page` — passed; the three-panel page workspace renders with metadata-driven tabs, toolbox, summary, and workspace properties.

## 2026-10-15 — Host builders on dynamic pages

### Intent
Serve page and application builders through the existing dynamic-page route at `/:area/:collection/:code/builder`.

### Key Changes
- Removed the standalone `/builder/...` routes and taught dynamic pages to render builder components selected by navigation metadata.
- Added application workspace metadata and data loading, and updated diagnostics page editing and builder close/breadcrumb navigation for the nested route.
- Added `applications.builder.json` and `pages.builder.json` under the Applegos console navigation definitions.
- Updated builder and dynamic-page documentation.

### Verification
- `npm run build:local -- --progress=false` — passed.
- `npm exec -- vitest run --globals src/app/builder/builder-metadata.service.spec.ts src/app/builder/builder-path.util.spec.ts src/app/builder/json-schema-validator.service.spec.ts` — passed (3 files, 9 tests).
- `applications.builder.json` and `pages.builder.json` — parsed successfully as JSON.
- `http://localhost:4210/console/applications/console/builder` — local server returned HTTP 200 for the nested dynamic route.

## 2026-10-15 — Separate builder page and metadata regions

### Intent
Keep the dynamic-page component unchanged and render builder pages through a derived component with independent metadata-selected regions.

### Key Changes
- Added `BuilderPageComponent`, inheriting `DynamicPageComponent`, with registered `oa-toolbox`, `oa-properties`, and page/application/workflow canvas templates.
- Added a shared region renderer and headless builder controller so all three metadata-selected areas operate on one workspace state.
- Added explicit `/canvas/applications/:code/builder` and `/canvas/pages/:code/builder` routes, with Applegos nav metadata defining each region and its attributes.
- Updated diagnostics navigation and builder/dynamic-page documentation.

### Verification
- `npm run build:local -- --progress=false` — passed.
- `npm exec -- vitest run --globals src/app/builder/builder-metadata.service.spec.ts src/app/builder/builder-path.util.spec.ts src/app/builder/json-schema-validator.service.spec.ts` — passed (3 files, 9 tests).
- Builder navigation JSON parses and defines toolbar, canvas, and properties controls for both workspaces.
- Local `/canvas/applications/console/builder` route returned HTTP 200.
- `src/app/dynamic-page/` has no changes; the builder route is handled by `BuilderPageComponent`.

## 2026-10-15 — Extract OA builder regions and externalize metadata

### Intent
Split builder UI into reusable OA UX components and store page/application workspace definitions in their navigation metadata.

### Key Changes
- Added standalone `oa-toolbox`, `oa-properties`, `oa-page-canvas`, `oa-application-canvas`, and `oa-workflow-canvas` components under `src/lib/oa/ux`.
- Added a shared canvas view/controller contract and loaded workspace metadata from each dynamic page's `meta.builder`.
- Removed all built-in workspace configurations from `BuilderMetadataService`.
- Moved page and application tabs, toolbox groups/items, property schemas, validation schemas, defaults, and workspace paths into their respective console navigation JSON documents.
- Documented the five OA components and the shared canvas view.

### Verification
- `npm run build:local -- --progress=false` — passed.
- Focused Vitest builder suites — passed (3 files, 10 tests).
- Both navigation JSON documents parse and include the full workspace metadata plus toolbar/canvas/properties controls.

## 2026-10-15 — Scope builder schemas to owning controls

### Intent
Keep toolbox, property-editor, and workspace-validation configuration with the OA controls that consume it.

### Key Changes
- Moved `toolbox` into `oa-toolbox` options, `propertySchemas` into `oa-properties` options, and `validationSchema` into the selected canvas options in both console builder navigation documents.
- Updated `BuilderPageComponent` to compose region-owned options into the effective metadata consumed by the shared builder controller.
- Updated builder and OA region documentation to describe the per-control metadata shape.

### Verification
- Local Angular build passed.
- Focused builder Vitest suites passed (3 files, 10 tests).
- Both navigation documents parse and contain each schema under its owning control only.

## 2026-10-15 — Rename builder controls and actions metadata

### Intent
Align navigation control names and builder option shapes with the requested OA control API.

### Key Changes
- Renamed navigation control keys to `toolbar`, `properties`, and `application-canvas`.
- Moved the builder's view definitions from `meta.builder.tabs` to `meta.builder.actions`, and updated the metadata model, registry, controller, and templates.
- Flattened toolbar options to `groups`, and renamed properties/canvas schema options to `schema`.
- Renamed the component classes to `ToolbarComponent` and `PropertiesComponent`; each now resolves its own groups/property schema options and display state.
- Updated the builder navigation examples and OA component guides.

### Verification
- Local Angular build passed.
- Focused builder Vitest suites passed (3 files, 10 tests).
- Both navigation documents validate with the requested controls and option locations.
- `git diff --check` passed in both repositories.
