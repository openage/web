# OA layout component

`<oa-layout>` renders a configured layout tree of sections and controls. Its implementation is [layout.component.ts](../src/lib/oa/core/components/layout/layout.component.ts); the builder uses it to render metadata-defined application canvas sections.

## Inputs

- `layout`: layout/section tree to render.
- `components`: additional components assigned to matching sections.
- `data`: data supplied to layout controls.
- `params`, `filters`, `templates`, `columnTemplate`, `entity`, `view`, and `filterView`: optional values used by layout controls and views.
- `selectable`: defaults to `false`. When enabled, clicking a rendered component sets `ContextService.selectedComponent` and emits `componentSelected`.
- A section with `type: "floatable"` renders as a floating panel with its configured section title on the left and a drag handle icon on the right. Drag the handle to reposition it; position is local UI state and is not written back to section metadata. The panel stays within the browser viewport and can contain normal section components and nested sections.
- Tabbed sections render accessible tabs with selected-state semantics, keyboard navigation using the arrow, Home, and End keys, visible focus, and associated tab panels.

## Outputs

- `selected`: emits section selection events raised through the layout's section selection handler.
- `componentSelected`: emits the selected component configuration when `selectable` is enabled.

Selectable components receive a `selected` class and a selection outline. Selection is disabled by default to preserve normal page interaction; only builder canvases should enable it when they need inspector/toolbox integration.

When selectable mode is enabled, clicking a configured component stops the click from bubbling to its parent section, stores it in `ContextService.selectedComponent`, and emits `componentSelected`. Section selection continues to use the `selected` output.

Tabbed sections select on click, Enter, or Space. Arrow keys move to the adjacent tab; Home and End select the first and last tabs. Nested tab panels reference their tab through `aria-labelledby`.
