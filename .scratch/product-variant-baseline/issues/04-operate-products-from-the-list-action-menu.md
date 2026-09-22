# 04 — Operate Products from the list action menu

**What to build:** Add a compact Product-table action menu that makes the same valid availability, deletion, navigation, and recovery operations accessible from the working list while preserving permissions, feedback, and the existing Product-name navigation path.

**Blocked by:** 02 — Preserve the required Variant through delete and restore; 03 — Manage Product availability from the Product page.

**Status:** complete

- [x] The Product table ends with a narrow actions column using the established Bills of Materials menu pattern and an accessible label for each Product.
- [x] The Product name remains a direct navigation link after the menu is introduced.
- [x] A non-deleted Product menu exposes Edit, the currently valid Activate or Inactivate action, and Delete.
- [x] An Inactive Product offers Activate and an Active Product offers Inactivate; the menu never presents both transitions simultaneously.
- [x] Inactivation reuses the same dialog, defaults, atomic mutation, feedback, and no-active-Variant behavior as the Product page.
- [x] Activation reuses the same direct action and changes only the Product.
- [x] Delete uses an explicit Product-specific confirmation and the existing soft-delete behavior that preserves Variants and Bills of Materials.
- [x] A deleted Product menu exposes View and, for Admin only, Restore; Operator never receives deleted-record recovery actions.
- [x] Restoring an exceptional empty Product through the list observes the required-Variant behavior from ticket 02.
- [x] Completed actions update the visible row, Product Status presentation, active filters, deleted-record visibility, and feedback without requiring a page reload.
- [x] Menu and dialog focus behavior remains accessible when an action completes, is cancelled, or fails.
- [x] Pending actions prevent duplicate submission without disabling unrelated rows unnecessarily.
- [x] Focused route tests cover menu contents by state and role, navigation, both availability transitions, both inactivation choices, Delete, View, Restore, filter effects, feedback, and accessible focus.
