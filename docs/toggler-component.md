# Toggler component

`<oa-toggler>` presents a value as a toggle control using its `items` input or a configured icon list. Its source and template are [toggler.component.ts](../src/lib/oa/ux/toggler/toggler.component.ts) and [toggler.component.html](../src/lib/oa/ux/toggler/toggler.component.html).

## Inputs and output

- `value`: currently selected item value.
- `items`: options with `code`, optional `value`, `label`, `title`, `icon`, `class`, and `style`. If `value` is omitted, the option's `code` is used.
- `view`: `icon` for a cycling icon control or `button` for a selectable segmented toggle.
- `disabled`, `readonly`, `required`, `code`, and `options`: additional control configuration.
- `valueChange`: emits the selected item value after a user selects an option.

The button view highlights the selected item with a sliding indicator. The indicator transition respects `prefers-reduced-motion`. Clicking an option selects that specific value; it does not cycle through neighboring options. The icon view cycles backward through configured items and safely does nothing when there are no selectable items.
