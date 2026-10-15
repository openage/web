# Decision Log

This log records key architectural decisions and significant code changes. AI agents must consult this log before making changes and append new entries after completing a task.

## Format

### [YYYY-MM-DD] Brief Title
- **Context**: Why was this decision made?
- **Decision**: What was decided?
- **Consequences**: What are the implications?

---

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
