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
