# 01 — Register and regularize Products with a Base Variant

**What to build:** Ensure every newly registered or existing non-deleted Product has a concrete Product Variant. New Products start Active and are registered atomically with one Active Variant named `Base`; existing eligible Products are regularized without changing Products that already have Variants.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Product registration creates the Product and one Active Product Variant named `Base` in one atomic operation.
- [ ] Failure to create the initial Variant leaves no partially registered Product.
- [ ] `Base` is a normal, renamable Product Variant with no special flag, role, protected name, or synchronization with Product name.
- [ ] New Products always start with Product Status `Active`; Product Status is absent from the registration contract and creation form while existing Lifecycle Status behavior remains available.
- [ ] Existing non-deleted Products without a non-deleted Product Variant receive one Active `Base` Variant through the normal migration path.
- [ ] Products that already have at least one non-deleted Variant remain unchanged, including Products whose Variants use other names.
- [ ] Deleted Products are excluded from regularization.
- [ ] Migration-created Variants use the established public-ID format and collision rules and do not duplicate work when no eligible Product remains.
- [ ] Focused API tests verify atomic Product registration, fixed Active status, and persisted `Base` ownership.
- [ ] Focused route tests verify that Product Status is absent from creation and that the new Product appears Active after success.
- [ ] A database-backed migration test covers eligible empty Products, existing Variants, deleted Products, generated identity, and no duplicate regularization.
- [ ] `changes.md` records the delivered invariant, migration boundary, focused verification, and remaining scope.
