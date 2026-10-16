# List component

The `list` control renders row data with the shared `oa-list` component. Set `options.view` to `table` (the default) for configured fields, or `template` to render a full list template. In page metadata, provide the data in `value` and the fields, template, and behavior in `options`.

The implementation is [src/lib/oa/ux/list/list.component.ts](../src/lib/oa/ux/list/list.component.ts), with dynamic page rendering wired in [src/lib/oa/core/components/layout/layout.component.html](../src/lib/oa/core/components/layout/layout.component.html). The old `table` control name and `oa-table` selector remain as compatibility aliases.

## Minimal configuration

```json
{
  "code": "applications",
  "control": "list",
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

Table view requires at least one non-action field. Each field describes a displayed property: `key` is the row property, `label` is its column heading, and `control` can be `html` to render HTML or `input` to render an editable text input. Omit `control` for a simple displayed value. An optional `action` field configures row actions. Template view does not require fields. The `list` control expects an array of row objects; a single object is wrapped as one row by the component, but an array is recommended. A value object with an `items` array is also unwrapped to its `items`.

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

`options.view` supports `table` and `template`. Table is the default; it renders the configured field columns and optional actions. A field with `control: "input"` renders a text input and writes changes back to the row. A field with `control: "html"` renders its `text` value or row value as sanitized HTML. Fields without a control render their row value as sanitized HTML.

### Template view

Set `options.view` to `"template"` and `options.template.code` to the shared code for a required Handlebars HTML template and loading skeleton. The assets service loads `assets/templates/<code>.html` and `assets/templates/<code>.skeleton.html`. The template receives the transformed row array; use `{{#each this}}` to render each row. The skeleton is shown until both assets and the row data are ready.

```json
{
  "control": "list",
  "value": "applications",
  "options": {
    "view": "template",
    "template": { "code": "application-grid" }
  }
}
```

`application-grid.html`:

```html
<div class="application-grid">
  {{#each this}}
  <article>
    <a href="/console/applications/{{code}}">{{name}}</a>
    <code>{{code}}</code>
  </article>
  {{/each}}
</div>
```

`application-grid.skeleton.html` contains the loading markup shown for that template. A missing or empty template or skeleton is reported and displayed as an error; the component does not silently switch to table view. Angular sanitizes both template and skeleton HTML: directives and event bindings are not compiled, and inline styles are removed. Put template-specific styling in the application's stylesheet or theme, and use normal HTML links for navigation.

### HTML template and loading skeleton

When `value` is a subscribable page object, the list waits for its change notification, then renders that object's updated `items`.

```json
{
  "control": "list",
  "value": "applications",
  "options": {
    "view": "template",
    "template": { "code": "applications" }
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

The skeleton markup is inserted as-is and is not processed by Handlebars. The component's Angular `TemplateRef` inputs remain available to direct Angular callers, but the dynamic page renderer only passes `value` and `options`.

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

Set the component entry's `class` and `style` for host-level styling. The list also reads header and value styling from `options.style`:

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
- Empty list values are shown with the layout's “No data available” message.
- Template mode replaces the complete table; its rendered markup does not use the built-in Angular row action column or per-field formatting.
- Template markup is plain HTML; Angular components, directives, and event bindings inside the asset are not compiled.

## Related documentation

- [Page-meta component guide](./page-meta-components.md) lists the control in the supported page metadata schema.
- [Transforms](./transforms.md) documents row transformations.
