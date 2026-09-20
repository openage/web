# Signup Component

This document describes the current `oa-signup` component configuration and behavior as implemented in the pages app.

## Overview

The signup component renders a multi-step account registration flow with optional identity verification, credential setup, role selection, team or tenant setup, and a review step. It is driven by a `steps` configuration array in `options` and supports configurable validation, OTP verification, and completion actions.

The component selector is:

```html
<oa-signup></oa-signup>
```

## Example configuration

```json
{
  "control": "signup",
  "options": {
    "label": "Create your account",
    "login": "Sign in instead",
    "steps": [
      {
        "code": "user",
        "label": "User Profile",
        "identityTypes": [
          {
            "code": "email",
            "icon": "fa fa-envelope",
            "label": "Email",
            "placeholder": "Enter your email",
            "type": "email",
            "validators": {
              "required": {
                "message": "Email is required"
              },
              "shouldExist": {
                "exist": false,
                "message": "Email already exists"
              },
              "pattern": {
                "regex": "^\\S+@\\S+\\.\\S+$",
                "flags": "i",
                "message": "Email is invalid"
              }
            },
            "verify": {
              "message": "Please enter the OTP sent to your email",
              "label": "Verify OTP",
              "type": "otp",
              "action": {
                "label": "Verify and Continue",
                "icon": "fa fa-lock"
              },
              "resend": {
                "label": "Resend OTP",
                "icon": "fa fa-lock"
              }
            }
          },
          {
            "code": "mobile",
            "label": "Mobile",
            "icon": "fa fa-phone",
            "placeholder": "Enter your mobile number",
            "type": "tel",
            "validators": {
              "required": {
                "message": "Mobile number is required"
              },
              "shouldExist": {
                "exist": false,
                "message": "Mobile number already exists"
              },
              "pattern": {
                "regex": "^[0-9]{10}$",
                "message": "Mobile number must be 10 digits"
              }
            },
            "verify": {
              "message": "Please enter the OTP sent to your mobile",
              "label": "Verify OTP",
              "type": "otp",
              "action": {
                "label": "Verify and Continue",
                "icon": "fa fa-lock"
              },
              "resend": {
                "label": "Resend OTP",
                "icon": "fa fa-lock"
              }
            },
            "next": {
              "label": "Verify and Continue",
              "icon": "fa fa-arrow-right"
            }
          }
        ],
        "next": {
          "label": "Next",
          "icon": "fa fa-arrow-right"
        },
        "previous": {
          "label": "Cancel",
          "icon": "fa fa-times"
        }
      },
      {
        "code": "credentials",
        "label": "Set Credentials",
        "methods": [
          {
            "code": "password",
            "label": "Password",
            "icon": "fa fa-lock",
            "type": "password",
            "message": "Password to access the application",
            "policy": {},
            "confirmation": {
              "message": "Please enter the password again",
              "label": "Confirm Password"
            },
            "validators": {
              "required": {
                "message": "Password is required"
              },
              "match": {
                "message": "Passwords do not match."
              },
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
          },
          {
            "code": "push",
            "label": "Push",
            "icon": "fa fa-bell",
            "message": "A notification will be sent to your device"
          }
        ],
        "next": {
          "label": "Next",
          "icon": "fa fa-arrow-right"
        },
        "skip": {
          "label": "Skip",
          "icon": "fa fa-arrow-right"
        }
      },
      {
        "code": "roles",
        "label": "Choose a role",
        "roles": [
          {
            "label": "Join a Team",
            "level": "organization",
            "code": "organization.member",
            "input": {
              "label": "Team Code",
              "placeholder": "Enter your team code",
              "type": "text",
              "validators": {
                "required": {
                  "message": "Team code is required"
                },
                "shouldExist": {
                  "exist": true,
                  "message": "Team not found"
                }
              }
            }
          },
          {
            "label": "Join",
            "level": "tenant",
            "code": "tenant.member",
            "input": {
              "label": "Tenant Code",
              "placeholder": "Enter your tenant code",
              "type": "text",
              "validators": {
                "required": {
                  "message": "Tenant code is required"
                },
                "shouldExist": {
                  "exist": true,
                  "message": "Tenant not found"
                }
              }
            }
          },
          {
            "label": "Register a Team",
            "level": "organization",
            "code": "organization.admin",
            "input": {
              "label": "Team Code",
              "placeholder": "Enter your team code",
              "type": "text",
              "validators": {
                "required": {
                  "message": "Team code is required"
                },
                "shouldExist": {
                  "exist": false,
                  "message": "Team code already exists"
                }
              }
            },
            "create": {
              "label": "Team Name",
              "placeholder": "Enter your team name",
              "type": "text",
              "validators": {
                "required": {
                  "message": "Team name is required"
                }
              }
            }
          },
          {
            "label": "Register",
            "level": "tenant",
            "code": "tenant.admin",
            "input": {
              "label": "Tenant Code",
              "placeholder": "Enter your tenant code",
              "type": "text",
              "validators": {
                "required": {
                  "message": "Tenant code is required"
                },
                "shouldExist": {
                  "exist": false,
                  "message": "Team code already exists"
                }
              }
            },
            "create": {
              "label": "Tenant Name",
              "placeholder": "Enter your tenant name",
              "type": "text",
              "validators": {
                "required": {
                  "message": "Tenant name is required"
                }
              }
            }
          }
        ],
        "next": {
          "label": "Next",
          "icon": "fa fa-arrow-right"
        },
        "previous": {
          "label": "Previous",
          "icon": "fa fa-arrow-left"
        }
      },
      {
        "code": "team",
        "label": "Team Details"
      },
      {
        "code": "review",
        "label": "Review",
        "summary": {
          "user": {
            "label": "User Details",
            "message": "Review your details before submitting"
          },
          "role": {
            "label": "Role Details",
            "message": "Review your role details before submitting"
          },
          "team": {
            "label": "Team Details",
            "message": "Review your team details before submitting"
          }
        },
        "next": {
          "label": "Submit",
          "icon": "fa fa-arrow-right"
        },
        "previous": {
          "label": "Previous",
          "icon": "fa fa-arrow-left"
        }
      }
    ],
    "confirmation": {
      "message": "Your account and selected role have been created",
      "label": "Signup Complete",
      "action": {
        "value": {
          "link": "auth.login"
        },
        "options": {
          "code": "link",
          "title": "Continue",
          "view": "button"
        }
      }
    },
    "source": {
      "campaign": "website"
    }
  }
}
```

## Supported configuration

### Root options

- `label`: heading text shown at the top of the card.
- `login`: text shown for the optional login shortcut.
- `source`: forwarded to the signup request metadata.
- `steps`: array of wizard steps.
- `confirmation`: text and action shown after signup completion.

### Step configuration

Each step supports:

- `code`: step identifier
- `label`: visible title for that step
- `next`: button label/icon for advancing
- `previous`: button label/icon for going back
- `skip`: optional skip action for the credentials step

### User step

The user step supports `identityTypes`.

Each identity type can include:

- `code`: `email` or `mobile`
- `label`: display label
- `icon`: optional icon class
- `placeholder`: optional placeholder text
- `type`: input type
- `validators`: validation rules
- `verify`: OTP verification metadata
- `next`: optional custom button label for the identity step

Identity validators support:

- `required.message`
- `pattern.regex`, `pattern.flags`, `pattern.message`
- `shouldExist.exist`, `shouldExist.message`

When `verify` is present, the component shows an OTP input and a verify action after the initial identity check.

### Credentials step

The credentials step uses `methods`.

Each credential method can include:

- `code`: `password`, `otp`, or `push`
- `label`
- `icon`
- `type`
- `message`
- `policy`
- `confirmation`
- `validators`

Current password policy support includes:

- `minLength`
- `maxLength`
- `requireUppercase`
- `requireLowercase`
- `requireNumber`
- `requireSpecial`
- `allowedSpecialChars`
- `pattern`
- `message`

### Roles / team step

The roles step uses `roles`.

Each role entry can define:

- `label`
- `level`: `organization` or `tenant`
- `code`: role code
- `input`: required fields for entering a team/tenant code
- `create`: optional fields for creating a new team or tenant

Role validation is driven by:

- `input.validators.required.message`
- `input.validators.shouldExist.exist`
- `input.validators.shouldExist.message`
- `create.validators.required.message`

### Review step

The review step can show summary sections using `summary.user`, `summary.role`, and `summary.team`. These are rendered in the summary list on the UI.

### Confirmation step

The `confirmation` section defines the post-signup state:

- `label`: heading shown on the completion panel
- `message`: supporting copy
- `action`: action rendered after signup completes

In the example above, the action is a link to `auth.login`.

## Runtime behavior

### User flow

1. The user enters first name and last name.
2. The user chooses an identity type such as email or mobile.
3. The identity value is validated.
4. If configured, the component checks whether that identity already exists.
5. A signup session is created.
6. If OTP verification is configured, the user enters the code and confirms it.
7. The user sets credentials.
8. The user chooses a role.
9. The user provides the required team or tenant details.
10. The component shows a review summary and emits the final create event.

### Role behavior

- `organization.member`: join an existing organization
- `tenant.member`: join an existing tenant
- `organization.admin`: register a new organization in the current tenant
- `tenant.admin`: register a new tenant

### Validation behavior

The current component validates:

- required fields,
- email or mobile format,
- identity existence checks,
- password confirmation,
- password policy,
- organization/tenant code uniqueness or existence,
- required team or tenant names when creating new records.

## Notes

This component is currently implemented as a config-driven wizard, so many of the available options are passed directly from page metadata. The actual UI rendering is controlled by the component’s `steps` array and the current step’s `code`.

Also note that the completion panel is rendered unconditionally in the current template, even before the final creation action finishes. That may be intentional UX, but it is worth checking whether the intended behavior is to show the completion panel only after a successful signup.
