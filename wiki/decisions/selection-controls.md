# Selection Controls

Purpose: keep checkboxes and radios legible and consistent without losing native form behavior.

Last updated: 2026-09-29

## Decision

Visible checkbox and radio inputs retain their native input types, labels, form registration, and
keyboard semantics. A shared `.choice-control` style draws a 20px rounded checkbox or circular
radio with the app's brand colors. Checked, hover, focus-visible, and disabled states use the
existing light/dark theme tokens. `.choice-option` presents selectable rows as compact cards;
disabled required export selections remain visibly checked but use muted rows and explanatory text
to distinguish them from editable choices. Chip-style payer and category radios
keep their native visually hidden inputs, with selection and keyboard focus shown on the chips.

This applies to expense participants, payer mode, categories and tags, expense filters, group
export options, and import identity selection. App settings' Dark theme control is a switch, not
a checkbox or radio, so it keeps its separate switch appearance. Group-creation category and
currency buttons use `aria-pressed` chips rather than native checkbox/radio inputs.

## Related

- [[filtering]] — multi-select expense filters
- [[paid-by]] — payer selection modes
- [[group-creation]] — existing chip-based setup steps
- [[import-export]] — import identity and export content selection
