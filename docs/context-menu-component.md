# Context menu component

`<oa-context-menu>` renders the current page title or breadcrumb trail and action buttons in the shared context bar. Its source and template are [context-menu.component.ts](../src/lib/oa/core/components/context-menu/context-menu.component.ts) and [context-menu.component.html](../src/lib/oa/core/components/context-menu/context-menu.component.html).

The component observes `ContextService.actions()` and `ContextService.breadcrumbs()`. Breadcrumb links are rendered in order with the last item marked as the current page; when breadcrumbs exist they replace the standalone page title. The builder page sets application/page breadcrumb trails for its context bar. Actions render with `<oa-action>`. Action identity is tracked by `code`, so controls are recreated when an action is added, removed, or replaced rather than reusing stale button labels or state. Pages can replace the context actions while active and restore prior actions when they are destroyed.
