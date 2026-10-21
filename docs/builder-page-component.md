# Builder page component

The builder page extends [dynamic-page.component.ts](../src/app/dynamic-page/dynamic-page.component.ts) and reuses its resolver, permissions, context, and navigation lifecycle. Its implementation and view templates are in [builder-page.component.ts](../src/app/page-builder/builder-page.component.ts) and [builder-page.component.html](../src/app/page-builder/builder-page.component.html). The page owns shared controller state; page, application, and workflow canvas components load and normalize their workspace data directly.

## Navigation metadata

The routes `/console/applications/:code/builder`, `/console/pages/:code/builder`, and `/:area/:collection/:code/builder` load the builder page directly. The legacy `/canvas/applications/:code/builder` URL redirects to the Console application-builder route. The direct route is necessary because the dynamic-page route hierarchy does not host a nested router outlet. The application-builder navigation definition's `url` must match `/console/applications/:code/builder` so route resolution selects the builder metadata rather than falling back to the application-details page. A navigation definition may store common workspace metadata in `meta.builder`, or provide it directly in page metadata along with `meta.components`; the page normalizes both formats. Builder view definitions are stored in `meta.builder.actions` or `meta.actions`. Region-specific configuration belongs to the control that consumes it: the toolbar menu is in `toolbar.value`, property target definitions are in `properties.value`, and workspace validation is in the canvas control's `options.schema`. Legacy workspaces may still use `toolbar.options.groups` and `properties.options.schema`.

```json
{
  "meta": {
    "builder": {
      "workspaceType": "application",
      "title": "Application Builder",
      "icon": "apps",
      "itemCollectionPath": "navs",
      "itemLabel": "Navigation items",
      "auxiliaryCollections": [{ "path": "services", "title": "Services" }],
      "actions": [],
      "defaultData": {}
    },
    "layout": {
      "sections": [
        { "code": "toolbar", "class": "builder-region-toolbar" },
        { "code": "canvas", "class": "builder-region-canvas" },
        { "code": "properties", "class": "builder-region-properties" }
      ]
    },
    "components": [
      {
        "section": "toolbar",
        "control": "toolbar",
        "value": [],
        "options": {
          "title": "Application tools",
          "groups": [],
          "collapsible": true
        }
      },
      {
        "section": "canvas",
        "control": "application-canvas",
        "options": {
          "type": "application",
          "icon": "apps",
          "schema": { "type": "object" }
        }
      },
      {
        "section": "properties",
        "control": "properties",
        "value": [],
        "options": {
          "title": "Application properties",
          "schema": {},
          "collapsible": true
        }
      }
    ]
  }
}
```

Registered `oa-layout` templates are `toolbar`, `properties`, `oa-page-canvas`, `application-canvas`, and `oa-workflow-canvas`. The page and application control names both resolve to the shared `<oa-canvas>` implementation; the selected control and metadata determine its workspace type and options. Keep template declarations outside the conditional that renders the layout so they exist during the initial view query and are registered before the layout renders. Canvas and toolbox regions receive the builder page as their shared controller, while the properties region receives its data and emits changes. No workspace service or metadata registry is required.

Each OA control is a standalone library component under `src/lib/oa/ux`. Canvas and toolbox controls receive a `builder` controller input and optional `options` from the page component metadata. Builder metadata adaptation discovers controls declared either at the page level or in the components arrays of layout sections, so workspace type and each control's options come from the actual configured canvas. The properties control receives the active workspace or selection as `data`, plus its target `type`, registry `value`, and `options`, and emits edits through `dataChange`. Toolbar `value` groups are declarative menu data; target seeds are cloned for each insert, and component factories merge their seed data and options into new instances. Properties `value` entries declare exactly which fields are editable for each target. The canvas reads the root document identifier from `value` and validates against the authoritative `options.schema`. Metadata is read from the active dynamic page, route data, or `builderMetadataUrl`. See [the builder workspace guide](./builder-workspace.md) for metadata, validation, and editing behavior.

Builder metadata normalizes the configured actions to three views: Viewer, Editor, and Code. Viewer renders the configured `options.viewer.template` with the workspace JSON object; Editor renders the configured canvas sections and shows the toolbox and properties panel; Code edits that same object with the JSON editor. Legacy action codes such as `summary`, `visual`, `structure`, and `raw` are accepted as aliases and normalized to those three views. Selecting a view synchronizes its canonical code to the URL fragment. Toolbox and Properties collapse controls are shown only while Editor is active.

Canvas sections are configured as `{ code, title, path }` entries in the canvas control's `options.sections` (or `meta.builder.canvasSections`). Array paths render editable item lists; object paths select that object for properties. Drop-list connections are generated from configured collection paths and nested item collections. The application builder uses these sections for pages, services, layout sections, and application settings instead of separate configuration tabs. The selected item path is the shared selection source used by the canvas, toolbox, and Properties panel.

Property targets can define `properties` directly or reference reusable groups by name. Reusable definitions live in the Properties control's `options.data.properties`; `options.schema` targets can also use `{ "groups": ["identity"] }`. When there is no selection, the `workspace` target (or `default` fallback) is shown. Save, Validate, and Cancel actions for application workspaces remain available through the shared context bar. Draft save writes to the local cache; publishing is not configured.

Application-specific editable settings are configured as canvas sections and property groups. The workspace object is loaded from the system applications collection and normalized with missing `meta.layout`, `meta.header`, and `meta.footer` objects. There are no application-only builder tabs; application layout, navigation, services, and settings use the same configured section and property mechanisms as page and workflow workspaces.

The layout uses `builder-region-toolbar`, `builder-region-canvas`, and `builder-region-properties` class hooks. The toolbox and Properties controls are rendered only in Editor; Viewer and Code use the full canvas area. Selecting any canvas object updates the controller's selected path, which is shared with toolbox filtering and property editing. See the [canvas guide](./oa-canvas-component.md) and [toolbox guide](./oa-toolbar-component.md) for control behavior.
