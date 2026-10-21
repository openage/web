# OA toolbox component

`<oa-toolbox>` renders configured builder tools in grouped sections. Its source and template are [toolbox.component.ts](../src/lib/oa/ux/toolbox/toolbox.component.ts) and [toolbox.component.html](../src/lib/oa/ux/toolbox/toolbox.component.html).

## Inputs

- `builder` (required): the shared builder controller for toolbox filtering, drag/drop, and item creation.
- `value`: optional declarative menu model. Each group has `title`, optional `icon`, and `items`; each item may declare `title`, `label`, `icon`, `target`, `targets`, `control`, `value`, and `options`. When present, this model is rendered directly as configured groups and entries.
- `options`: optional metadata object. `groups` defines legacy typed toolbox groups when `value` is absent; if omitted, groups come from active builder metadata. `collapsible` enables or disables the panel collapse control (enabled by default in the builder page). `title`, `eyebrow`, and `class` customize the visible heading and CSS class.
- `connectedTo`: optional IDs of connected CDK drop lists.

For configured menu entries with `target`, `value` is a cloned seed inserted into the configured collection (or assigned to the matching `meta.<code>` property for `target: "meta"`). A component factory uses `targets: ["components"]` and `control`; its value is cloned into the new component and configured options are merged under `options`. Entries without a value create the requested control without a seed. The source metadata is never mutated, and each insertion receives independent data.

Legacy groups use the builder metadata shape: each group has a `code`, `title`, and `items`; each tool has a `code`, `type`, `title`, `icon`, and optional `description`. Groups render as accessible, independently collapsible sections and expand while a search is active. Selection filtering and updates use the selected path in the shared BuilderController. The component supports click-to-add and drag/drop.

When embedded by the builder page, toolbox groups expand when their tools apply to the selected canvas section. A drag records its tool in the shared controller; eligible canvas collection paths are connected drop lists and receive a highlight. Dropping clones the configured seed into the selected path. The panel is visible only in Editor. Its header collapse control toggles shared state; set `options.collapsible` to `false` to remove the control.
