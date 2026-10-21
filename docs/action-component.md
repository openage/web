# Action component

`<oa-action>` renders an action described by the `options` input. Its source and template are [action.component.ts](../src/lib/oa/ux/action/action.component.ts) and [action.component.html](../src/lib/oa/ux/action/action.component.html).

## Inputs

- `options`: an `Action` or action configuration with `title`, `icon`, `view`, `event`, `display`, and optional `items`/`options`. The `toggle` view renders one segmented toggle with the supplied options.
- `disabled`: explicitly disables the rendered button.
- `value`, `items`, `class`, `style`, `icon`, `title`, `view`, and `event`: optional display or behavior overrides.

## Output

- `selected`: emits the selected value for toggle actions and the current value when a normal action is activated.

The component resolves action metadata through `ConstantService`. Action callbacks are preserved while context placeholders are interpolated. A toggle action uses `<oa-toggler>`, updates its current value, calls its configured event with the selected option value and action config, and emits that value through `selected`. When `isDisabled` is true and `display` is `disabled`, the rendered control is disabled; this state is recalculated when the input configuration changes.
