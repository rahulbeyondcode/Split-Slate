---
name: string-input-normalization
description: How user-provided strings are normalized and rejected at form and store boundaries
metadata:
  type: decisions
---

# Decision: String Input Normalization

Purpose: prevent blank or accidentally padded user input from being accepted as valid or entering
persistent domain state.

Last updated: 2026-08-26

## Decision

Every user-provided string is trimmed before field-specific validation and before persistence. If
the trimmed value is empty, validation fails. A sequence containing only spaces, tabs, line breaks,
non-breaking spaces, or other whitespace is therefore not a valid value.

Trimming removes only leading and trailing whitespace. Meaningful internal spaces are preserved;
for example, `"  Goa   Trip  "` becomes `"Goa   Trip"`.

This applies to all current user-provided string fields, including:

- LocalUser and Person names and icons
- Group names, icons, and currencies
- Category names and icons
- Tag names and colors
- onboarding and standalone group-creation form values

Opaque IDs and optional internal values that users do not enter are outside this rule.

## Enforcement Boundaries

Form schemas return normalized values so submit handlers receive trimmed strings. Store mutations
independently normalize and validate persisted strings so programmatic callers cannot bypass form
validation. Field-specific rules, such as tag-color format and case-insensitive uniqueness, run
against normalized values.

Trimming is not performed on every keystroke because that would interfere with ordinary typing.
It occurs when validation or persistence is attempted.

Future forms and mutations must use the shared string-validation helpers or enforce the same
contract at both boundaries.

## Consequences

- whitespace-only input is treated the same as an empty string
- persisted user-provided strings have no leading or trailing whitespace
- case and internal spacing remain unchanged unless a field has an additional canonical format
- validation tests must include ordinary spaces, tabs, line breaks, and Unicode whitespace

## Related

- [[testing-strategy]] — required boundary and invalid-input test cases
- [[onboarding]] — identity and first-group form validation
- [[group-creation]] — shared group-building form validation
- [[people-directory]] — person creation and editing
- [[category-management]] — normalized category names and icons
- [[tag-management]] — normalized tag names and colors
