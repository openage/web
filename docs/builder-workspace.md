# Builder control data flow

Builder page composition uses one configured `canvas`, one `toolbar`, and one `properties` control. Their inputs and outputs are connected by [BuilderPageComponent](../src/app/page-builder/builder-page.component.ts); the controls do not receive a shared builder/workspace object.

## Data and selection

The canvas resolves its configured `value` from `ContextService.data` and renders its configured `options.sections`. Clicking a section heading emits its complete section value, including arrays, with the property target code, canvas section code, path, and index. Selecting an object emits that object with its item path and index. The page coordinator passes object selections to Properties and uses section/group codes to drive Toolbox selection; array-valued section selections are not treated as editable objects.

Properties receives the selected object as `value`, chooses its form fields from `options.types` using the selection code as `type`, and emits edited values. The coordinator applies an edit to the selected path, updates the context-data entry, validates, and marks the document dirty. After a toolbox tool is dropped and inserted successfully, the coordinator selects the new item. The builder renders this configured editing layout directly; it has no view tabs or Code editor. The coordinator also handles click-to-add, item reorder and actions, Save, and Validate.

Toolbox groups live in `options.groups` as `{ code, title, tools }`. The selected group code is passed through the Toolbox `value` input; Toolbox moves that group to the top and expands it. Search filters tool names across groups. Selecting or starting to drag a tool emits only the tool object; the page resolves its group from the configuration for Canvas target highlighting. Dropping a tool emits its exact target path so the page can clone and insert the configured seed at the appropriate collection or metadata path.

## Configuration contract

- Canvas `options.sections` entries require `code` and `path`; use `target` to choose the Properties target and `targets` to declare compatible toolbox insertions. `group` maps a canvas selection to a toolbox group code.
- Toolbox `options.groups` entries contain `code`, `title`, and `tools`, with optional `icon`. Tools use `target` for a single target or `targets` for multiple targets. Component factories commonly use `targets: ["components"]` and `control`.
- Properties `options.types` maps selection codes to arrays of field/control definitions.
- `options.schema` on Canvas remains the workspace validation schema; the page coordinator validates before save or insertion.

See [the builder page guide](./builder-page-component.md), [canvas guide](./oa-canvas-component.md), [toolbox guide](./oa-toolbar-component.md), and [Properties guide](./oa-properties-component.md) for their respective contracts.
