# OA workflow canvas component

`<oa-workflow-canvas>` is a compatibility control name for workflow metadata. The builder registers it to the shared canvas component; its older standalone rendering remains available to existing callers in [workflow-canvas.component.ts](../src/lib/oa/ux/workflow-canvas/workflow-canvas.component.ts) and [workflow-canvas.component.html](../src/lib/oa/ux/workflow-canvas/workflow-canvas.component.html).

## Inputs

- `builder` (required): the shared builder controller.
- `options`: optional metadata object. `schema` configures workspace validation; `title`, `eyebrow`, `icon`, `ariaLabel`, `saveLabel`, and `class` customize the canvas presentation.

The validation schema belongs in the canvas control's navigation metadata `options.schema`. Toolbox and property schemas belong in the `toolbar` and `properties` controls' options. Common workflow workspace metadata is supplied through the hosting dynamic page's `meta.builder` object, typically with `nodes` as the primary collection and `connections` and `triggers` as auxiliary collections.

The shared canvas restores a local workflow draft when available, otherwise starts with configured default data, and ensures the primary and auxiliary item collections exist. Workflow workspaces use the same Viewer, Editor, and Code modes and shared workspace object as page and application builders.
