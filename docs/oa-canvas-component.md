# OA canvas component

`<oa-canvas>` is the shared builder canvas for page, application, and workflow workspaces. The builder registers it for `oa-page-canvas`, `application-canvas`, and `oa-workflow-canvas`. Its implementation and view are [canvas.component.ts](../src/lib/oa/ux/canvas/canvas.component.ts) and [canvas.component.html](../src/lib/oa/ux/canvas/canvas.component.html).

## Inputs

- `builder` (required): the shared builder controller. Its `workspaceType` determines whether this canvas loads and renders a page, application, or workflow workspace.
- `value`: the root document identifier, such as `"application"` for an application document.
- `options`: optional metadata object. `schema` configures workspace validation; `viewer.template.code` selects the Viewer template; `sections` declares editable workspace paths; and `code.editorOptions` is passed to the JSON editor. `title`, `icon`, `ariaLabel`, and `class` customize the canvas presentation.

## Behavior

The canvas owns workspace loading for pages, applications, and workflows. Page workspaces load the active application navigation entry and full metadata when available; application workspaces load from the system applications collection; workflow workspaces restore their local draft or configured default. All modes render from the builder's shared workspace JSON object.

Viewer renders the configured HTML template with the shared workspace object. Editor renders each configured section path as a collection or selectable object. Nested sections and components remain editable, and valid collection targets are highlighted while dragging a tool. Code uses the JSON editor and applies valid edits to the same workspace object.

The view switch presents Viewer, Editor, and Code. Application workspaces use the configured context-bar switch; page and workflow workspaces use the canvas switch. Legacy summary, visual, structure, and raw action codes are normalized to these modes. The builder page hides toolbox and Properties panels outside Editor.

The validation schema belongs in the canvas control's `options.schema`. The builder controller validates the workspace and exposes path-specific errors for the canvas to display. Canvas selection stores an object path in the shared builder controller so toolbox filtering and Properties edits address the same workspace data.
