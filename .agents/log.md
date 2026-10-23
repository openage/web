# Change log

## 2026-10-23 — Restore builder grid after adding preview wrapper

### Key Changes
- Updated the configured `oa-layout` content and editor grid selectors to match its new `.builder-editor-surface` parent.

### Verification
- `npm.cmd run build:local -- --progress=false` — passed.
- `git diff --check` — passed.

## 2026-10-23 — OA Page Builder preview modes

### Intent
Align the OA page builder more closely with OpenPage's JSON-backed visual editing workflow by adding an immediate responsive preview.

### Key Changes
- Added Edit and Preview modes to page builder workspaces.
- Added desktop, tablet, and mobile preview frame widths.
- Rendered the current OA page layout with the existing `oa-layout` runtime, preserving OA page JSON as the source of truth.
- Documented that prompt-based AI editing is not yet configured, data-dependent previews use the builder's current context, and CSS media queries follow the app window width.

### Verification
- `npm.cmd run build:local -- --progress=false` — passed.
- `git diff --check` — passed.

## 2026-10-22 — Render builder regions in the configured editor grid

### Intent
Keep the application builder's Canvas and Properties visible beside the Toolbox instead of stacking them below the clipped builder viewport.

### Key Changes
- The outer `content` wrapper now remains full width; the three-column grid is applied to its nested `editor` section, which directly contains the configured controls.
- Narrow layouts continue to stack the regions vertically.
- Updated the builder page guide to describe its responsive layout.

### Verification
- `npm.cmd run build:local -- --progress=false` — passed.
- Browser check at `/console/applications/www-applegos/builder` confirmed the toolbar, Canvas, and Properties occupy distinct grid columns within the builder viewport.

## 2026-10-22 — Emit Canvas section selections and select dropped tools

### Intent
Make section-heading clicks observable for every section value and keep successful Canvas tool drops focused on the inserted item.

### Key Changes
- Canvas now emits the complete section value, including arrays, on heading clicks.
- The builder keeps array-valued section selection separate from the object-only Properties form.
- Successful toolbox insertions, including metadata values, become the active selection.
- Updated Canvas and builder guides and added focused coverage for section events and dropped-item selection.

### Verification
- `npm.cmd run build:local -- --progress=false` — passed.
- `npx.cmd tsc --noEmit -p tsconfig.app.json` — passed.
- Targeted ESLint for the changed TypeScript files — passed.
- Focused Angular tests remain blocked by existing unrelated application compilation errors in other components and templates.

## 2026-10-21 — Compose builder views as accessible layout tabs

### Intent
Give page and application builders separately composed Viewer, Editor, and Code tabs, while retaining synchronized context-bar navigation.

### Key Changes
- Added recursive builder-control discovery for nested layout metadata and kept the Editor canvas fixed to Editor mode.
- Synchronized context-bar view toggles with selected layout tabs and made layout tabs keyboard-operable with ARIA tab semantics.
- Updated the builder and canvas guides for the separate-view composition.

### Verification
- `npm.cmd run build:local -- --progress=false` — passed.
- Both Applegos builder JSON files validated against `.oa/schemas/nav.schema.json`; referenced templates and controls were checked.
- Focused Angular unit tests are blocked because the test build reports existing compilation errors in unrelated application components. Browser verification was not run because Applegos is configured with `env: "prod"`.

## 2026-10-20 — Document local Applegos content source

### Intent
Help coding agents trace local `/$content/` URLs to the corresponding served content files when a content update is requested.

### Key Changes
- Added `docs/content-data-guide.md` with URL decoding, path mapping to `D:\code\oa\solutions\applegos\data`, and a content-editing workflow.
- Linked the guide from the docs index and architecture guide and added it to Copilot, VS Code, and agent memory guidance.

### Verification
- Confirmed the local environment URL resolves to `system/applications/local.json` and that the corresponding file exists in the external data root.
- Confirmed the external directory contains JSON content, templates, and static assets organized under directories including `system/` and `assets/`.

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

## 2026-10-21 — Inline builder workspace ownership

### Intent
Keep builder state and behavior on `BuilderPageComponent` and remove the separate controller abstraction.

### Key Changes
- Passed the builder page instance directly to toolbox, canvas, and properties controls.
- Replaced the controller model with a shared `BuilderWorkspace` type contract.
- Updated builder architecture and control guides to reflect page-owned workspace behavior.

### Verification
- `npm.cmd run build:local -- --progress=false` — passed.
- Focused Vitest execution was blocked during Angular test-build compilation by unrelated errors in other components (including missing Quill imports/styles and template/type errors).
- `git diff --check` — passed.

## 2026-10-23 — Application builder controls for Console data

### Intent
Make Canvas, Toolbox, and Properties behavior match the application builder metadata and supplied application shape.

### Key Changes
- Aligned the Application Canvas section group with the configured `content` Toolbox group and gave Pages/Services cards explicit item labels.
- Enabled compatible drops on object and temporarily visible optional sections; allowed the builder to create missing configured section collections.
- Routed array section selections to an empty `collection` Properties schema rather than presenting blank fields for an individual item.

### Verification
- `npm.cmd run build:local -- --progress=false` and targeted ESLint passed. Both Applegos builder navigation files passed Draft 2020-12 schema validation, and Canvas group references plus the empty collection schemas were checked against the configured Toolbox/Properties options.
- Focused Vitest execution remains blocked while Angular compiles unrelated existing application errors (including AddressEditor template/type errors and missing Quill modules/styles). Browser verification was not run because Applegos `.oa/settings/default.json` has `env: prod`.
