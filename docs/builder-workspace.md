# Builder workspace

The metadata-driven workspace is hosted by [BuilderPageComponent](./builder-page-component.md), which extends the dynamic-page lifecycle and supplies a shared [BuilderController](../src/lib/oa/ux/builder/builder-controller.model.ts) to its toolbox, canvas, and properties controls. The page-builder component is the controller for those sibling components; they do not share direct component state. The page component and metadata types are under `src/app/page-builder/`; reusable builder contracts and controls are under `src/lib/oa/ux/`.

## Routes and metadata sources

The main builder route is `/:area/:collection/:code/builder`. The page builder is also available at `/canvas/pages/:code/builder`; `/canvas/applications/:code/builder` redirects to the Console application-builder route. Route guards and `RouteDataResolver` continue to enforce the normal page access and metadata lifecycle.

The page derives workspace metadata from the active page's `meta.builder`, route `data.builderMetadata`, or route `data.builderMetadataUrl`. Component metadata can provide additional configuration: declarative toolbar entries through `toolbar.value` (or legacy typed groups through `toolbar.options.groups`), editable target fields through `properties.value` (or legacy schema fields through `properties.options.schema`), and validation through the selected canvas control's `options.schema`. Canvas schema is the validation source when provided; otherwise the normalized builder metadata supplies the fallback.

The canonical metadata interfaces are in [builder-metadata.model.ts](../src/lib/oa/ux/builder/builder-metadata.model.ts), re-exported by [the page-builder model](../src/app/page-builder/builder-metadata.model.ts). Core properties include:

| Property | Purpose |
| --- | --- |
| `workspaceType` | Selects the page, application, or workflow workspace behavior. |
| `itemCollectionPath` / `itemLabel` | Identifies the primary editable collection and its label. |
| `auxiliaryCollections` | Declares other editable arrays, such as page data and actions or application services. |
| `actions` | Declares the Viewer, Editor, and Code views. Legacy view codes are normalized to these modes. |
| `toolbox.groups` | Supplies legacy typed toolbox groups when the toolbar control does not define its own `options.groups`. |
| `propertySchemas` | Defines property fields when the properties control does not define `options.schema`. |
| `validationSchema` | Supplies a JSON Schema subset when the canvas does not define `options.schema`. |
| `defaultData` | Provides initial workspace data when no saved draft or loaded document is available. |
| `canvasSections` | Declares editable workspace collection paths when not defined on the canvas control. |

## Workspace shapes

- Page workspaces edit nested `meta.layout.sections`, including child `sections` and `components`. Page data sources and actions are auxiliary collections.
- Application workspaces use `navs` for their primary collection and may edit auxiliary `services`, shell metadata, styles, and layout sections.
- Workflow workspaces use the configured primary item path, commonly `nodes`, with auxiliary collections such as `connections` and `triggers` when declared.

Use the current Console navigation metadata and the example in the [builder page guide](./builder-page-component.md) as references. Avoid copying older examples that use the former registry-driven metadata shape.

## Editing and saving

- The toolbox supports configured item insertion, filtering, and drag/drop.
- Viewer renders the configured template from the shared workspace object, Editor displays configured collection paths, and Code edits that same object. The toolbox and Properties panel appear only in Editor.
- The canvas supports nested sections and components, selection, drag/drop, and validation according to its options. Workflow workspaces use the same canvas and controller contract.
- The properties panel edits fields declared for the active target and emits changes to the builder controller.
- The controller clones workspace and seed data before edits, validates changes against the supported JSON Schema subset, and tracks dirty state. The subset includes `type`, `required`, `properties`, `items`, `enum`, `const`, local `$ref`, `oneOf`, `minLength`, `minItems`, `minimum`, and `maximum`; see the [validation service guide](./validation-service.md).
- Save stores a local draft through the configured cache; it does not publish workspace changes to a server.

Builder controls are documented individually in the [canvas](./oa-canvas-component.md), [toolbox](./oa-toolbar-component.md), [properties](./oa-properties-component.md), and [workflow canvas](./oa-workflow-canvas-component.md) guides. The route-level composition and metadata adaptation are covered in the [builder page guide](./builder-page-component.md).
