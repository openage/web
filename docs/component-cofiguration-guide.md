# Component Configuration Guide

This document provides a comprehensive reference for all configurable components in the OpenAge Angular application. Each component is documented with its available configuration options, usage examples, and special notes.

## Table of Contents

1. [Input Components](#input-components)
   - [InputSelectorComponent](#inputselectorcomponent)
   - [InputTextComponent](#inputtextcomponent)
   - [AmountEditorComponent](#amounteditorcomponent)
   - [DatePickerComponent](#datepickercomponent)
   - [AutocompleteComponent](#autocompletecomponent)

2. [Display Components](#display-components)
   - [AlertComponent](#alertcomponent)
   - [IconComponent](#iconcomponent)
   - [AvatarComponent](#avatarcomponent)
   - [ProcessingIndicatorComponent](#processingindicatorcomponent)
   - [HtmlViewerComponent](#htmlviewercomponent)
   - [JsonViewerComponent](#jsonviewercomponent)
   - [VideoViewerComponent](#videoviewercomponent)

3. [Layout Components](#layout-components)
   - [FormComponent](#formcomponent)
   - [PaginationControlsComponent](#paginationcontrolscomponent)
   - [PopupComponent](#popupcomponent)
   - [CollectionComponent](#collectioncomponent)

4. [Action Components](#action-components)
   - [ActionComponent](#actioncomponent)
   - [TogglerComponent](#togglercomponent)

## Input Components

### InputSelectorComponent

**Selector:** `oa-input-selector`

A versatile component for selecting items from a list with different view modes.

#### Configuration Options

##### Input Properties

| Property      | Type                                                  | Default        | Description                                    |
| ------------- | ----------------------------------------------------- | -------------- | ---------------------------------------------- |
| `id`          | string                                                | undefined      | Optional ID for the component                  |
| `style`       | any                                                   | -              | Custom inline styles to apply to the component |
| `class`       | string                                                | undefined      | Custom CSS classes to apply to the component   |
| `label`       | string                                                | undefined      | Label text to display above the selector       |
| `showLabel`   | boolean                                               | true           | Whether to display the label                   |
| `placeholder` | string                                                | undefined      | Placeholder text when no selection is made     |
| `disabled`    | boolean                                               | false          | Whether the component is disabled              |
| `readonly`    | boolean                                               | false          | Whether the component is read-only             |
| `required`    | boolean                                               | false          | Whether a selection is required                |
| `view`        | 'toggler' \| 'toggler-with-icons-and-stats' \| 'list' | 'toggler'      | Display mode for the selector                  |
| `items`       | any[]                                                 | []             | Array of items to select from                  |
| `type`        | 'priority' \| 'custom'                                | 'custom'       | Predefined item types or custom items          |
| `value`       | any                                                   | 'not-required' | Currently selected value                       |
| `options`     | any                                                   | {}             | Additional configuration options               |
| `validate`    | any                                                   | -              | Custom validation function                     |

##### Output Properties

| Property      | Type              | Description                             |
| ------------- | ----------------- | --------------------------------------- |
| `changed`     | EventEmitter<any> | Emits when selection changes (obsolete) |
| `valueChange` | EventEmitter<any> | Emits when selection changes            |

#### Usage Examples

##### Basic Usage

```html
<oa-input-selector
  label="Priority"
  [items]="priorityItems"
  [(value)]="selectedPriority">
</oa-input-selector>
```

##### With Custom View Mode

```html
<oa-input-selector
  label="Select Option"
  view="toggler-with-icons-and-stats"
  [items]="optionsWithIcons"
  [(value)]="selectedOption">
</oa-input-selector>
```

##### Using Predefined Types

```html
<oa-input-selector
  label="Priority Level"
  type="priority"
  [(value)]="taskPriority">
</oa-input-selector>
```

#### Item Format

Each item in the `items` array should have the following structure:

```typescript
{
  label: string;  // Display text
  value: any;     // Value to be emitted when selected
  icon?: string;  // Optional icon (for toggler-with-icons-and-stats view)
  stat?: string;  // Optional statistic (for toggler-with-icons-and-stats view)
  default?: boolean; // Whether this item is selected by default
}
```

### InputTextComponent

**Selector:** `oa-text-input`

A versatile input component that supports various input types including text, number, email, date, and rich text.

#### Configuration Options

##### Input Properties

| Property      | Type                | Default | Description                                    |
| ------------- | ------------------- | ------- | ---------------------------------------------- |
| `control`     | string              | 'text'  | The type of control to render                  |
| `style`       | any                 | -       | Custom inline styles to apply to the component |
| `class`       | string              | -       | Custom CSS classes to apply to the component   |
| `view`        | string              | -       | Display mode for the input                     |
| `value`       | any                 | -       | The input value                                |
| `error`       | string              | -       | Error message to display                       |
| `label`       | string              | -       | Label text for the input                       |
| `showLabel`   | boolean             | true    | Whether to display the label                   |
| `placeholder` | string              | -       | Placeholder text when input is empty           |
| `type`        | any                 | 'text'  | Input type (text, number, email, date, etc.)   |
| `id`          | string              | -       | ID attribute for the input element             |
| `disabled`    | boolean             | false   | Whether the input is disabled                  |
| `readonly`    | boolean             | false   | Whether the input is read-only                 |
| `required`    | boolean             | false   | Whether the input is required                  |
| `preFix`      | Action \| any       | -       | Action or content to display before the input  |
| `postFix`     | Action \| any       | -       | Action or content to display after the input   |
| `uppercase`   | boolean             | false   | Whether to convert input to uppercase          |
| `trimSpace`   | boolean             | true    | Whether to trim whitespace from input          |
| `options`     | InputOptions \| any | -       | Additional configuration options               |
| `validate`    | any                 | -       | Custom validation function                     |

##### Output Properties

| Property      | Type                  | Description                                     |
| ------------- | --------------------- | ----------------------------------------------- |
| `errored`     | EventEmitter<any>     | Emits when validation errors occur              |
| `valueChange` | EventEmitter<any>     | Emits when the input value changes              |
| `changed`     | EventEmitter<any>     | Alias for valueChange (obsolete)                |
| `selected`    | EventEmitter<boolean> | Emits when the input is focused or blurred      |
| `canceled`    | EventEmitter<string>  | Emits when input is canceled (e.g., Escape key) |

#### Usage Examples

##### Basic Text Input

```html
<oa-text-input
  label="Username"
  [(value)]="username"
  [required]="true">
</oa-text-input>
```

##### Number Input

```html
<oa-text-input
  type="number"
  label="Quantity"
  [(value)]="quantity"
  [options]="{ min: 1, max: 100 }">
</oa-text-input>
```

##### Date Input

```html
<oa-text-input
  type="date"
  label="Birth Date"
  [(value)]="birthDate">
</oa-text-input>
```

##### With Prefix and Postfix

```html
<oa-text-input
  type="text"
  label="Search"
  [(value)]="searchTerm"
  [preFix]="{ icon: 'search' }"
  [postFix]="{ icon: 'clear', event: clearSearch }">
</oa-text-input>
```

#### Input Types and Controls

The component automatically maps `type` to appropriate `control` and `view` settings:

| Type                       | Control     | View  | Description               |
| -------------------------- | ----------- | ----- | ------------------------- |
| text, number, email, phone | input       | text  | Standard input fields     |
| date                       | date-picker | date  | Date selection            |
| day                        | date-picker | day   | Day selection             |
| week                       | date-picker | week  | Week selection            |
| month                      | date-picker | month | Month selection           |
| multi-line                 | textarea    | -     | Multi-line text input     |
| html                       | rich        | -     | Rich text editor          |
| config                     | json        | -     | JSON configuration editor |

#### InputOptions Structure

The `options` property accepts an InputOptions object or a plain object with the following structure:

```typescript
{
  label?: string;         // Input label
  placeholder?: string;   // Placeholder text
  required?: boolean;     // Whether input is required
  inline?: boolean;       // Whether to display inline (hides label)
  class?: string;         // CSS class
  style?: any;            // Custom styling
  view?: string;          // Display mode
  multiline?: boolean;    // Whether to allow multiple lines
  min?: number;           // Minimum length/value
  max?: number;           // Maximum length/value
  changed?: string;       // Behavior after change ('reset' to clear after change)
  trigger?: string;       // When to trigger change event
  keys?: {                // Key mappings
    finish?: string;      // Key to finish editing
    cancel?: string;      // Key to cancel editing
  }
}
```

### AmountEditorComponent

**Selector:** `oa-value-editor`

A versatile component for editing numerical values with units, supporting various display modes and value types.

#### Configuration Options

##### Input Properties

| Property        | Type                                                                                                                  | Default                | Description                                               |
| --------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------- |
| `view`          | 'slab' \| 'fixed' \| 'container' \| 'inline' \| 'margin' \| 'options'                                                 | 'fixed'                | Display mode for the editor                               |
| `type`          | 'currency' \| 'weight' \| 'length' \| 'temperature' \| 'humidity' \| 'cbm' \| 'basis' \| 'chargeableWeight' \| 'span' | -                      | Type of value being edited                                |
| `value`         | { value?: any, unit?: any }                                                                                           | { value: 0, unit: {} } | The value and unit being edited                           |
| `units`         | any[]                                                                                                                 | -                      | Available units for selection                             |
| `decimal`       | number                                                                                                                | 2                      | Number of decimal places to display                       |
| `contentOnly`   | boolean                                                                                                               | false                  | Whether to show only the content without editing controls |
| `readonly`      | boolean                                                                                                               | false                  | Whether the component is read-only                        |
| `switchOptions` | boolean                                                                                                               | false                  | Whether to allow switching between different view modes   |
| `options`       | any                                                                                                                   | {}                     | Additional configuration options                          |
| `basis`         | string                                                                                                                | -                      | Basis for calculation (when applicable)                   |

##### Output Properties

| Property      | Type                 | Description                          |
| ------------- | -------------------- | ------------------------------------ |
| `changed`     | EventEmitter<any>    | Emits when the value or unit changes |
| `changedView` | EventEmitter<string> | Emits when the view mode changes     |

#### Usage Examples

##### Basic Usage

```html
<oa-value-editor
  type="currency"
  [value]="{ value: 100, unit: 'USD' }"
  [units]="currencyUnits"
  (changed)="onValueChanged($event)">
</oa-value-editor>
```

##### With Different View Mode

```html
<oa-value-editor
  view="slab"
  type="weight"
  [value]="weightValue"
  [units]="weightUnits">
</oa-value-editor>
```

##### Read-only Display

```html
<oa-value-editor
  [readonly]="true"
  type="temperature"
  [value]="temperatureValue"
  [units]="temperatureUnits">
</oa-value-editor>
```

#### Value Format

The `value` property accepts different formats:

1. **Simple number**: Automatically converted to `{ value: number }`
2. **String**: Parsed as a float and converted to `{ value: number }`
3. **Object with value property**:
   - For 'fixed' view: `{ value: number, unit: any }`
   - For 'slab' view: `{ value: array, unit: any }`
   - For 'options' view: `{ value: object, unit: any }`

#### View Modes

- **fixed**: Simple value with unit
- **slab**: Array of values (for tiered pricing, etc.)
- **options**: Key-value pairs for different options
- **container**: Container-specific layout
- **inline**: Inline display
- **margin**: With margin display

### DatePickerComponent

**Selector:** `oa-date-picker`

A versatile date picker component that supports various date selection modes including single date, date range, week view, and month view.

#### Configuration Options

##### Input Properties

| Property       | Type                                                                                                 | Default      | Description                                               |
| -------------- | ---------------------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------- |
| `style`        | any                                                                                                  | -            | Custom inline styles to apply to the component            |
| `readonly`     | boolean                                                                                              | false        | Whether the date picker is read-only                      |
| `view`         | 'date' \| 'inline' \| 'day' \| 'week' \| 'month' \| 'range' \| 'readonly' \| 'icon' \| 'weekAndData' | 'date'       | Display mode for the date picker                          |
| `placeholder`  | string                                                                                               | -            | Placeholder text when no date is selected                 |
| `required`     | boolean                                                                                              | false        | Whether a date selection is required                      |
| `value`        | string \| Date \| TimeLine                                                                           | -            | The selected date value or date range                     |
| `populateData` | any                                                                                                  | -            | Data to populate in calendar views (for weekAndData view) |
| `minDate`      | Date                                                                                                 | -            | Minimum selectable date                                   |
| `maxDate`      | Date                                                                                                 | -            | Maximum selectable date                                   |
| `format`       | string                                                                                               | 'DD-MM-YYYY' | Date format string (using Moment.js format)               |
| `disabled`     | boolean                                                                                              | false        | Whether the component is disabled                         |
| `isReset`      | boolean                                                                                              | false        | Whether to reset the date selection                       |
| `options`      | DatePickerOptions                                                                                    | -            | Additional configuration options                          |
| `overdue`      | boolean                                                                                              | false        | Whether to highlight overdue dates                        |

##### Output Properties

| Property      | Type                           | Description                                        |
| ------------- | ------------------------------ | -------------------------------------------------- |
| `valueChange` | EventEmitter<Date \| TimeLine> | Emits when the selected date or date range changes |

#### Usage Examples

##### Basic Date Picker

```html
<oa-date-picker
  [(value)]="selectedDate"
  format="YYYY-MM-DD">
</oa-date-picker>
```

##### Date Range Picker

```html
<oa-date-picker
  view="range"
  [(value)]="dateRange"
  [minDate]="minAllowedDate"
  [maxDate]="maxAllowedDate">
</oa-date-picker>
```

##### Week View

```html
<oa-date-picker
  view="week"
  [(value)]="weekStartDate">
</oa-date-picker>
```

##### Read-only Display

```html
<oa-date-picker
  [readonly]="true"
  [value]="displayDate"
  format="MMMM Do, YYYY">
</oa-date-picker>
```

#### View Modes

- **date**: Standard date picker with popup calendar
- **inline**: Inline calendar display
- **day**: Single day selection with navigation
- **week**: Week view with day selection
- **month**: Month view with navigation
- **range**: Date range selection with start and end dates
- **readonly**: Display-only mode
- **icon**: Icon-only display that expands to picker on click
- **weekAndData**: Week view with associated data display

### AutocompleteComponent

**Selector:** `oa-autocomplete`

A versatile component for providing autocomplete functionality with search capabilities, recent selections, and customizable display options.

#### Configuration Options

##### Input Properties

| Property        | Type                            | Default | Description                                    |
| --------------- | ------------------------------- | ------- | ---------------------------------------------- |
| `id`            | string                          | -       | Unique identifier for the component            |
| `optionsId`     | string                          | -       | ID for the options dropdown element            |
| `style`         | any                             | -       | Custom inline styles to apply to the component |
| `class`         | string                          | -       | Custom CSS classes to apply to the component   |
| `disabled`      | boolean                         | false   | Whether the component is disabled              |
| `readonly`      | boolean                         | false   | Whether the component is read-only             |
| `required`      | boolean                         | false   | Whether a selection is required                |
| `value`         | any                             | -       | The currently selected value                   |
| `label`         | string                          | -       | Label text for the component                   |
| `showLabel`     | boolean                         | true    | Whether to display the label                   |
| `placeholder`   | string                          | -       | Placeholder text when no selection is made     |
| `api`           | DataService                     | -       | Data service for fetching options              |
| `url`           | {code?: string, addOn?: string} | -       | URL configuration for API requests             |
| `displayValue`  | () => string                    | -       | Function to format the display value           |
| `options`       | AutoCompleteOptions \| any      | -       | Additional configuration options               |
| `preFix`        | Action                          | -       | Action or content to display before the input  |
| `postFix`       | Action                          | -       | Action or content to display after the input   |
| `storeKeys`     | any                             | -       | Configuration for storing recent selections    |
| `componentName` | string                          | -       | Name for identifying component in storage      |

##### Output Properties

| Property      | Type              | Description                           |
| ------------- | ----------------- | ------------------------------------- |
| `valueChange` | EventEmitter<any> | Emits when the selected value changes |
| `changed`     | EventEmitter<any> | Alias for valueChange (obsolete)      |
| `mouseMove`   | EventEmitter<any> | Emits when mouse moves over options   |

#### Usage Examples

##### Basic Usage

```html
<oa-autocomplete
  label="Select User"
  [options]="{ 
    search: { 
      field: 'name', 
      limit: 10 
    } 
  }"
  [api]="userService"
  [(value)]="selectedUser">
</oa-autocomplete>
```

##### With Recent Selections Storage

```html
<oa-autocomplete
  label="Select Product"
  componentName="productSelector"
  [storeKeys]="{ code: '{{data.code}}', name: '{{data.name}}' }"
  [options]="productAutocompleteOptions"
  [(value)]="selectedProduct">
</oa-autocomplete>
```

##### With Custom Display and Actions

```html
<oa-autocomplete
  label="Select Location"
  [preFix]="{ icon: 'location_on' }"
  [postFix]="clearLocationAction"
  [options]="{ 
    view: { icon: 'map' },
    add: { 
      event: createNewLocation,
      permissions: ['locations.create']
    }
  }"
  [(value)]="selectedLocation">
</oa-autocomplete>
```

#### AutoCompleteOptions Structure

The `options` property accepts an AutoCompleteOptions object or a plain object with the following structure:

```typescript
{
  label?: string;         // Component label
  required?: boolean;     // Whether selection is required
  preFetch?: boolean;     // Whether to fetch options on init
  autoSelect?: boolean;   // Whether to auto-select when only one option is available
  prefixItem?: any[];     // Items to always show at the beginning of the options list
  search: {               // Search configuration
    field: string;        // Field to search on
    params?: any;         // Additional search parameters
    limit?: number;       // Number of results per page
  };
  data?: {                // Data source configuration
    src?: string;         // API endpoint
    items?: any[];        // Static items list
  };
  view?: {                // View configuration
    icon?: string;        // Icon to display
    inline?: boolean;     // Whether to display inline
  };
  add?: {                 // Add new item configuration
    event: Function;      // Function to call when adding new item
    permissions?: string[]; // Required permissions
  };
  messages?: {            // Custom messages
    noRecords?: string;   // Message when no results found
  };
}
```

## Display Components

### AlertComponent

**Selector:** `oa-alert`

A component for displaying alert messages to users.

#### Configuration Options

##### Input Properties

| Property | Type         | Default  | Description                                                                  |
| -------- | ------------ | -------- | ---------------------------------------------------------------------------- |
| `class`  | string       | -        | Custom CSS classes to apply to the component                                 |
| `view`   | string       | 'banner' | Display mode for the alert (e.g., 'banner')                                  |
| `value`  | any[] \| any | []       | Alert message(s) to display. Can be a single message or an array of messages |

#### Usage Examples

##### Basic Usage

```html
<oa-alert
  [value]="'This is an alert message'">
</oa-alert>
```

##### With Multiple Messages

```html
<oa-alert
  [value]="['Warning: Invalid input', 'Please try again']">
</oa-alert>
```

##### With Custom Styling

```html
<oa-alert
  class="error-alert"
  [value]="errorMessage">
</oa-alert>
```

#### Notes

- If a single message is provided as `value`, it will be automatically converted to an array
- The component includes a close function that clears all messages

### IconComponent

**Selector:** `oa-icon`

A versatile component for displaying icons from various sources including Material icons, Font Awesome, custom icons, and image URLs.

#### Configuration Options

##### Input Properties

| Property | Type   | Default | Description                                                                       |
| -------- | ------ | ------- | --------------------------------------------------------------------------------- |
| `value`  | any    | -       | The icon to display. Can be a string identifier or an object with icon properties |
| `title`  | string | -       | Tooltip text to display when hovering over the icon                               |
| `class`  | string | -       | Custom CSS classes to apply to the icon                                           |
| `style`  | any    | -       | Custom inline styles to apply to the icon                                         |

#### Usage Examples

##### Basic Usage with Material Icon

```html
<oa-icon value="home"></oa-icon>
```

##### Using Font Awesome Icon

```html
<oa-icon value="fa-user"></oa-icon>
```

##### Using Image URL

```html
<oa-icon value="https://example.com/icon.png"></oa-icon>
```

##### With Custom Styling

```html
<oa-icon 
  value="settings" 
  class="large-icon" 
  [style]="{'color': 'blue'}">
</oa-icon>
```

##### With Tooltip

```html
<oa-icon 
  value="info" 
  title="Additional information">
</oa-icon>
```

#### Icon Value Format

The `value` property accepts different formats:

1. **String formats**:
   - Material icon name: `"home"`, `"settings"`, etc.
   - Font Awesome icon: `"fa-user"`, `"fa-star"`, etc.
   - OpenAge icon: `"oa-custom-icon"` (prefixed with "oa-")
   - Material icon with prefix: `"mat-home"` (prefixed with "mat-")
   - Image URL: Any URL starting with "http"

2. **Object format**:
   ```typescript
   {
     mat?: string;    // Material icon name
     fa?: string;     // Font Awesome icon (without "fa-" prefix)
     oa?: string;     // OpenAge icon (without "oa-" prefix)
     url?: string;    // Image URL
     class?: string;  // CSS class
     style?: any;     // Custom styles
     title?: string;  // Tooltip text
   }
   ```

### AvatarComponent

**Selector:** `oa-avatar`

A versatile component for displaying user avatars, profile pictures, or placeholder images with various display options.

#### Configuration Options

##### Input Properties

| Property   | Type                                                   | Default          | Description                                        |
| ---------- | ------------------------------------------------------ | ---------------- | -------------------------------------------------- |
| `view`     | 'text' \| 'avatar' \| 'pic' \| 'selectable'            | 'avatar'         | Display mode for the avatar                        |
| `value`    | string \| User \| Profile \| Pic \| any                | -                | The value to display (can be text, URL, or object) |
| `default`  | string                                                 | -                | Default value to use if no value is provided       |
| `pic`      | Pic                                                    | -                | Picture object with URL information                |
| `text`     | string                                                 | -                | Text to display (typically initials)               |
| `user`     | User                                                   | -                | User object containing profile information         |
| `url`      | string                                                 | -                | Direct URL to an image                             |
| `profile`  | Profile                                                | -                | Profile object containing user details             |
| `type`     | 'micro' \| 'button' \| 'thumbnail' \| 'box' \| 'large' | 'button'         | Predefined size type                               |
| `shape`    | 'square' \| 'round'                                    | 'round'          | Shape of the avatar                                |
| `size`     | string \| number                                       | 30               | Size in pixels or predefined size name             |
| `border`   | string                                                 | 'var(--default)' | Border color or style                              |
| `color`    | string                                                 | 'var(--default)' | Text color                                         |
| `style`    | any                                                    | -                | Custom inline styles to apply to the component     |
| `selected` | boolean                                                | false            | Whether the avatar is in selected state            |

##### Output Properties

| Property | Type              | Description                      |
| -------- | ----------------- | -------------------------------- |
| `click`  | EventEmitter<any> | Emits when the avatar is clicked |

#### Usage Examples

##### Basic Usage with Text

```html
<oa-avatar
  value="John Doe">
</oa-avatar>
```

##### With Image URL

```html
<oa-avatar
  value="https://example.com/profile.jpg">
</oa-avatar>
```

##### With User Object

```html
<oa-avatar
  [user]="currentUser"
  type="large">
</oa-avatar>
```

##### Custom Styling

```html
<oa-avatar
  value="JD"
  shape="square"
  size="xx-lg"
  border="blue"
  color="#333333"
  (click)="onAvatarClick()">
</oa-avatar>
```

#### Size Options

The `size` property accepts numeric values (in pixels) or the following string values:

| Size Name | Pixel Value |
| --------- | ----------- |
| 'xxx-sm'  | 4px         |
| 'xx-sm'   | 8px         |
| 'x-sm'    | 16px        |
| 'sm'      | 20px        |
| (default) | 24px        |
| 'lg'      | 32px        |
| 'x-lg'    | 64px        |
| 'xx-lg'   | 128px       |
| 'xxx-lg'  | 256px       |

The `type` property also affects size if no explicit size is provided:

| Type        | Pixel Value |
| ----------- | ----------- |
| 'micro'     | 16px        |
| 'button'    | 24px        |
| 'thumbnail' | 32px        |
| 'large'     | 64px        |
| 'box'       | 128px       |

### ProcessingIndicatorComponent

**Selector:** `processing-indicator`

A versatile component for displaying various types of loading and progress indicators.

#### Configuration Options

##### Input Properties

| Property                 | Type                                                                                                                 | Default  | Description                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------- |
| `inline`                 | boolean                                                                                                              | false    | Whether to display inline or as a cover overlay |
| `view`                   | 'bars' \| 'spinner' \| 'progress-bar' \| 'spinball' \| 'stepper' \| 'download-indicator' \| 'spinner-withBackground' | 'bars'   | The type of indicator to display                |
| `progressBarMode`        | 'determinate' \| 'indeterminate' \| 'buffer' \| 'query'                                                              | 'buffer' | Mode for progress bar view                      |
| `progressBarBufferValue` | number                                                                                                               | 0        | Buffer value for progress bar in buffer mode    |
| `progressBarvalue`       | number                                                                                                               | 0        | Current progress value (0-100)                  |
| `progressTaskId`         | string                                                                                                               | -        | ID of task to track progress                    |
| `progressError`          | string                                                                                                               | -        | Error message to display if progress fails      |
| `diameter`               | number                                                                                                               | 100      | Size of circular indicators in pixels           |
| `steps`                  | Array<{label: string, status: string, rightBar?: boolean, style: string}>                                            | -        | Steps configuration for stepper view            |
| `currentStep`            | number \| string                                                                                                     | -        | Current active step index or 'completed'        |

##### Output Properties

| Property | Type                  | Description                                  |
| -------- | --------------------- | -------------------------------------------- |
| `done`   | EventEmitter<boolean> | Emits when the process is complete           |
| `error`  | EventEmitter<boolean> | Emits when an error occurs during processing |

#### Usage Examples

##### Basic Spinner

```html
<processing-indicator
  view="spinner">
</processing-indicator>
```

##### Inline Progress Bar

```html
<processing-indicator
  [inline]="true"
  view="progress-bar"
  progressBarMode="determinate"
  [progressBarvalue]="uploadProgress">
</processing-indicator>
```

##### Stepper Indicator

```html
<processing-indicator
  view="stepper"
  [steps]="[
    {label: 'Step 1', status: 'completed', style: 'success'},
    {label: 'Step 2', status: 'active', style: 'primary'},
    {label: 'Step 3', status: 'default', style: 'default'}
  ]"
  currentStep="Step 2">
</processing-indicator>
```

##### Task Progress Tracking

```html
<processing-indicator
  view="progress-bar"
  progressTaskId="task-123"
  (done)="onProcessingComplete()"
  (error)="onProcessingError()">
</processing-indicator>
```

#### View Types

- **bars**: Animated loading bars
- **spinner**: Circular loading spinner
- **progress-bar**: Linear progress bar with various modes
- **spinball**: Animated spinning ball
- **stepper**: Multi-step progress indicator
- **download-indicator**: Specialized indicator for downloads
- **spinner-withBackground**: Spinner with background overlay

### HtmlViewerComponent

**Selector:** `oa-html-viewer`

A component for rendering HTML content with templating capabilities and dynamic data binding.

#### Configuration Options

##### Input Properties

| Property  | Type | Default | Description                                                               |
| --------- | ---- | ------- | ------------------------------------------------------------------------- |
| `value`   | any  | -       | The HTML content to display or a reference to data in the context service |
| `options` | any  | -       | Configuration options for the viewer                                      |

#### Usage Examples

##### Basic Usage

```html
<oa-html-viewer
  value="<p>This is some <strong>HTML</strong> content</p>">
</oa-html-viewer>
```

##### With Context Reference

```html
<oa-html-viewer
  value="content.description">
</oa-html-viewer>
```

##### With Template

```html
<oa-html-viewer
  [value]="articleData"
  [options]="{ 
    template: '<div class=\"article\"><h1>{{title}}</h1><div>{{content}}</div></div>',
    class: 'custom-viewer'
  }">
</oa-html-viewer>
```

##### Using Predefined View

```html
<oa-html-viewer
  [value]="linkData"
  [options]="{ view: 'link' }">
</oa-html-viewer>
```

#### ViewerOptions Structure

The `options` property accepts a ViewerOptions object or a plain object with the following structure:

```typescript
{
  template?: string;      // HTML template with placeholders
  view?: string;          // Predefined view ('link', 'summary')
  class?: string;         // CSS class to apply
  style?: any;            // Custom styling
  root?: string;          // Root URL for links
}
```

#### Predefined Templates

The component includes several predefined templates:

##### Link Template
```html
<a href="{{url}}" class="link">{{title}}</a>
```

##### Summary Template
```html
<div class="summary">
  <img class="main-img" src="{{icon}}" alt="Icon">
  <div class="content">
    <h2 class="title">{{title}}</h2>
    <p class="description">{{description}}</p>
    <a href="{{options.root}}/{{code}}" class="link">Learn More</a>
  </div>
</div>
```

### JsonViewerComponent

**Selector:** `oa-json-viewer`

A component for displaying and exploring JSON data with collapsible sections and formatting options.

#### Configuration Options

##### Input Properties

| Property  | Type   | Default | Description                                                                   |
| --------- | ------ | ------- | ----------------------------------------------------------------------------- |
| `style`   | any    | -       | Custom inline styles to apply to the component                                |
| `class`   | string | -       | Custom CSS classes to apply to the component                                  |
| `value`   | any    | -       | The JSON data to display or a string reference to data in the context service |
| `options` | any    | -       | Configuration options for the viewer                                          |

#### Usage Examples

##### Basic Usage

```html
<oa-json-viewer
  [value]="jsonData">
</oa-json-viewer>
```

##### With Formatting Options

```html
<oa-json-viewer
  [value]="complexObject"
  [options]="{ 
    limit: 100, 
    skip: { 
      fields: ['_id', 'createdAt'], 
      empty: true 
    },
    sort: { key: true }
  }">
</oa-json-viewer>
```

##### With Context Reference

```html
<oa-json-viewer
  value="api.response"
  class="response-viewer">
</oa-json-viewer>
```

#### Options Structure

The `options` property accepts an object with the following structure:

```typescript
{
  class?: string;         // CSS class to apply
  style?: any;            // Custom styling
  limit?: number;         // Character limit for string values
  skip?: {                // Properties to skip
    fields?: string[];    // Field names to skip
    empty?: boolean;      // Whether to skip empty values
  };
  sort?: {                // Sorting options
    key?: boolean;        // Whether to sort by key name
  };
}
```

### VideoViewerComponent

**Selector:** `oa-video-viewer`

A component for displaying video content from various sources including YouTube and local files.

#### Configuration Options

##### Input Properties

| Property  | Type                | Default | Description                                |
| --------- | ------------------- | ------- | ------------------------------------------ |
| `value`   | any                 | -       | The video URL or source to display         |
| `options` | any \| VideoOptions | -       | Configuration options for the video viewer |

#### Usage Examples

##### Basic Usage with YouTube Video

```html
<oa-video-viewer
  value="https://www.youtube.com/embed/dQw4w9WgXcQ">
</oa-video-viewer>
```

##### With Explicit Provider

```html
<oa-video-viewer
  value="https://example.com/video.mp4"
  [options]="{ provider: 'file' }">
</oa-video-viewer>
```

##### With Custom Options

```html
<oa-video-viewer
  value="https://www.youtube.com/embed/dQw4w9WgXcQ"
  [options]="{ 
    provider: 'youtube',
    width: 640,
    height: 360,
    autoplay: true
  }">
</oa-video-viewer>
```

#### VideoOptions Structure

The `options` property accepts a VideoOptions object or a plain object with the following structure:

```typescript
{
  provider?: 'youtube' | 'file';  // Video source provider
  width?: number;                 // Video player width
  height?: number;                // Video player height
  autoplay?: boolean;             // Whether to autoplay the video
}
```

## Layout Components

### FormComponent

**Selector:** `oa-form`

A flexible form component that supports complex form structures with sections, fields, and actions.

#### Configuration Options

##### Input Properties

| Property    | Type              | Default | Description                                                                |
| ----------- | ----------------- | ------- | -------------------------------------------------------------------------- |
| `value`     | any               | -       | The form data object or a string reference to data in the context service  |
| `options`   | any               | -       | Form configuration options (can be a FormOptions object or a plain object) |
| `showReset` | boolean           | true    | Whether to show the reset button                                           |
| `view`      | 'form' \| 'table' | 'form'  | Display mode for the form                                                  |

##### Output Properties

| Property      | Type              | Description                                                   |
| ------------- | ----------------- | ------------------------------------------------------------- |
| `valueChange` | EventEmitter<any> | Emits when the form is submitted with the updated form values |

#### Usage Examples

##### Basic Usage

```html
<oa-form
  [value]="formData"
  [options]="formOptions"
  (valueChange)="onFormSubmit($event)">
</oa-form>
```

##### With Table View

```html
<oa-form
  view="table"
  [value]="tableData"
  [options]="tableOptions">
</oa-form>
```

#### Form Options Structure

The `options` property accepts a FormOptions object or a plain object with the following structure:

```typescript
{
  class?: string;           // CSS class for the form
  fields?: FieldModel[];    // Array of field definitions
  actions?: Action[];       // Array of action definitions
  sections?: any[];         // Form sections configuration
}
```

##### Field Model Structure

```typescript
{
  key: string;              // Property path in the value object (e.g., 'user.name')
  label?: string;           // Field label
  control?: string;         // Field control type ('text', 'select', 'object', etc.)
  defaultValue?: any;       // Default value if not present in the data
  section?: string;         // Section code this field belongs to
  style?: any;              // Custom styling
  // Additional field-specific properties
}
```

##### Action Structure

```typescript
{
  code: string;             // Action identifier ('reset', 'submit', etc.)
  label?: string;           // Button label
  group?: string;           // Action group/section
  config?: any;             // Action configuration
  // Additional action-specific properties
}
```

##### Section Structure

```typescript
{
  code?: string;            // Section identifier
  class?: string;           // CSS class
  style?: any;              // Custom styling
  container?: any;          // Container configuration
  fields?: FieldModel[];    // Fields in this section
  actions?: Action[];       // Actions in this section
  sections?: any[];         // Nested sections
}
```

### PaginationControlsComponent

**Selector:** `oa-pagination`

A component for displaying and controlling pagination for data lists.

#### Configuration Options

##### Input Properties

| Property  | Type                 | Default | Description                                                                     |
| --------- | -------------------- | ------- | ------------------------------------------------------------------------------- |
| `value`   | DomainPage \| string | -       | The pagination data object or a string reference to data in the context service |
| `options` | any                  | -       | Additional configuration options for the pagination controls                    |

#### Usage Examples

##### Basic Usage

```html
<oa-pagination
  [value]="paginatedData">
</oa-pagination>
```

##### With Context Reference

```html
<oa-pagination
  value="users.list">
</oa-pagination>
```

##### With Custom Options

```html
<oa-pagination
  [value]="paginatedData"
  [options]="{ showPageSize: true, pageSizeOptions: [10, 25, 50, 100] }">
</oa-pagination>
```

### PopupComponent

**Selector:** `oa-popup`

A component for displaying popup dialogs, tooltips, and other overlay content with configurable positioning and themes.

#### Configuration Options

##### Properties

| Property   | Type             | Default             | Description                                  |
| ---------- | ---------------- | ------------------- | -------------------------------------------- |
| `position` | PopupPosition    | PopupPosition.ABOVE | Position of the popup relative to its target |
| `theme`    | PopupTheme       | PopupTheme.DARK     | Visual theme of the popup                    |
| `type`     | PopupType        | PopupType.DIALOG    | Type of popup to display                     |
| `template` | TemplateRef<any> | -                   | Template reference for the popup content     |
| `data`     | any              | -                   | Data to be passed to the template            |
| `title`    | string           | ''                  | Title text for the popup                     |
| `left`     | number           | 0                   | Horizontal position in pixels                |
| `top`      | number           | 0                   | Vertical position in pixels                  |
| `visible`  | boolean          | false               | Whether the popup is currently visible       |

#### Usage Examples

##### Basic Usage

```html
<oa-popup
  [position]="PopupPosition.BELOW"
  [theme]="PopupTheme.LIGHT"
  [type]="PopupType.TOOLTIP"
  [template]="tooltipTemplate"
  [data]="tooltipData"
  [visible]="showTooltip">
</oa-popup>

<ng-template #tooltipTemplate let-data>
  <div>{{data.message}}</div>
</ng-template>
```

#### Enums

##### PopupPosition

```typescript
enum PopupPosition {
  ABOVE = 'above',
  BELOW = 'below',
  LEFT = 'left',
  RIGHT = 'right',
  CENTER = 'center'
}
```

##### PopupTheme

```typescript
enum PopupTheme {
  LIGHT = 'light',
  DARK = 'dark'
}
```

##### PopupType

```typescript
enum PopupType {
  TOOLTIP = 'tooltip',
  DIALOG = 'dialog',
  DROPDOWN = 'dropdown'
}
```

### CollectionComponent

**Selector:** `oa-collection`

A component for displaying and managing collections of data with configurable fields and options.

#### Configuration Options

##### Input Properties

| Property  | Type | Default | Description                                                              |
| --------- | ---- | ------- | ------------------------------------------------------------------------ |
| `value`   | any  | -       | The collection data or a string reference to data in the context service |
| `options` | any  | -       | Configuration options for the collection                                 |

#### Usage Examples

##### Basic Usage

```html
<oa-collection
  [value]="collectionData"
  [options]="{ fields: collectionFields }">
</oa-collection>
```

##### With Context Reference

```html
<oa-collection
  value="products.list"
  [options]="productCollectionOptions">
</oa-collection>
```

#### Options Structure

The `options` property accepts an object with the following structure:

```typescript
{
  fields: [
    {
      key: string;           // Property path in the value object
      control?: string;      // Type of control to render
      defaultValue?: any;    // Default value if not present in the data
      fields?: any[];        // Nested fields (for control='object')
    }
  ]
}
```

## Action Components

### ActionComponent

**Selector:** `oa-action`

A versatile component for creating interactive action buttons, links, and menu items with various display modes.

#### Configuration Options

##### Input Properties

| Property   | Type                | Default | Description                                               |
| ---------- | ------------------- | ------- | --------------------------------------------------------- |
| `item`     | Action \| any       | -       | Action configuration object or string code                |
| `value`    | any                 | -       | Value associated with the action                          |
| `class`    | string              | -       | Custom CSS classes to apply to the component              |
| `style`    | any                 | -       | Custom inline styles to apply to the component            |
| `event`    | (obj?: any) => void | -       | Function to execute when the action is triggered          |
| `items`    | any[]               | []      | Sub-items for dropdown or menu actions                    |
| `disabled` | boolean             | false   | Whether the action is disabled                            |
| `icon`     | any                 | -       | Icon to display for the action                            |
| `title`    | string              | ''      | Text or tooltip for the action                            |
| `view`     | string              | -       | Display mode (raised, stroked, flat, icon, fab, mini-fab) |

##### Output Properties

| Property   | Type              | Description                                                |
| ---------- | ----------------- | ---------------------------------------------------------- |
| `selected` | EventEmitter<any> | Emits when the action is clicked with the associated value |

#### Usage Examples

##### Basic Button Action

```html
<oa-action
  [item]="{ code: 'save', title: 'Save Changes' }"
  (selected)="onSave()">
</oa-action>
```

##### Icon Action

```html
<oa-action
  [item]="{ code: 'delete', icon: 'delete' }"
  view="icon"
  [value]="itemToDelete"
  (selected)="onDelete($event)">
</oa-action>
```

##### Dropdown Menu

```html
<oa-action
  [item]="{ code: 'more', title: 'Options' }"
  [items]="menuOptions"
  (selected)="onOptionSelected($event)">
</oa-action>
```

##### Navigation Link

```html
<oa-action
  [item]="{ code: 'link' }"
  [value]="'dashboard'"
  [title]="'Go to Dashboard'">
</oa-action>
```

#### Action Item Format

The `item` property can be a string code or an object with the following structure:

```typescript
{
  code: string;           // Action identifier ('save', 'delete', 'link', etc.)
  title?: string;         // Display text or tooltip
  icon?: any;             // Icon to display
  class?: string;         // CSS class
  style?: any;            // Custom styling
  event?: Function;       // Click handler
  items?: any[];          // Sub-items for dropdown/menu
  config?: any;           // Additional configuration
  view?: string;          // Display mode
  value?: any;            // Associated value
  permissions?: string[]; // Required permissions
}
```

#### Built-in Action Types

The component has special handling for several action types:

- **link**: Navigates to specified route
- **back/clear/close**: Navigates back
- **email**: Handles email sharing
- **chat**: Handles chat sharing
- **copy**: Handles content copying
- **help**: Navigates to help section
- **add**: Opens a popup form

### TogglerComponent

**Selector:** `oa-toggler`

A component for toggling between multiple options with various display modes.

#### Configuration Options

##### Input Properties

| Property   | Type                                                                                                                         | Default | Description                                            |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------ |
| `value`    | any                                                                                                                          | -       | The currently selected value                           |
| `code`     | string                                                                                                                       | -       | Code to retrieve predefined items from ConstantService |
| `view`     | 'icon' \| 'button' \| 'select' \| 'mini-fab'                                                                                 | 'icon'  | Display mode for the toggler                           |
| `disabled` | boolean                                                                                                                      | false   | Whether the toggler is disabled                        |
| `readonly` | boolean                                                                                                                      | false   | Whether the toggler is read-only                       |
| `required` | boolean                                                                                                                      | false   | Whether a selection is required                        |
| `items`    | Array<{label: string, icon: any, class?: string, style?: any, code: any, value?: any, index?: number, isSelected?: boolean}> | []      | Array of options to toggle between                     |
| `options`  | TogglerOptions \| any                                                                                                        | -       | Additional configuration options                       |

##### Output Properties

| Property      | Type              | Description                            |
| ------------- | ----------------- | -------------------------------------- |
| `valueChange` | EventEmitter<any> | Emits when the selected option changes |

#### Usage Examples

##### Basic Usage

```html
<oa-toggler
  [items]="[
    {label: 'Option 1', icon: 'check', code: 'opt1'},
    {label: 'Option 2', icon: 'close', code: 'opt2'}
  ]"
  [(value)]="selectedOption">
</oa-toggler>
```

##### With Different View Mode

```html
<oa-toggler
  view="button"
  [items]="toggleOptions"
  [(value)]="selectedValue">
</oa-toggler>
```

##### Using Predefined Items

```html
<oa-toggler
  code="status-options"
  [(value)]="selectedStatus">
</oa-toggler>
```

#### Item Format

Each item in the `items` array should have the following structure:

```typescript
{
  label: string;     // Display text
  icon: any;         // Icon to display
  class?: string;    // Optional CSS class
  style?: any;       // Optional custom styling
  code: any;         // Unique identifier
  value?: any;       // Value to emit when selected (defaults to code if not provided)
  index?: number;    // Position in the items array (auto-assigned)
  isSelected?: boolean; // Whether this item is currently selected (auto-managed)
}
```
