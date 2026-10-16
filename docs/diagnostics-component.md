# Debug component

This guide documents the runtime diagnostics page rendered by [src/app/diagnostics/diagnostics.component.ts](../src/app/diagnostics/diagnostics.component.ts) and its template [src/app/diagnostics/diagnostics.component.html](../src/app/diagnostics/diagnostics.component.html).

## Purpose

The debug page surfaces the browser's currently loaded runtime context for application, tenant, organization, user, session, and role data. It is designed to mirror the visual language used by the diagnostics page and make large JSON payloads easier to inspect without leaving the app.

## Layout

The page is a two-column card grid with one full-width card for the larger payloads:

- Application
- Tenant
- Organization
- User (split into Profile, Session, and Role panes)

Each section is a `<details>` accordion so it can be collapsed while preserving the underlying data and keeping the page compact.

## Configuration

The component reads values from `ContextService` and renders them through `oa-json-viewer` with a shared viewer configuration:

```ts
options = {
  limit: 50,
  sort: { key: true },
  skip: {
    empty: true,
    fields: [
      'parent',
      'timeStamp',
      'createdAt',
      'isEditing',
      'isSelected',
      'isProcessing',
      'isDeleted',
      'isValid'
    ]
  }
};
```

Use this configuration when adding new context payloads so the debug view stays readable and consistent with the rest of the app.

## Behavior

- The page opens each section by default to show the current runtime data immediately.
- Double-clicking a section header expands the accordion when the user wants to force the card open.
- The JSON viewer sorts keys alphabetically and strips empty fields to keep the output focused.
- On smaller screens, the grid collapses to a single stacked column.

## Styling

The card layout and spacing intentionally follow the diagnostics page conventions, including:

- consistent section spacing and header hierarchy
- border and shadow treatment for cards
- compact summary metadata with a chevron affordance
- responsive grid behavior for display-sized pages

The styling is defined in [src/app/diagnostics/diagnostics.component.scss](../src/app/diagnostics/diagnostics.component.scss).
