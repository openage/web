# OA toolbox component

`<oa-toolbox>` renders a searchable, grouped set of builder tools. It is a presentation and drag source: it emits the selected or dragged tool, while the owning builder decides where and how to insert it. The implementation and template are [toolbox.component.ts](../src/lib/oa/ux/toolbox/toolbox.component.ts) and [toolbox.component.html](../src/lib/oa/ux/toolbox/toolbox.component.html).

## Configuration

The component reads its groups from `options.groups`. A valid group has a non-empty `code`, a non-empty `title`, and a `tools` array; an optional `icon` is shown beside the group title. Each tool can provide a `title` or `label`, `icon`, `description`, and builder metadata such as `code`, `control`, `target`/`targets`, `value`, and `options`. The toolbox preserves and emits the configured tool object; it does not interpret its target or seed data.

```html
<oa-toolbox
  [options]="{ title: 'Application tools', groups: toolGroups }"
  [value]="selectedGroupCode"
  [connectedTo]="canvasDropListIds"
  [disabled]="!workspaceValid"
  (toolSelected)="addTool($event)"
  (toolDragStart)="beginToolDrag($event)"
  (toolDragEnd)="endToolDrag()">
</oa-toolbox>
```

| Input | Purpose |
| --- | --- |
| `options.groups` | Ordered group definitions, each with `code`, `title`, and `tools`. |
| `options.class` | Additional CSS class for the toolbox panel. |
| `value` | Code of the selected group. That group is highlighted and sorted to the front, and is preferred for initial expansion. |
| `connectedTo` | IDs of compatible CDK drop lists, usually supplied by the builder canvas. |
| `disabled` | Disables toolbox buttons, preventing selection and dragging while disabled. |

## Search and groups

Search matches each tool's `title`, `label`, `code`, and `control`, case-insensitively. It does not search group titles. Empty groups are hidden while searching; if none remain, the toolbox says either “No tools match this search” or “No tools are configured for this section.” At most one group is expanded at a time. The selected group is preferred initially; otherwise the first visible group opens. Searching opens one matching group, and users can switch or collapse it.

The toolbox no longer renders its own title and eyebrow. When used in a floatable layout section, the section title and drag handle provide the panel header. The group list is the toolbox's only scrollable region; search and footer remain in place.

## Dragging and selection

- Clicking a tool emits it through `toolSelected`, which the parent can use for click-to-add.
- Starting a drag emits the tool through `toolDragStart`; ending it emits `toolDragEnd` with no payload.
- CDK drag data includes both the tool and its group code. The toolbox drop list connects to the IDs in `connectedTo` so the canvas can accept the drag.

These outputs do not mutate the workspace. The parent handles target matching, insertion, validation, dirty state, and persistence. In the page builder, the builder coordinator handles those operations and the canvas reports the actual drop target.
