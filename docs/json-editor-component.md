# JSON editor component

`<oa-json-editor>` displays JSON as a syntax-highlighted, content-editable document. The component is used by the canvas Code tab and can also be rendered through the JSON control in `oa-layout`.

## Inputs and outputs

- `value`: the JSON value to display. Object or array values are pretty-printed. String values resolve through context data when a matching key exists; otherwise they are treated as JSON text.
- `options`: optional JSON editor settings. `skip.fields` omits named object properties while formatting the displayed value.
- `valueChange`: emits the complete parsed JSON value when the editor loses focus with valid JSON. Consumers should replace the source value with this emitted value.

Invalid or empty JSON is reported in the editor and does not emit a value.
