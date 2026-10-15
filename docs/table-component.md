# Table component

The `table` control renders row data with the shared `oa-table` component. In page metadata, provide the data in `value` and the columns and behavior in `options`.

The implementation is [src/lib/oa/ux/table-editor/table-editor.component.ts](../src/lib/oa/ux/table-editor/table-editor.component.ts), with dynamic page rendering wired in [src/lib/oa/core/components/layout/layout.component.html](../src/lib/oa/core/components/layout/layout.component.html).

## Minimal configuration

```json
{
  "code": "applications",
  "control": "table",
  "value": [
    { "name": "Website", "code": "www-applegos", "status": "Active" },
    { "name": "Console", "code": "console", "status": "Active" }
  ],
  "options": {
    "fields": [
      { "key": "name", "label": "Name" },
      { "key": "code", "label": "Code" },
      { "key": "status", "label": "Status" }
    ]
  }
}
```

For the built-in table view, `options.fields` is required. Each field describes a column. `key` is the row property to display and `label` is the column heading. A complete custom HTML template can omit `fields`. The `table` control expects an array of row objects; a single object is wrapped as one row by the component, but an array is recommended. A value object with an `items` array is also unwrapped to its `items`.

A string `value` is treated as a key in `ContextService` data. Use this form only when that key resolves to the row data.

## Data and column fields

Each field can use these relevant properties:

| Property | Purpose |
| --- | --- |
| `key` | Row property path. Supports dotted paths such as `contact.email` and numeric array segments such as `items[0].name`. |
| `label` | Column heading. |
| `isHidden` | Omits the field from the header and rows. |
| `format` | Format passed to the app content transform service before displaying the value. |
| `value.default` | Value used when the row property is `null` or `undefined`. |
| `class`, `style` | Column/header styling; see [Styling](#styling). |
| `config.click` | The component recognizes `toggle: "details"` to toggle the row's selected/expanded state. The current cell template binds this handler using `(onClick)` rather than the native `(click)` event; validate the interaction in the target browser before relying on it. |

For example, nested properties and a fallback can be configured like this:

```json
{
  "key": "contact.email",
  "label": "Email",
  "value": { "default": "Not provided" }
}
```

Fields whose key is `index` display the one-based row number. Fields whose key is `action` create an action column, which is placed after the other fields.

## Supported options

### Row transforms

`options.transforms` is passed to `TransformService` before the resulting row data is displayed. Use the existing transform formats documented in [transforms.md](./transforms.md).

```json
{
  "options": {
    "fields": [
      { "key": "name", "label": "Name" },
      { "key": "total", "label": "Total" }
    ],
    "transforms": [
      {
        "type": "map",
        "config": {
          "name": "{{name}}",
          "total": "{{amount}}"
        }
      }
    ]
  }
}
```

### View

The default view is `table`. `options.view: "week"` adds seven date columns, starting from `options.week.start` when supplied (the start value is injected against the row data); otherwise it starts from the current week. Include the `options.week` object when using this view. The generated column keys use `YYYY-MM-DD`, so the row data should contain values under matching date keys.

```json
{
  "options": {
    "view": "week",
    "week": { "start": "2026-10-12" },
    "fields": [
      { "key": "name", "label": "Name" }
    ]
  }
}
```

### HTML template and loading skeleton

Set `options.template.code` to load a Handlebars HTML template through the configured assets service. The table passes its transformed row array to `ContentService.inject`, so iterate the root value with `{{#each this}}`. Template files are resolved as `assets/templates/<code>.html`. When `value` is a subscribable page object, the table waits for its change notification, then renders that object's updated `items`.

```json
{
  "control": "table",
  "value": "applications",
  "options": {
    "template": { "code": "applications" },
    "fields": [
      { "key": "name", "label": "Name" },
      { "key": "code", "label": "Code" }
    ]
  }
}
```

Example `applications.html`:

```html
<div class="applications-list">
  {{#each this}}
  <a href="/console/applications/{{code}}">{{name}} <code>{{code}}</code></a>
  {{/each}}
</div>
```

If `assets/templates/<code>.skeleton.html` exists, its HTML is shown while the template and a context-key `value` are loading. Skeleton markup is inserted as-is and is not processed by Handlebars. If no skeleton exists, the table exposes an empty loading status until content is ready. If the main template fails to load or render, the error is logged and the regular configured table is used as a fallback.

A configured HTML template replaces the built-in table markup. The rendered HTML is sanitized by Angular and does not compile Angular directives or event bindings; use normal HTML links for navigation. The component's Angular `TemplateRef` inputs remain available to direct Angular callers, but the dynamic page renderer only passes `value` and `options`.

### Row action column

Add an `action` field with `config.actions` to render the built-in row actions. Action entries can be action-code strings or action objects. The supported built-in codes are `select`, `edit`, `save`, `cancel`, and `remove`.

```json
{
  "options": {
    "fields": [
      { "key": "name", "label": "Name" },
      {
        "key": "action",
        "label": "Actions",
        "config": {
          "actions": [
            { "code": "select", "title": "Open", "icon": "chevron_right" },
            { "code": "edit", "title": "Edit", "icon": "edit" },
            { "code": "remove", "title": "Remove", "icon": "delete" }
          ]
        }
      }
    ]
  }
}
```

Action objects can also specify properties such as `type`, `style`, `class`, and `permissions`. The default action type is `icon`; the default style is `subtle` for icon actions and `default` for other types. Actions whose `permissions` are not available in the current context are filtered out.

`select` marks the row selected and emits the component's selection event. It opens the `options.entity` destination when configured; with `options.type: "detail"` it enters edit mode; otherwise it navigates to a URL formed from the current URL and the row's `code`. The dynamic page renderer does not forward the selection event, so JSON metadata should not rely on a page-level callback.

## Styling

Set the component entry's `class` and `style` for host-level styling. The table also reads header and value styling from `options.style`:

```json
{
  "class": "application-table",
  "style": { "width": "100%" },
  "options": {
    "style": {
      "header": {
        "class": "application-table-header",
        "style": { "background-color": "#f4f7fb" }
      },
      "value": {
        "class": "application-table-cell",
        "style": { "color": "var(--text)" }
      }
    },
    "fields": [
      {
        "key": "status",
        "label": "Status",
        "style": {
          "value": {
            "class": [
              { "operator": "===", "value": "Active", "class": "status-active" }
            ],
            "style": [
              {
                "operator": "===",
                "value": "Active",
                "style": { "font-weight": "600" }
              }
            ]
          }
        }
      }
    ]
  }
}
```

- `options.style.header.class` and `options.style.header.style` customize the header row.
- `options.style.value.class` and `options.style.value.style` provide default value-cell styling.
- A field's `style.value.class` can be a class string or an array of conditions. Conditional entries support `>`, `>=`, `<`, `<=`, `===`, `==`, `=`, `!==`, and `!=`; they can compare the field value to `value`, or compare row properties using `key1` and `key2`.
- A field's `style.value.style` or `style.value.styles` can be a style object or an array of conditional `{ "operator", "value", "style" }` entries.
- `field.class` and `field.style` are applied to the header; the special `index` and `action` cells also use those field-level values. Use `field.style.value` for normal data-cell styling.

The built-in table styles use theme variables such as `--surface-light`, `--border`, `--background`, and `--text-secondary`. Prefer the active theme's variables for consistent appearance across applications.

## Current boundaries

- The table does not provide built-in sorting, filtering, or pagination. Use the separate pagination control where needed and wire it to the page data.
- Empty table values are shown with the layout's “No data available” message.
- `options.template.code` replaces the complete table view; it does not render the built-in Angular row action column or per-column formatting.
- The `form` value is accepted by the component's view input, but dynamic table markup still renders its row layout; use `table` or the supported `week` option for page metadata.

## Related documentation

- [Page-meta component guide](./page-meta-components.md) lists the control in the supported page metadata schema.
- [Transforms](./transforms.md) documents row transformations.
