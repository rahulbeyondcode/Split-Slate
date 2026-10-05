# Confirmation Dialogs

Purpose: define how destructive actions request confirmation without browser-native dialogs.

Last updated: 2026-10-05

## Decision

Eligible group, expense, contact, group-member, category, and tag deletion uses the shared in-app
`ConfirmationDialog`, not `window.confirm`. It uses the browser's modal `<dialog>` behavior with
app styling, an explicit Cancel action, Escape cancellation, and a named destructive action.
While a deletion is pending, both actions and Escape cancellation are disabled; a failed deletion
keeps the dialog open and shows the error there. Cancellation makes no data changes.

Guarded deletions continue to explain why they are blocked before confirmation: referenced
members and contacts show their expense links, while in-use or last categories show their
constraint. Tag confirmation states that expense references are removed without deleting the
expenses. Group confirmation names the group and warns that all group-owned data is lost while
shared contacts remain. Expense confirmation names the expense and warns that its receipts are
deleted and balances recalculated. Contact confirmation distinguishes directory-wide deletion from
removing a member from one group. Currency-change confirmation retains its separate in-app UI; no
destructive confirmation uses a browser-native dialog. See [[expense-edit-delete]].

## Related

- [[member-management]] — one-group removal versus directory-wide deletion
- [[category-management]] — in-use and last-category guards
- [[tag-management]] — tag reference cleanup
- [[people-directory]] — directory deletion and expense links
- [[group-deletion]] — full group cascade and confirmation
