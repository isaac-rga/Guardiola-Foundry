# 01 — Register and regularize Products with a Base Variant

**What to build:** Ensure every newly registered or existing non-deleted Product has a concrete Product Variant. New Products start Active and are registered atomically with one Active Variant named `Base`; existing eligible Products are regularized without changing Products that already have Variants.

**Blocked by:** None — can start immediately.

**Status:** complete

- [x] Product registration creates the Product and one Active Product Variant named `Base` in one atomic operation.
- [x] Failure to create the initial Variant leaves no partially registered Product.
- [x] `Base` is a normal, renamable Product Variant with no special flag, role, protected name, or synchronization with Product name.
- [x] New Products always start with Product Status `Active`; Product Status is absent from the registration contract and creation form while existing Lifecycle Status behavior remains available.
- [x] Existing non-deleted Products without a non-deleted Product Variant receive one Active `Base` Variant through the normal migration path.
- [x] Products that already have at least one non-deleted Variant remain unchanged, including Products whose Variants use other names.
- [x] Deleted Products are excluded from regularization.
- [x] Migration-created Variants use the established public-ID format and collision rules and do not duplicate work when no eligible Product remains.
- [x] Focused API tests verify atomic Product registration, fixed Active status, and persisted `Base` ownership.
- [x] Focused route tests verify that Product Status is absent from creation and that the new Product appears Active after success.
- [x] The database-backed migration test was intentionally removed so the completed one-way migration does not run in every future suite; `changes.md` records this accepted exception.
- [x] `changes.md` records the delivered invariant, migration boundary, focused verification, and remaining scope.
