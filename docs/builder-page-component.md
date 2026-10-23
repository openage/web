# Builder page component

`BuilderPageComponent` extends the dynamic-page lifecycle and coordinates the single Canvas, Toolbox, and Properties controls. Its implementation and template are [builder-page.component.ts](../src/app/page-builder/builder-page.component.ts) and [builder-page.component.html](../src/app/page-builder/builder-page.component.html).

## Routes and metadata

The builder routes include `/console/applications/:code/builder`, `/console/pages/:code/builder`, and the generic `/:area/:collection/:code/builder` route. The legacy application URL under `/canvas/applications/` redirects to the Console route. Builder metadata is read from the active page, route data, or a configured metadata URL.

The current Console configurations are [applications.builder.json](../../../solutions/applegos/data/system/navs/console/applications.builder.json) and [pages.builder.json](../../../solutions/applegos/data/system/navs/console/pages.builder.json). They declare one `canvas` control with its context-data `value` and editable `options.sections`, a `toolbar` with `options.groups`, and a `properties` control with `options.types`.

```json
{
  "control": "canvas",
  "value": "page",
  "options": {
    "sections": [
      {
        "code": "layout",
        "path": "meta.layout.sections",
        "target": "section",
        "targets": ["sections", "components"],
        "group": "page-structure",
        "title": "Layout sections"
      }
    ]
  }
}
```

Canvas `target` selects the Properties definition; `targets` declares compatible toolbox insertions; `group` connects the selection to a toolbox group code. Tool targets and property target names must agree with the JSON metadata.

The builder displays Toolbox, Canvas, and Properties in a three-column layout on wider screens and stacks them vertically on narrow screens.

## Coordination flow

1. The page initializes its workspace from the configured key in `ContextService.data`, using metadata defaults when no document is available. Workspace edits are synchronized back to that context-data key.
2. Canvas emits `{ code, sectionCode, value, path, index }` when a section heading or object is selected. A section heading emits its complete value, including arrays; object selections are passed to Properties, while array-valued section selections identify the active canvas section and toolbox group and show an empty `collection` property schema rather than an unrelated item form.
3. Properties emits an immutable edited object. The page writes it at the selected path, validates the workspace, and updates dirty state.
4. Toolbox emits the tool object on drag start; the page resolves its group code from the configured tools and passes both to Canvas for compatible-target highlighting. Canvas accepts drops on array sections and object sections, temporarily exposing optional sections when the active tool can populate them, and highlights empty nested `components` collections. A missing metadata path can be dropped on its matching section or the workspace root. The page creates missing configured `sections`/`components` collections when needed, inserts the tool, and selects the inserted item. Click-to-add, item reorder, duplicate, delete, validation, and persistence are coordinated by the page.

Canvas, Toolbox, and Properties are standalone controls coordinated by the builder route. The route remains responsible for Save, Validate, Cancel, page persistence, and local application drafts.

For page workspaces, the builder also provides an Edit/Preview switch. Preview renders the current `meta.layout` and `meta.components` through the normal OA layout renderer, so supported OA controls use the same rendering path as a dynamic page. Desktop, tablet, and mobile frame widths are available to inspect how content fits; these are not isolated browser viewports, so page CSS media queries still follow the app window width. Preview is read-only; use Canvas and Properties to make changes. Pages that depend on separately loaded domain data, route parameters, or permissions may differ from their fully navigated runtime page. Prompt-based AI generation and edits are not configured yet.

The page registers the configured control names `canvas`, `toolbar`/`toolbox`, and `properties`; there are no page/application/workflow canvas aliases. See [Builder control data flow](./builder-workspace.md) and the individual [canvas](./oa-canvas-component.md), [toolbox](./oa-toolbar-component.md), and [Properties](./oa-properties-component.md) guides for supported options and events.
