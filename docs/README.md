# OA Pages documentation

This folder contains human-readable architecture, configuration, and component guides for developers and people authoring OA Pages applications. Use the guide that matches the feature you are working on and keep it in sync with the implementation.

## Start here

- [System architecture](./architecture.md): runtime structure, routing, configuration-driven rendering, shared services, and SSR boundaries.
- [Page metadata and controls](./page-meta-components.md): supported controls and the JSON shape used to compose pages.
- [Component configuration guide](./component-configuration-guide.md): configuration examples for common controls.
- [Theme developer guide](./theme-developer-guide.md): shared theme tokens and styling conventions.
- [Data transforms](./transforms.md): transform formats used by data-driven controls.

## Feature guides

- [Dynamic pages](./dynamic-page-component.md)
- [Builder page](./builder-page-component.md)
- [Builder workspace metadata and behavior](./builder-workspace.md)
- [Diagnostics](./diagnostics-component.md)
- [Signup flow](./signup-component.md)
- [Validation service](./validation-service.md)

## Component guides

- [Action](./action-component.md) · [Context menu](./context-menu-component.md) · [Form](./form-component.md) · [Layout](./layout-component.md)
- [List](./list-component.md) · [JSON editor](./json-editor-component.md) · [Toggler](./toggler-component.md)
- [Builder canvas](./oa-canvas-component.md) · [Builder toolbox](./oa-toolbar-component.md) · [Builder properties](./oa-properties-component.md) · [Workflow canvas](./oa-workflow-canvas-component.md)

## Documentation maintenance

At task initialization, read this index and the architecture guide, then open the guide for the feature or component you will change. Verify its claims and source links against the current code before relying on it.

For a user-visible feature, metadata contract, route, service behavior, or component change, update the closest relevant guide in the same change. Create a focused guide when none covers the feature; update this index when adding, renaming, or removing a guide. Document supported behavior, configuration, limitations, and practical usage from verified code. Do not add internal agent workflow notes here; those belong in the repository instructions and memory files.
