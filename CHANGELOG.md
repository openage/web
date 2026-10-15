# Changelog

All notable changes to this project are documented in this file.

## [3.3.0] - 2026-10-14

### Added
- Add quick-links navigation and expose current context through `ContextService.toObject()`.
- Add a reusable list control with table and grid views for metadata-driven pages.
- Render table templates with configurable skeletons and loading indicators.

### Changed
- Improve context-menu styling and accessibility, and make navigation links respect visibility and permissions.
- Preserve the requested URL when redirecting users without a session user to login.
- Normalize data-source options and improve debug and JSON viewer interactions.

### Fixed
- Handle invalid data-source options and data-service errors more consistently.
- Display empty and null JSON values accurately.

## [3.2.0] - 2026-10-02

### Added
- Add conditional, collapsible, and popup sections to metadata-driven layouts.
- Add data-bound field and create/edit action support to dynamic pages.

### Changed
- Resolve route parameters regardless of case and punctuation, and support nested action routes.
- Support `group` form-field mapping while preserving legacy `section` metadata.

### Fixed
- Handle empty date values safely and improve input labels and styling options.

## [3.1.0] - 2026-09-27

### Added
- Add loading skeletons and async template resolution for the HTML viewer.

### Changed
- Improve navigation and template URL resolution for parameterized page data and content lookups.

### Fixed
- Fix delayed keyed-value rendering so HTML content updates when data becomes available.

## [3.0.0] - 2026-09-26

### Added
- Add dynamic page routing and core application services.
- Add login, OTP verification, and configurable multi-step signup.
- Add remote HTTP data sources and Handlebars template rendering.
- Add Markdown rendering support.
- Add server-backed session loading from URL tokens and remove consumed tokens from the route.

### Changed
- **BREAKING:** Rename the public `oa-action` input from `item` to `options`; update consumer bindings.
- Upgrade the application from Angular 20 to Angular 21 and modernize login, signup, and role-selection experiences.

### Fixed
- Improve application initialization error feedback.
- Fix Markdown rendering issues.

[3.2.0]: https://gitlab.com/oa-pages/ux/pages-app/-/compare/f7914219bb9935168bc67e869b85c61692a9a430...76980c8dee66ccba5698099339df5f6de7f9311b
[3.3.0]: https://gitlab.com/oa-pages/ux/pages-app/-/compare/113f31ea2e99d0f4a0bdd59d2c671a0c4609f347...1b0895f521f6f5a7f77f84bfb283837b3a23809e

