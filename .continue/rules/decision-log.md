# Decision Log

This log records key architectural decisions and significant code changes. AI agents must consult this log before making changes and append new entries after completing a task.

## Format

### [YYYY-MM-DD] Brief Title
- **Context**: Why was this decision made?
- **Decision**: What was decided?
- **Consequences**: What are the implications?

---

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
