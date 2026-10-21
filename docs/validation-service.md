# Validation service

`ValidationService` provides the schema validation used by builder workspaces and the repository's existing field-validation helpers. Its implementation is [validation.service.ts](../src/lib/oa/core/services/validation.service.ts).

## Builder schema validation

Call `validate(data, schema)` with a value and a JSON Schema-like object. The method returns an array of `BuilderValidationError` values containing a path and message, with an optional suggestion. An empty array means the value passed the supported checks.

The implemented schema subset supports:

- `type`, including an array of accepted types
- `required` and `properties` for object values
- `items` for array entries
- `enum` and `const`
- local references using JSON Pointer paths such as `#/definitions/section`
- `oneOf`, which requires exactly one schema variant to match
- `minLength` for strings and `minItems` for arrays
- `minimum` and `maximum` for numbers

Validation stops at a nesting depth greater than 64 and reports that limit. Unresolved references are errors. The service does not implement all JSON Schema keywords; for example, it has no `allOf`, `anyOf`, remote references, or `format` support. Keep builder schemas within the documented subset.

Builder controls place the schema in the selected canvas control's `options.schema`. The builder controller exposes validation state and path-specific errors to the canvas and properties panel. See [Builder workspace](./builder-workspace.md) and [OA canvas](./oa-canvas-component.md).

## Existing field validators

The service also exposes existing length limits, regular expressions, and helper methods for common account, identity, contact, and organization values. These methods return the repository's validation code objects when invalid and are consumed by existing form/data validation flows. Preserve those codes when changing validation behavior because callers may use them to select user-facing messages.
