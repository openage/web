# OA properties component

`<oa-properties>` renders editable fields for a workspace object or selected item. It chooses field definitions by selection type, displays validation state supplied by the caller, and emits an immutable replacement object when a valid edit is made. The caller owns workspace updates, validation, dirty tracking, and persistence. See [properties.component.ts](../src/lib/oa/ux/properties/properties.component.ts) and [properties.component.html](../src/lib/oa/ux/properties/properties.component.html).

## Inputs and field definitions

| Input | Purpose |
| --- | --- |
| `value` | Object whose fields are being edited. Non-object and array values are treated as an empty object. |
| `type` | Selects `options.types[type]`; if missing, `options.types.default` is used. |
| `options.types` | Map of selection type to ordered field definitions. |
| `options.title`, `options.class` | Panel heading and additional CSS class. The heading defaults to “Properties”. |
| `options.lookups`, `options.data.lookups` | Optional named arrays used by lookup fields. |
| `options.validationSchema` | Schema used to infer required and minimum-length constraints for fields. |
| `options.validationErrors`, `options.selectionPath` | Builder validation results and the selected object's workspace path, used to match and display errors. |

Each field definition has a `key`, `label`, and `type`. Keys can be nested paths such as `options.label` or include array indices such as `fields[0].name`. Optional properties include `group`, `options`, `lookup`, `required`, `minLength`, and `description`.

```html
<oa-properties
  [value]="selectedObject"
  [type]="selectionType"
  [options]="{
    title: 'Page properties',
    types: {
      page: [
        { key: 'title', label: 'Title', type: 'text', required: true, group: 'Identity' },
        { key: 'meta.published', label: 'Published', type: 'boolean', group: 'Identity' },
        { key: 'meta.theme', label: 'Theme', type: 'select', options: ['light', 'dark'] }
      ]
    }
  }"
  (valueChange)="selectedObject = $event">
</oa-properties>
```

## Field selection and inferred fields

The component uses configured fields for the selected `type`, then the `default` field list. If neither exists, it infers one field for each top-level object property: booleans become checkboxes, numbers become number inputs, nested objects and arrays become JSON textareas, and other values become text inputs. A configured field list can be empty, in which case the component displays “No attributes are available” rather than inferring fields.

Fields are grouped in first-seen order using their `group` value; fields without a group appear under “General”.

## Field controls

| Field type | Control and behavior |
| --- | --- |
| `text` | Text input; emits on input. |
| `number` | Number input; non-empty values are converted to numbers before emission. |
| `boolean` | Checkbox; emits the checked boolean. |
| `select` | Select control using the field's static `options`, or lookup values when a lookup is configured. |
| `lookup` | Select control resolved from a named lookup. |
| `json` | Formatted JSON textarea; parses and emits on blur. Invalid JSON is shown as a component-level error and is not emitted. |
| `html`, `style` | Textarea; emits the entered string on blur. |

For `select` and `lookup`, `field.lookup` names a lookup. If omitted, the component also accepts `field.options.data.config.lookup`. Lookup arrays are resolved in this order: `options.lookups`, `options.data.lookups`, then the shared constants list. Lookup objects can label and identify options with `title`, `label`, `name`, `value`, `code`, or `id`.

## Validation display

`required` and `minLength` can be set on a field or derived from the supplied validation schema. Matching errors are found by combining `selectionPath` with the field key and compared to the error paths supplied by the builder. Invalid fields receive an invalid state, an `aria-invalid` attribute, and the matching message. The component displays errors but does not validate or block non-JSON edits itself; the builder owns validation policy.

## Output and immutability

`valueChange` emits a deep-cloned replacement object with the edited path updated. The input object is not mutated. Nested objects or arrays missing along a configured key path are created as needed. After emission, the parent should write the new object into its workspace model and run its normal validation and dirty-state handling.
