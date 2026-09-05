# Page-meta component guide

Use this guide to generate page metadata for the dynamic page renderer. A page's `meta` is read from the navigation item and rendered by `oa-layout`.

## Rules for an AI agent

- Emit JSON only when asked to construct metadata. Do not emit Angular templates or component selectors.
- Use only the `control` values listed below. Any other value renders the **component not found** UI unless a page template has registered that control.
- Put a control's configuration in `options` and its content/data in `value`. `login` is the exception: its configuration is passed as `config` internally, but is still written as `options` in metadata.
- `class` is a CSS class string and `style` is an Angular style object, for example `{ "max-width": "720px", "margin": "0 auto" }`.
- Omit fields that are not needed. Do not use a value of `false` as a substitute for omitting a component; use `selected: false` to hide a section.
- The page renderer filters components by `permissions`. Use `permissions: ["permission.code"]` only for content that requires that permission.

## Minimal page shape

```json
{
  "layout": {
    "code": "content",
    "class": "page",
    "sections": [
      {
        "code": "main",
        "components": [
          {
            "code": "welcome",
            "control": "html",
            "value": "<h1>Welcome</h1><p>Start here.</p>"
          }
        ]
      }
    ]
  },
  "header": { "enabled": true },
  "footer": { "enabled": true },
  "styles": {
    "content": { "class": "content", "style": {} }
  }
}
```

`layout.sections` contains sections. A section can contain `components` and nested `sections`. The renderer also supports a section/component `container` wrapper:

```json
{
  "code": "hero",
  "class": "hero",
  "container": {
    "header": {
      "title": { "text": "Dashboard" },
      "description": { "text": "A concise summary." },
      "link": { "text": "View all", "url": "/home" }
    },
    "body": { "class": "hero-body", "style": { "padding": "24px" } }
  },
  "components": []
}
```

For a tab container, use `type: "tabbed"`, put a `container.header` on each child section, and mark one child `selected: true`. `type: "slider"` requires `actions.previous` and `actions.next` action objects.

## Common component fields

Every registered control may use these fields:

| Field         | Type     | Meaning                                                       |
| ------------- | -------- | ------------------------------------------------------------- |
| `code`        | string   | Stable, page-local identifier. Recommended.                   |
| `control`     | string   | One of the controls in this guide. Required.                  |
| `value`       | any      | Content or data supplied to controls that accept it.          |
| `options`     | object   | Component configuration.                                      |
| `class`       | string   | Classes applied to the component host.                        |
| `style`       | object   | Inline style object applied to the component host.            |
| `permissions` | string[] | Required permissions.                                         |
| `container`   | object   | Optional wrapper with `class`, `style`, `header`, and `body`. |

## Registered controls

### `branding`

Renders application, tenant, or organization branding. `value` is not used.

```json
{
  "control": "branding",
  "options": {
    "class": "brand",
    "logo": { "type": "tenant", "size": "lg" },
    "title": { "type": "application" }
  }
}
```

`options.logo.type` and `options.title.type` support `application`, `organization`, and `tenant`; title also supports `page`. Logo/title may be omitted independently.

### `login`

Renders a configurable credential or OAuth login form. `value` is not used.

```json
{
  "control": "login",
  "options": {
    "label": "Sign in",
    "signup": "Create an account",
    "view": "card",
    "identityTypes": [
      {
        "code": "email",
        "label": "Email",
        "icon": "fa fa-envelope",
        "placeholder": "you@example.com",
        "credentialMethods": [
          { "code": "password", "label": "Password", "icon": "fa fa-lock" },
          { "code": "otp", "label": "One-time code", "icon": "fa fa-lock" }
        ]
      },
      {
        "code": "mobile",
        "label": "Mobile",
        "icon": "fa fa-phone",
        "placeholder": "+1 555 123 4567",
        "credentialMethods": [
          { "code": "otp", "label": "One-time code", "icon": "fa fa-lock" },
          { "code": "push", "label": "Passwordless push", "icon": "fa fa-mobile" }
        ]
      }
    ],
    "oauthProviders": [
      { "code": "google", "label": "Google", "icon": "fa fa-google", "url": "https://id.example.com/oauth/google" },
      { "code": "microsoft", "label": "Microsoft", "icon": "fa fa-microsoft", "url": "https://id.example.com/oauth/microsoft" }
    ],
    "passwordReset": "Forgot password",
    "action": "Sign in"
  },
  "style": { "max-width": "420px", "margin": "48px auto" }
}
```

`options.label` is the form heading. `options.signup` is the signup-link text; omit it to hide that link. `options.view` is retained by the component for style/view conventions but does not currently change rendering.

`options.action` sets the submit button text. `options.passwordReset` adds a link to the `auth.forgot-password` page. Identity types, credential methods, and OAuth providers may include an `icon` class, which is rendered on the corresponding option button.

`options.identityTypes` contains identity objects with `code`, `label`, optional `placeholder`, and nested `credentialMethods`. Credential methods support `password`, `otp`, and passwordless `push`. The first identity and its first credential method are selected initially. For `otp`, use the form's send-code action before submitting the code. `oauthProviders` supports `google`, `microsoft`, `github`, `facebook`, and `twitter` (or another provider code); each provider needs a redirect `url` to be actionable.

Applications can set the defaults in the environment with `loginTypes` and `loginMethods`. The default remains email plus password for backwards compatibility.

### `signup`

Renders account registration, verification-code confirmation, and resend-code controls. `value` is not used.

```json
{
  "control": "signup",
  "class": "signup-page",
  "style": { "max-width": "520px", "margin": "48px auto" },
  "options": {
    "label": "Create your account",
    "login": "Sign in instead",
    "stepLabels": [
      {
        "code": "user",
        "label": "User Profile"
      },
      {
        "code": "roles",
        "label": "Choose a role"
      },
      {
        "code": "team",
        "label": "Team Details"
      },
      {
        "code": "review",
        "label": "Review"
      }
    ],
    "identityTypes": [
      {
        "code": "email",
        "label": "Email",
        "icon": "fa fa-envelope",
        "placeholder": "Enter your email",
        "credentialMethods": [
          {
            "code": "password",
            "label": "Password",
            "icon": "fa fa-lock",
            "policy": {
              "minLength": 8,
              "requireUppercase": true,
              "requireLowercase": true,
              "requireNumber": true,
              "requireSpecial": true,
              "allowedSpecialChars": "!@#$%",
              "message": "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character (!@#$%)"
            }
          }
        ]
      },
      {
        "code": "mobile",
        "label": "Mobile",
        "icon": "fa fa-phone",
        "placeholder": "Enter your mobile number",
        "credentialMethods": [
          {
            "code": "password",
            "label": "Password",
            "icon": "fa fa-lock",
            "policy": { "minLength": 8 }
          }
        ]
      }
    ],
    "view": "individual",
    "source": { "campaign": "website" },
    "signupTypes": [
      {
        "code": "organization-member",
        "label": "Organization member",
        "view": "employee",
        "roleType": "organization.member"
      },
      {
        "code": "tenant-member",
        "label": "Tenant member",
        "view": "individual",
        "roleType": "tenant.member"
      },
      {
        "code": "organization-admin",
        "label": "Organization admin",
        "view": "organization",
        "roleType": "organization.admin"
      },
      {
        "code": "tenant-admin",
        "label": "Tenant admin",
        "view": "tenant",
        "roleType": "tenant.admin"
      }
    ]
  }
}
```

`class` and `style` are applied to the signup component host. 
`options.label` sets the heading, and 
`options.login` sets the login-link text. 
`options.stepLabels` customizes the four wizard titles using codes `user`, `roles`, `team` and `review`. 
`options.source` is forwarded to the signup request. 
`options.identityTypes` configures the step-one identity selector; each item supports `code` (`email` or `mobile`), `label`, optional `icon`, optional `placeholder`, and optional `credentialMethods`. Each credential method supports `code` (`password`, `otp`, or `push`), `label`, optional `icon`, and optional `policy`. Password policies support `minLength`, `maxLength`, `requireUppercase`, `requireLowercase`, `requireNumber`, `requireSpecial`, `allowedSpecialChars`, `pattern`, and a custom `message`. `allowedSpecialChars` is a string of permitted special characters, and `message` is shown when the password fails a policy criterion. 
`options.signupTypes` replaces the default role choices; each item supports `code`, `label`, `view`, and optional `roleType`. 
An organization-admin signup type automatically enables the option to create a missing organization. For compatibility, `identityTypes` may be supplied directly or wrapped in one extra array.

For a new user, the form collects first name, last name, email and/or mobile number, password, and password confirmation. Email or mobile is required, and passwords must match with at least eight characters. When a user is already signed in, the current user is reused and the name, contact, password, and confirmation fields are omitted.

The available signup types are filtered by context. With no current tenant, only tenant signup choices (`individual` and `tenant`) are shown. With a tenant but no organization, organization choices (`employee` and `organization`) are shown. With both a tenant and organization, only the organization-member (`employee`) choice is shown.

`options.view` must be one of:

- `individual` — creates a user in the current tenant.
- `employee` — joins the current organization; if there is no current organization, prompts for an organization code.
- `organization` — prompts for a new organization name and code, then creates it in the current tenant.
- `tenant` — prompts for a new tenant name and code.

Signup can present configurable role choices with `options.signupTypes`. Each item contains `code`, `label`, `view`, and an optional `roleType`. The default labels are `Organization member`, `Tenant member`, `Organization admin`, and `Tenant admin`, mapped to `employee`, `individual`, `organization`, and `tenant` views respectively. When a user is already signed in, the signup form reuses the current user and does not ask for name, contact, password, or password confirmation.

Tenant codes are checked for uniqueness before a tenant is created, and organization codes are checked for uniqueness before an organization is created.

Signup runs as a four-step wizard: user information and OTP verification, role selection, organization or tenant information, and a summary with the final create action. Existing user, tenant, and organization context skips the corresponding step. Tenant members must select an existing tenant; tenant admins must provide a new unique tenant code and name. Organization members must select an existing organization; organization admins can create a missing organization when `allowOrganizationCreate` is enabled.

### `role`

Renders the current-role selector. `value` is not used.

```json
{
  "control": "role",
  "options": {
    "branding": { "size": "xx-lg" },
    "title": { "show": false }
  }
}
```

### `breadcrumb`

Renders the current navigation breadcrumb. `value` is not used. Options are component-specific and may be omitted.

```json
{ "control": "breadcrumb", "options": {} }
```

### `html`

Renders HTML after injecting the provided data into a Handlebars-style template. Use only trusted HTML/content.

```json
{
  "control": "html",
  "value": { "name": "Avery", "message": "Welcome back" },
  "options": { "template": { "code": "welcome-message" } }
}
```

`value` can be an object, array, literal HTML/text, or a key in `context.data`. With no template, an object is rendered with `{{this}}`; an array is iterated. `options.template.code` (or `options.view`) selects a stored template.

### `markdown`

Renders Markdown. It can also resolve a URL or a `context.data` key when `value` is a string.

```json
{
  "control": "markdown",
  "value": "# Release notes\n\n- Added login\n- Updated navigation",
  "options": {}
}
```

Use a URL in `value` to load Markdown remotely. It also supports fenced `oa-form` blocks whose JSON becomes a form configuration.

### `form`

Renders an OA form. `options` describes fields, sections, actions, and view; `value` supplies initial model data.

```json
{
  "control": "form",
  "value": { "firstName": "Avery", "email": "avery@example.com" },
  "options": {
    "view": "default",
    "class": "profile-form",
    "fields": [
      { "code": "firstName", "label": "First name", "type": "text", "required": true },
      { "code": "email", "label": "Email", "type": "email", "required": true }
    ],
    "sections": [],
    "actions": [
      { "code": "save", "title": "Save", "icon": "save" }
    ]
  }
}
```

`options` supports `view`, `class`, `style`, `fields`, `sections`, and `actions`. Field-specific options depend on its `type`; use the existing field/input documentation or source when adding unusual field types.

### `action`

Renders a button/icon/menu action. The layout sends `options` as the action `item` and `value` as its value.

```json
{
  "control": "action",
  "value": { "link": "home.dashboard" },
  "options": {
    "code": "link",
    "title": "Open dashboard",
    "icon": "dashboard",
    "view": "button"
  }
}
```

Useful `options` fields: `code`, `title`, `icon`, `view`, `class`, `style`, `config`, and `items` (or `config.items`) for a menu. Built-in action codes include `link`, `back`, `clear`, `close`, `add`, and `help`. For `link`, `value` may be a route string or `{ "link": "route.code", "params": { "path": {}, "query": {} }, "options": {} }`.

### `nav`

Renders application navigation.

```json
{
  "control": "nav",
  "value": "root",
  "options": { "view": "top", "src": "root", "isExpanded": true }
}
```

`options.view` is `top` or `side`. `options.src` (or `value`) chooses a navigation subtree; use `root` for the application navigation. Navigation items themselves come from the application/navigation metadata, not this component's `value` array.

### `json`

Renders an editable JSON view.

```json
{
  "control": "json",
  "value": { "enabled": true, "items": [] },
  "options": { "readOnly": false }
}
```

### `video`

Renders a video viewer.

```json
{
  "control": "video",
  "value": "https://example.com/video.mp4",
  "options": { "autoplay": false, "controls": true }
}
```

### `table`

Renders an editable table. `value` should normally be an array of row objects. The renderer shows “No data available” for an empty value.

```json
{
  "control": "table",
  "value": [{ "name": "Avery", "status": "Active" }],
  "options": { "columns": [{ "code": "name", "title": "Name" }, { "code": "status", "title": "Status" }] }
}
```

### `calendar`

Renders a calendar. Pass events/data in `value`; configure its presentation in `options`.

```json
{
  "control": "calendar",
  "value": [{ "title": "Review", "start": "2026-09-03T10:00:00" }],
  "options": { "view": "month" }
}
```

### `pagination`

Renders pagination controls.

```json
{
  "control": "pagination",
  "value": { "page": 1, "pageSize": 25, "total": 120 },
  "options": { "showPageSize": true }
}
```

### `file-uploader`

Renders the document uploader. The layout forwards `options`; `value` is not forwarded.

```json
{
  "control": "file-uploader",
  "options": { "multiple": true, "accept": ".pdf,.docx" }
}
```

### `uploader`

Renders an “Uploader” button that opens the file-uploader overlay. It forwards `options`; `value` is not forwarded.

```json
{ "control": "uploader", "options": { "multiple": true } }
```

### `thumbnail-picker`

Renders the thumbnail selector. The current layout does **not** forward `value` or `options`, so configure it only through its component defaults until the layout is extended.

```json
{ "control": "thumbnail-picker" }
```

### `spacer`

Renders a flexible empty spacer. It has no `value` or `options`.

```json
{ "control": "spacer" }
```

## Registered placeholders

`notification` and `search` are recognized control names, but their rendering markup is currently commented out. Do not use them in generated metadata until implementations are enabled.

## Page-level header, footer, and sidebar

`header`, `footer`, and `sidebar` are page-level metadata objects rather than component controls. A header, footer, or sidebar object renders by default; set its `enabled` property to `false` to hide it. For custom header/footer/sidebar content, supply a `layout` object using the same section/component syntax shown above.

```json
{
  "header": {
    "enabled": true,
    "layout": { "sections": [] }
  },
  "footer": {
    "enabled": true,
    "layout": { "sections": [] }
  },
  "sidebar": {
    "layout": { "sections": [] }
  }
}
```

Application defaults live under `application.meta.page`; page metadata overrides them when a property is present.
