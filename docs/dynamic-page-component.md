# Dynamic page component

The dynamic page component resolves navigation metadata through the standard `RouteDataResolver` and renders its configured layout. Its implementation is in [src/app/dynamic-page/dynamic-page.component.ts](../src/app/dynamic-page/dynamic-page.component.ts).

## Builder pages

Builder pages use a dedicated [BuilderPageComponent](../src/app/page-builder/builder-page.component.ts) that extends this dynamic page component. The standard dynamic page template remains the host for route resolution, access checks, context, and navigation; the builder page composes its toolbar, properties, and canvas controls through `oa-layout` templates. See the [builder page guide](./builder-page-component.md) and [workspace guide](./builder-workspace.md) for supported routes and metadata.
