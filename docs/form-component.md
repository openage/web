# Form component metadata

This guide explains how to build metadata for the dynamic `form` control used by the page renderer and the `oa-form` component.

The implementation is in [src/lib/oa/ux/form/form.component.ts](../src/lib/oa/ux/form/form.component.ts) and the runtime model is defined by [src/lib/oa/ux/form/form.options.ts](../src/lib/oa/ux/form/form.options.ts) and [src/lib/oa/core/models/field.model.ts](../src/lib/oa/core/models/field.model.ts).

## Shape

Use the `form` control as a component entry in page metadata:

```json
{
  "control": "form",
  "value": {
    "form": {
      "originName": "Search",
      "destinationName": "Search",
      "sailingDate": ""
    }
  },
  "options": {
    "class": "form-panel",
    "view": "form",
    "sections": [
      {
        "code": "r-1",
        "container": {
          "body": { "class": "flex-row two" }
        }
      },
      {
        "code": "r-3",
        "class": "controls-row right"
      }
    ],
    "fields": [
      {
        "control": "input",
        "group": "r-1",
        "label": "Origin",
        "key": "form.originName"
      },
      {
        "control": "input",
        "group": "r-1",
        "label": "Destination",
        "key": "form.destinationName"
      },
      {
        "control": "date",
        "group": "r-3",
        "label": "Sailing Date",
        "key": "form.sailingDate"
      }
    ],
    "actions": [
      {
        "code": "submit",
        "group": "r-3",
        "title": "Search",
        "class": "primary",
        "config": {
          "target": {
            "service": "send-it",
            "collection": "messages",
            "method": "create"
          }
        }
      },
      {
        "code": "reset",
        "group": "r-3",
        "title": "Reset"
      }
    ]
  }
}
```

## Required conventions

### 1. Put form data in `value`

The form reads the form payload from `value` and resolves field values using each field's `key`.

Example:

```json
"value": {
  "form": {
    "firstName": "Alicia",
    "lastName": "Ng"
  }
}
```

Then this field:

```json
{
  "key": "form.firstName",
  "label": "First name",
  "control": "input"
}
```

is populated from the nested object path `form.firstName`.

A field may also use a default value:

```json
{
  "key": "form.middleName",
  "defaultValue": "",
  "control": "input"
}
```

### 2. Use `options` for structural metadata

The form receives configuration through `options` and normalizes it into a `FormOptions` instance. Supported fields are:

```typescript
{
  class?: string;
  style?: any;
  view?: string;
  sections?: any[];
  fields?: FieldModel[];
  actions?: Action[];
}
```

This is the primary metadata object for the control.

### 3. Group fields into sections with `group`

Use the field `group` to match a section `code`. Existing metadata using `section` remains supported for compatibility; use `group` for new metadata.

```json
"sections": [
  { "code": "r-1" },
  { "code": "r-2" }
],
"fields": [
  { "group": "r-1", "key": "form.originName", "control": "input" },
  { "group": "r-2", "key": "form.sailingDate", "control": "date" }
]
```

This is how layout rows are created in practice.

### 4. Use `actions` with known action codes

The form supports standard action definitions such as:

- `submit`
- `reset`

The action handler is attached internally during initialization. Example:

```json
{
  "code": "submit",
  "group": "r-3",
  "title": "Search",
  "class": "primary",
  "config": {
    "target": {
      "service": "send-it",
      "collection": "messages",
      "method": "create"
    }
  }
}
```

The `config.target` structure is used by the component to execute the submission flow.

## Field metadata

Each field is converted into a `FieldModel`. The relevant metadata the form expects includes:

```typescript
{
  key: string;
  code?: string;
  label?: string;
  description?: string;
  control?: string;
  defaultValue?: any;
  placeholder?: string;
  class?: string;
  style?: any;
  group?: string;
  section?: string;
  required?: any;
  validations?: any[];
  config?: any;
  permissions?: any[];
  readonly?: boolean;
  isHidden?: boolean;
  isSelected?: boolean;
}
```

Important runtime behavior:

- `key` is the source property path in the object
- `code` defaults to `key` if omitted
- `label` falls back to `name` if provided
- `control` determines the UI element used for the field
- `config` stores extra per-field editor options

## Section metadata

A section is a layout container with these common fields:

```json
{
  "code": "r-1",
  "class": "controls-row",
  "style": { "display": "flex" },
  "container": {
    "body": { "class": "flex-row two" }
  },
  "fields": [],
  "actions": []
}
```

Sections are recursively processed. Nested sections are supported via the `sections` array, and the component walks them for their `fields` and `actions`.

## Practical authoring rules

- Keep the form payload object and the field `key` paths aligned.
- Use `options.sections` to arrange content into rows or groups.
- Add `group` values matching the section `code` values.
- Use `options.fields` for form inputs and `options.actions` for submit/reset controls.
- Prefer `value` for actual values, and `options` for structure and rendering config.
- For reusable data, set `value` to a context key reference string if the component is bound to context-managed data.

## Example from the app

The app uses this pattern in the landing page config in [src/assets/app/freightastic/nav/landing/index.json](../src/assets/app/freightastic/nav/landing/index.json).

That metadata creates a search form with grouped rows and a submit/reset action set.

## Summary

To build valid metadata for the form control:

1. Put the payload in `value`.
2. Put structure, rows, fields, and actions under `options`.
3. Match field `key` values to nested object paths.
4. Match field `group` values to section `code` values.
5. Use supported action codes like `submit` and `reset`.

This is the metadata contract the `oa-form` component actually uses at runtime.
