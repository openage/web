# Theme Developer Guide

This project keeps the shared app theme in the global stylesheet at [src/styles.scss](src/styles.scss). The login/signup wizard styling and the popup/dialog menu styling are intentionally centralized there so theme updates do not need component-level CSS overrides.

## 1. Where the theme is defined

The shared styles in [src/styles.scss](src/styles.scss) use CSS variables that are expected to be supplied by the active app theme. The root block in the global stylesheet only defines layout-level sizing and font settings; the brand colors are still provided by the theme CSS that the app loads for each application or tenant.

Typical tokens used by the wizard include:

```scss
:root {
  --primary: #0793CC;
  --primary-dark: #0A2540;
  --primary-light: #3378D2;
  --surface: #ffffff;
  --background: #f4f7fb;
  --neutral: #94a3b8;
  --neutral-light: #cbd5e1;
  --neutral-dark: #52606d;
  --text: #253043;
  --primaryTextColor: #ffffff;
}
```

The actual app theme files under [src/assets/app](src/assets/app) such as [src/assets/app/ai/theme.css](src/assets/app/ai/theme.css) and the other theme variants are the normal place to set these values for a specific brand.

## 2. Shared theme classes

The current global theme defines the following classes for login/signup flows and popup content:

Auth wizard:

- `.oa-wiz-card` – main auth card container
- `.oa-wiz-body` – content section inside the form
- `.oa-wiz-actions` – primary/secondary action row
- `.oa-wiz-footer` – helper/footer row beneath the form
- `.oa-wiz-error` – validation and error text
- `.oa-wiz-login` – inline helper text like “Already registered?”
- `.primary-button` – primary call-to-action button
- `.secondary-button` – secondary action button
- `.role-option` – role selection choice card

Dialog/profile popup:

- `.oa-dialog` – popup wrapper
- `.oa-dialog-panel` – floating dialog panel
- `.oa-dialog-menu` – menu list container
- `.oa-dialog-item` – menu item in the popup
- `.oa-dialog-header` – popup header block
- `.oa-dialog-body` – popup content block
- `.oa-dialog-footer` – popup footer block

The generic selectors also include `oa-login` and `oa-signup` so both components can share one theme layer.

## 3. Styling pattern

Keep all shared auth and dialog styling in [src/styles.scss](src/styles.scss). Do not add duplicated wizard colors, button styles, popup spacing, or layout rules in component CSS unless the style is genuinely local to a component.

The current pattern is:

```html
<section class="oa-wiz-card">
  <div class="oa-wiz-body">...</div>
  <div class="oa-wiz-actions">
    <button class="primary-button">Continue</button>
    <button class="secondary-button">Back</button>
  </div>
</section>
```

Popup content follows the same theme-first pattern:

```html
<div class="oa-dialog-panel">
  <div class="oa-dialog-header">...</div>
  <div class="oa-dialog-body">...</div>
  <div class="oa-dialog-footer">...</div>
</div>
```

This keeps the login/signup and profile menu themeable as a single design system.

## 4. How to customize a brand

Update the color variables in the active theme file or override them in the global stylesheet before the existing class rules are applied. The same token set affects both wizard controls and floating dialog surfaces.

Example:

```scss
:root {
  --primary: #1a73e8;
  --primary-dark: #0d47a1;
  --surface: #f8fbff;
  --neutral-light: #d7e2f0;
}
```

This automatically changes:

- card border and button accents
- selected role and tab state colors
- focus ring colors
- text and surface contrast in the wizard
- dialog border, highlight, and action surface styling

## 5. Legacy compatibility

The shared stylesheet still includes compatibility aliases for older patterns such as `.login-card`, `.signup-card`, `.login-body`, `.signup-body`, `.login-error`, `.signup-error`, `.login-footer`, and older popup selectors so older markup does not break immediately. New work should target the `oa-wiz-*` and `oa-dialog-*` naming conventions.

## 6. Recommended practice

- Theme tokens should come from the app theme, not from login/signup or dialog component CSS.
- Reuse the shared `oa-wiz-*` and `oa-dialog-*` classes in new views.
- Keep spacing, radii, and state styling in the centralized theme file.
- Only add component-specific styles when they do not affect the shared design system.

This keeps the login/signup and popup experience consistent across apps and makes it easy to rebrand without searching through multiple component CSS files.
