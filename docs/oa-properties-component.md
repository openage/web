# Properties component

`<oa-properties>` renders an editor for the supplied data object. Its implementation is in [properties.component.ts](../src/lib/oa/ux/properties/properties.component.ts) and [properties.component.html](../src/lib/oa/ux/properties/properties.component.html).

## Inputs

- `builder` (required): the shared builder controller, used for toolbox/property panel collapse state and workspace actions.
- `data`: the workspace or selected item to edit.
- `type`: selected node target used to choose its field definitions.
- `value`: optional target registry. Each entry has a `target` and direct `properties`, reusable `groups`, or both. The exact target is preferred, then `section` or `item` for selections, then `default`.
- `options`: optional configuration. `collapsible` enables or disables the panel collapse control. `schema` maps target names to field arrays or `{ groups: [...] }` references. Define reusable property groups in `data.properties` as named arrays or `{ title, properties }` objects. Fields support dotted or indexed `key` paths, `label`, `type`, `group`, `options`, `lookup`, `required`, `minLength`, and `description`. `lookups` supplies option arrays, and lookup descriptors can refer to a key through `options.data.config.lookup`. `validationSchema` and `validationErrors` provide schema-derived required/minimum-length affordances and field errors. `title`, `eyebrow`, `footer`, and `class` configure the panel.

## Output

- `dataChange`: emits the edited data object after a field edit. The caller owns persistence and validation; full workspace JSON editing is available in the builder's Code view.

Field types are `text`, `number`, `boolean`, `select`, `json`, `html`, `style`, and `lookup`. Nested object/array paths are read and written without replacing unrelated data.

When embedded by the builder page, the selection path is used to resolve the selected object’s properties. With no selection, workspace/default properties are shown. The header collapse control toggles shared panel state; the panel is visible only in Editor.
