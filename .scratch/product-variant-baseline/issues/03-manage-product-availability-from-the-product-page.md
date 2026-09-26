# 03 — Manage Product availability from the Product page

**What to build:** Make Product Status an explicit operational action on the Product page instead of editable Product content. Users can activate a Product directly or choose whether inactivation affects only the Product or also every currently Active Product Variant, without saving or discarding Product-detail edits.

**Blocked by:** 01 — Register and regularize Products with a Base Variant.

**Status:** complete

- [x] Product availability uses dedicated authenticated actions and shared contracts rather than the Product-detail save operation.
- [x] Omitting the Variant-inactivation choice has Product-only semantics.
- [x] Product-only inactivation changes Product Status to `Inactive` and preserves every Product Variant status.
- [x] Product-and-Variant inactivation changes every Variant that is Active when the transaction executes and leaves already Inactive Variants unchanged.
- [x] Inactivation locks the Product before evaluating its current Variants and commits the selected Product and Variant transitions atomically.
- [x] Activation changes only Product Status to `Active`, never activates Product Variants, and remains valid when all Variants are Inactive.
- [x] Repeating an already satisfied availability transition does not corrupt state or broaden the requested effect.
- [x] Admin and Operator may activate or inactivate Products; deleted-record visibility and Product restoration remain admin-only.
- [x] Product Status is removed from the Product-detail update contract and edit form while all other editable Product fields and image behavior remain unchanged.
- [x] Product Status appears as read-only context in Record metadata.
- [x] The Product-page header exposes the valid `Activate Product` or `Inactivate Product` action independently from `Save changes`.
- [x] Inactivation opens one dialog whose default affects only the Product and whose alternative also affects all Active Variants; when none are Active, the dialog only confirms Product inactivation.
- [x] Activation executes without a dialog and provides visible success, error, and pending feedback.
- [x] Availability actions neither submit nor reset pending Product-detail edits, and success or failure preserves the form's current values and dirty state.
- [x] Product detail, Product list, Product Variant, and Product Variant candidate caches update or invalidate according to the completed action.
- [x] Focused API tests cover both inactivation choices, activation, current-state evaluation, permissions, repeated transitions, atomic failure, and persisted outcomes.
- [x] Focused route tests cover metadata, header actions, dialog choices, no-Variant-choice state, feedback, pending controls, and preservation of unsaved edits.
