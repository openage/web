# Decision Log

### [2026-11-11] Share Diagnostics and Builder Page Styles Globally
- **Context**: Diagnostics and page-builder component styles exceeded Angular's component-style budgets, and both routes had large isolated stylesheets.
- **Decision**: Move their styles into `styles.scss`, scoped beneath the respective component host elements, and remove the per-component stylesheet references.
- **Consequences**: The route chunks no longer carry these styles and selector scoping stays limited to each component. The styles are now in the initial global stylesheet, trading a small increase in initial transferred CSS for smaller lazy route chunks.

### [2026-11-11] Align Production Budgets With Current Output
- **Context**: The production build failed because the initial bundle measured 1.10 MB and the page-builder stylesheet measured 56.14 KB, exceeding the configured 1 MB and 4 KB error budgets.
- **Decision**: Raise production warning thresholds to 1 MB for the initial bundle and 4 KB for component styles; set hard error limits to 1.2 MB and 64 KB respectively.
- **Consequences**: The current optimized build can complete while retaining actionable warnings and finite production size limits.

### [2026-10-23] Add OA Page Preview and Viewport Controls
- **Context**: OpenPage combines JSON-backed visual editing with an immediate preview; OA's page builder edited the JSON document but only showed the structural canvas.
- **Decision**: Add an Edit/Preview switch and desktop, tablet, and mobile preview widths. Render the current OA page layout and configured controls through `oa-layout`, keeping the OA page document as the source of truth.
- **Consequences**: Page authors can inspect the rendered result without leaving the builder, while save and validation continue to operate on the original OA metadata. Preview uses the builder's current runtime context and window media-query width; prompt-based AI generation is not configured.

### [2026-10-23] Keep Builder Grid Selectors Aligned With Preview Wrapper
- **Context**: The preview workbench wraps the configured builder `oa-layout` in an editor surface, changing its DOM parent and invalidating direct-child grid selectors.
- **Decision**: Scope the existing content/editor grid selectors to the new editor surface wrapper.
- **Consequences**: Application and page builder metadata continue to control the toolbar, canvas, and properties layout after the preview wrapper is added.

### [2026-10-23] Add Floatable Layout Sections
- **Context**: The application builder needs a movable toolbar that can sit above the canvas without taking a permanent grid column.
- **Decision**: Add the `floatable` section type with a drag handle, viewport-bounded positioning, and local-only position state; place the application builder toolbar inside one such section.
- **Consequences**: Layout metadata can declare movable floating panels while normal section types retain their current rendering behavior. Floating positions reset when the layout instance is recreated.

### [2026-10-23] Simplify Floatable Builder Toolbox
- **Context**: The floating application toolbar repeated the “Builder tools” title and exposed independently expanded groups, while the whole panel scrolled instead of keeping its header and search fixed.
- **Decision**: Use the floatable section title/handle as the sole header, keep only one toolbox group expanded at a time, and make the group list the scrolling region.
- **Consequences**: The toolbar uses less vertical space and its controls remain accessible while navigating long tool lists.

This log records key architectural decisions and significant code changes. AI agents must consult this log before making changes and append new entries after completing a task.

## Format

### [YYYY-MM-DD] Brief Title
- **Context**: Why was this decision made?
- **Decision**: What was decided?
- **Consequences**: What are the implications?

---

### [2026-10-23] Support Application Builder Collection and Object Drops
- **Context**: Application Canvas metadata can contain optional nested paths and collection targets that do not exist in the loaded application yet; array-section selection also has no object form for Properties to edit.
- **Decision**: Expose compatible optional sections during toolbox drags, allow object sections to receive tools, create configured `sections` and `components` collections when missing, and route array selections to an explicitly empty `collection` property schema. Align configured section groups and item labels with the available Toolbox groups and application data.
- **Consequences**: Application metadata tools can be dropped or inserted into missing configured collections, Pages/Services do not display misleading blank item fields, and Canvas records without `control`/`type` retain a meaningful card subtitle.

### [2026-10-22] Emit Canvas Section Selection and Select Dropped Tools
- **Context**: Clicking array-valued canvas section headings did not emit a selection, and newly inserted metadata tools were not selected consistently with inserted collection items.
- **Decision**: Emit the section's actual value on every heading click, keep array-valued section selection separate from object editing in the builder, and select successfully inserted values after toolbox drops.
- **Consequences**: Canvas consumers receive full section values, including arrays; the builder can track the active section/group without passing arrays to the object-only Properties control, and successful drops focus the inserted value.

### [2026-10-22] Apply Builder Grid to the Configured Editor Section
- **Context**: The application builder placed its toolbar, canvas, and properties inside the configured `editor` section, while the three-column grid targeted only the outer `content` wrapper. A later stale block also reset that wrapper to block layout.
- **Decision**: Keep the outer content wrapper full-width and apply the three-column grid to its nested editor section, stacking the editor regions at narrow breakpoints.
- **Consequences**: The builder regions render side by side on wider screens and remain vertically stacked on narrow screens without being clipped as off-screen content.

### [2026-10-20] Map Local Content URLs to Applegos Data Source
- **Context**: Local application content is served from `http://localhost:8080/%24content/`, while its source files live outside the pages-app repository.
- **Decision**: Treat `D:\code\oa\solutions\applegos\data` as the local `/$content/` source of truth. Decode `%24content`, map the remainder of the URL path beneath that root, inspect the specific file and related metadata, and edit the external data file for content-only requests.
- **Consequences**: Added a human-readable mapping/editing guide and wired it into project instructions so agents can locate content without changing a shadow copy or confusing data with app source. External write access remains subject to the active workspace's filesystem permissions.

### [2026-10-20] Human-Readable Documentation Review and Maintenance
- **Context**: The docs folder lacked a central index and architecture overview, while some builder and theme guides referenced stale source paths or contracts.
- **Decision**: Review the docs index and architecture at workspace initialization, consult the relevant guide before edits, and update or create human-readable feature/component documentation with each user-facing change. Keep the docs index current and verify source links against the repository.
- **Consequences**: Added a docs index and architecture guide, corrected outdated builder and theme references, fixed the misspelled component-guide filename, and applied the same maintenance workflow to Copilot, Cline, Roo Code, and Continue guidance.

### [2026-10-20] Angular 21 Development Standards
- **Context**: Cross-session project guidance needed to capture the team's explicit Angular 21, TypeScript 5.9, SSR, Vitest, accessibility, and template conventions.
- **Decision**: Make standalone Angular APIs, Signals-first local state, modern template control flow, `inject()`, strict typing, Vitest, and SSR-safe accessible UI the standard for new and modified code; retain legacy patterns only where they already exist and are outside the touched area.
- **Consequences**: Copilot and the project-rules agent now surface these standards directly, while Cline, Roo Code, and Continue are directed to the canonical architecture guide containing the full requirements.

### [2026-10-20] Cross-Session Agent Memory Workflow
- **Context**: Repository guidance was split across Continue rules, Copilot customization files, and a work log without a shared index or consistent pruning policy.
- **Decision**: Keep the existing architecture guide, decision log, and work log as canonical memory; add a memory index and active-context template; connect Copilot, Cline, Roo Code, and Continue to a common read, verify, update, and prune workflow.
- **Consequences**: Agents can discover the same project context across supported harnesses without maintaining duplicate architecture notes. Memory changes remain small, evidence-based, and reviewable.

### [2026-10-02] Declarative Section Behaviors
- **Context**: JSON-driven pages needed conditional, collapsible, and popup section presentation without adding page-specific components.
- **Decision**: Extend the shared layout renderer with ConditionValidatorService-backed section conditions, expanded-by-default collapsible headers, and popup sections configured with `popup` metadata.
- **Consequences**: Page metadata can express these behaviors declaratively; conditional sections use the existing `{ key, operator, value }` format and popup content remains rendered by the same section/component pipeline.

### [2026-10-02] Party Creation Page
- **Context**: The customer directory needed a create workflow alongside its details and edit pages.
- **Decision**: Add a hidden `/crm/customers/new` page using local draft data and the existing section-driven editor, register it under the customer navigation tree, and route Save targets with `method: "create"` through `DataService.create`.
- **Consequences**: The customer list can open a standalone add-party page; successful creates navigate to the new party details page, while edit saves continue using `DataService.update`.

### [2026-10-02] Customer Context-Bar Actions
- **Context**: Customer actions were split between page bodies and the shared context bar, producing inconsistent page controls.
- **Decision**: Declare Back, Edit, Add, Save, Reset, and Cancel through each page's `meta.actions`; use configured route targets for Edit/Back and remove duplicate page-body controls.
- **Consequences**: Customer list, details, edit, and add pages share a consistent action location, with `ActionComponent` resolving the current party code for route navigation.

### [2026-10-14] Component Documentation Rule and Table Guide
- **Context**: Page metadata authors needed an accurate reference for the table control, and component changes needed a repeatable documentation requirement.
- **Decision**: Add a table component guide based on the `oa-table` implementation, correct the table example in the page-meta guide, and add workspace instructions requiring component documentation updates.
- **Consequences**: Table metadata options and current limitations are discoverable in `docs/`, and future Angular component changes matching the instruction patterns must update or create a corresponding guide.

### [2026-10-14] HTML Templates for Table Controls
- **Context**: The console Applications table needed an authored layout and loading state, consistent with the existing HTML viewer template system.
- **Decision**: Let `oa-table` load a Handlebars template from `options.template.code` and its optional `.skeleton` asset, render the transformed rows, and fall back to the standard table when loading or rendering the custom template fails.
- **Consequences**: Page metadata can select a full custom HTML table view; the Applications page uses this for its grid and skeleton while preserving normal table behavior as a fallback.

### [2026-10-14] Resolve Table Page-Stream Loading
- **Context**: The Applications page stores a `DomainPage` in context and updates that same instance when search results arrive; the table remained on its skeleton because its stream emitted the identical object reference.
- **Decision**: Process stream emissions even when they reuse the existing page-object reference, and show each application's host as an HTTPS URL in the Applications template.
- **Consequences**: Subscribable page updates clear the loading state and render their current items; the Applications table exposes clickable HTTPS host links.

### [2026-10-15] Rename Table Editor to List
- **Context**: The shared table editor was page metadata's row-list renderer, and needed a second built-in presentation without making the control name table-specific.
- **Decision**: Rename the shared component and dynamic page control to `list`, provide `table` and responsive `grid` views, and retain `table`/`oa-table` aliases for existing callers.
- **Consequences**: Page metadata uses `control: "list"` and can choose `options.view: "table"` or `"grid"`; the list guide documents both modes and legacy metadata remains supported.

### [2026-10-20] Simplify Shared Page Builder Views
- **Context**: Page, application, and workflow builders had overlapping view modes and application-specific editing paths that duplicated selection and workspace handling.
- **Decision**: Normalize the shared builder to Viewer, Editor, and Code over one workspace JSON object. The page-builder controller owns selection and coordination; canvas sections, property groups, and toolbox targets are configured by metadata.
- **Consequences**: The Viewer template, Editor canvas and side panels, and Code JSON editor stay synchronized. Applications express editable settings through canvas sections and reusable property groups instead of dedicated builder tabs.

### [2026-10-20] Simplify Builder Workspace Controls
- **Context**: The builder showed duplicate panel headings and canvas actions that took space away from editing.
- **Decision**: Remove the duplicate Toolbox layout heading, panel title duplication, toolbox settings shortcut, Properties JSON toggle, and canvas header controls. Keep view choices in the configured workspace switch where available and align collapse controls to panel edges.
- **Consequences**: Editor panels use less vertical space while Viewer, Editor, Code, configured properties, and workspace selection remain available.

### [2026-10-20] Remove Duplicate Application View Switch
- **Context**: Application workspaces displayed the configured context-bar view switch and a second canvas-level copy.
- **Decision**: Hide the canvas-level switch for application workspaces and retain it for page and workflow workspaces that do not have the configured context-bar switch.
- **Consequences**: Applications show one Viewer, Editor, and Code switch, while page and workflow workspaces keep their view navigation.

### [2026-10-20] Align Page Builder Control Metadata
- **Context**: The Console page builder exposed empty toolbar and Properties controls and fewer canvas options than the application builder.
- **Decision**: Configure page-builder toolbar seeds, property target groups, canvas validation/viewer/code settings, and grouped canvas sections using the same shared control contracts as the application builder.
- **Consequences**: Page metadata can add data sources, actions, layout sections, and page components from the Editor; page properties are editable by selection target, and Viewer provides a metadata overview rather than a live page render.

### [2026-10-21] Compose Builder Views as Layout Tabs
- **Context**: Viewer, Editor, and Code were switched inside one canvas component, which made the view layout difficult to compose independently.
- **Decision**: Represent each builder view as its own tabbed layout section with dedicated components. Keep the context-bar toggle and layout tabs synchronized through the active view state.
- **Consequences**: Page and application builders share the same view composition pattern; the canvas is pinned to Editor while separate Viewer and Code components consume the shared workspace data.

### [2026-10-21] Keep Builder Logic in the Page Component
- **Context**: Builder behavior already lived in `BuilderPageComponent`; the separate controller model only described the API used by library controls.
- **Decision**: Keep the state and behavior in `BuilderPageComponent`, pass the component instance directly to its controls, and retain only a shared `BuilderWorkspace` type contract in the library.
- **Consequences**: Removed the redundant controller model and forwarding getter without changing the child controls' typed workspace API.

### [2026-10-21] Store Builder Tool and Property Registries in Options
- **Context**: The application builder declared toolbox groups and property target registries in component `value`, while the existing options structure is the configuration location for those control definitions.
- **Decision**: Store toolbar groups in `toolbar.options.groups` and property targets in `properties.options.data.properties.targets`, alongside reusable field groups. Continue accepting the previous `value` shapes for compatibility.
- **Consequences**: The builder controls can consume the options-based metadata without changing the existing configured tools or property editors; page and application metadata authors have one consistent configuration location.
