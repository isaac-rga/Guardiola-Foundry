---
status: accepted
---

# Require Product Variants and separate availability actions

Every non-deleted Product must own at least one non-deleted Product Variant because concrete construction work belongs to a Variant, not directly to the Product. Product registration therefore creates an Active, renamable Variant named `Base` in the same transaction; direct deletion cannot remove the last Variant, existing non-deleted Products without one are regularized, and restoring an empty Product creates `Base`. Soft-deleting a Product still preserves its Variants and Bills of Materials.

Product Status is an operational availability transition rather than editable Product content. New Products always begin Active, and status changes use dedicated actions on the Product page and Product-list action menu. Inactivation asks whether to affect only the Product or also every currently Active Variant and applies the selected transition atomically; activation changes only the Product. These actions neither save nor discard pending Product-detail edits, and Product Status remains visible as record metadata.

This decision supersedes earlier Product Management requirements that exposed Product Status in create and edit forms or limited Product deletion and restoration actions to the edit page. It also supersedes the earlier Bills of Materials assumption that a Product may own zero Product Variants.

## Consequences

- The create flow omits Product Status. Product editing omits it from the form and shows it in Record metadata.
- The Product page header exposes `Activate Product` or `Inactivate Product` independently from `Save changes`.
- The Product table ends with a Bills of Materials-style action menu. Available Products expose Edit, Activate or Inactivate, and Delete; deleted Products expose View and admin-only Restore.
- Inactivation opens a dialog whose default changes only the Product and whose alternative also inactivates all Variants that are Active when the transaction executes. When none are Active, the dialog only confirms Product inactivation.
- Activation changes only the Product and requires no dialog. A Product may be Active while all of its Variants are Inactive.
- Admin and Operator may activate or inactivate Products. Product restoration remains admin-only.
- Availability actions are atomic and independent from pending Product-detail edits. They neither save nor discard those edits, and a failed action preserves both the previous availability and the pending form values.
- The Product Variant interface keeps deletion visible but disabled for the last non-deleted Variant, while the server enforces the same rule under concurrency.
