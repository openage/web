# OA canvas component




`<oa-canvas>` renders configured workspace data as selectable canvas sections. Array sections show object items as draggable cards, object sections show one selectable object, and configured child collections are displayed beneath their parent item. It reports selections and drag/action requests to its parent; it does not mutate the workspace or persist changes. The implementation and template are [canvas.component.ts](../src/lib/oa/ux/canvas/canvas.component.ts) and [canvas.component.html](../src/lib/oa/ux/canvas/canvas.component.html).

## Inputs

| Input | Purpose |
| --- | --- |
| `value` | Workspace object, or a string key in `ContextService.data`. Dotted paths after the key select a nested value, such as `application.meta`. |
| `options` | Canvas presentation and ordered section definitions. |
| `selection` | Current selection from the parent builder. The canvas uses its path to highlight the selected node. |
| `activeTool` | Current drag payload, `{ groupCode, tool }`, from the toolbox. Used to highlight compatible drop targets. |
| `toolboxDropListIds` | IDs for drop lists connected to the toolbox. |
| `validationErrors` | Errors with `path` and `message`, rendered below the sections. |
| `loadError` | Builder status or load message shown above the sections. |

`options.title`, `options.icon`, `options.ariaLabel`, and `options.class` customize the heading, accessible region label, and CSS class. Defaults are “Workspace”, the `dashboard` icon, and “Workspace canvas”.

## Section configuration

`options.sections` is an ordered array. Each entry needs a `code` and `path`; `title`, `target`, `targets`, `group`, `optional`, `itemType`, and `itemAction` are optional. `itemType` supplies the card subtitle when the data item has no `control` or `type`.

```json
{
  "title": "Application",
  "sections": [
    { "code": "application", "title": "Application", "path": "", "target": "workspace" },
    {
      "code": "pages",
      "title": "Pages",
      "path": "navs",
      "targets": ["navs"],
      "group": "content",
      "itemType": "Page",
      "itemAction": {
        "label": "Edit page",
        "url": "/console/pages/{code}/builder"
      }
    },
    { "code": "services", "title": "Services", "path": "services", "optional": true }
  ]
}
```

Paths are resolved from the workspace object and support dotted or bracketed array paths. An empty path addresses the workspace root. If `sections` is not an array, the canvas falls back to one `workspace` section for the root object; an explicitly empty array produces the “No canvas sections are configured” message. An `optional` section is hidden until its path resolves, but is shown temporarily when the actively dragged tool can create or populate it. A visible section whose path has no value displays “This section is not configured yet.”

Array sections are intended for arrays of objects. They display object items in order, with the item's title, label, name, or code as its label. Object-valued sections display one selectable object card. For array items, child arrays named `sections`, `components`, or `items` are shown beneath the parent. The `itemAction` link, when configured, is shown for array items with a non-empty `code`; `{code}` in the URL is replaced with the URL-encoded item code.

## Selection and outputs

| Output | Payload and use |
| --- | --- |
| `sectionSelected` | `CanvasSelection`: `code`, `sectionCode`, optional `groupCode`, the selected `value`, workspace `path`, and item `index`. Clicking a section heading emits its complete value (including arrays); heading selections use index `-1`. Clicking an item emits that object and its item index. |
| `toolDropped` | `CanvasToolDrop`: `sectionCode`, exact `targetPath`, and the toolbox tool. The parent can insert a configured item at that path. |
| `itemDropped` | `CanvasItemDrop`: CDK drag/drop event and destination `targetPath`, used by the parent to reorder items. |
| `itemAction` | `CanvasItemAction`: `move-up`, `move-down`, `duplicate`, or `delete`, plus the affected selection. |

Clicking any section heading emits `sectionSelected` with that section's actual value, even when it is an array or is not yet configured. Object-valued section headings emit the object; array-valued headings emit the complete array. Clicking a list item emits that item object. Clicking a configured item link navigates to its URL and does not select the card. Selecting a list item also reveals move, duplicate, and delete buttons; each action emits the selection and requested action so the parent can update the workspace.

## Toolbox compatibility and drag/drop

The section's accepted tool targets are `targets`, then `target`, then its `code` if neither is configured. A toolbox tool uses its `targets`, or `target`; a `target: "meta"` tool resolves to `meta.<tool code>`. Compatible sections are highlighted while dragging. A missing metadata path can be dropped on its matching optional section, or on the workspace root when no section matches; metadata paths that already exist are not advertised as drop targets. A drop on an incompatible target is ignored.

The main array list accepts toolbox tools and existing items. Object-valued sections also accept compatible toolbox drops, allowing tools to create metadata paths or populate nested collection targets. Nested `components` collections, including empty ones, can accept toolbox tools and item drops; nested `sections` and `items` are displayed as child collections but their drop lists are disabled. The canvas identifies the exact destination in `targetPath` so the parent can apply the operation. After a successful toolbox drop, the builder selects the inserted item.

Array-valued section selections are emitted with their full array value. The builder uses these selections to identify the active section and toolbox group; because Properties edits objects, it does not treat the array as an editable object.

## Validation and ownership

The canvas displays `loadError` and each supplied validation error; it does not run schema validation itself. It also does not own the selected workspace, insertion rules, mutation, dirty state, save, or persistence. The builder page wires the outputs to its workspace coordinator, which applies edits and validation. See the [toolbox guide](./oa-toolbar-component.md) and [properties guide](./oa-properties-component.md) for the connected controls.
