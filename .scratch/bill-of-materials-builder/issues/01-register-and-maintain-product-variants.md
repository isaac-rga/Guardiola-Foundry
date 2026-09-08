# 01 — Register and maintain Product Variants

**What to build:** Let Users manage the constructively distinct Product Variants owned by a Product. From Product context, Users can register a Variant with its commercial name, see existing Variants, rename them, and change their independent Active or Inactive availability without confusing them with historical Product revisions or BOM Implementations.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] An authenticated User can see the non-deleted Product Variants that belong to a Product.
- [ ] An Admin or Operator can create a Product Variant for an Active, non-deleted Product using its commercial name as the only Variant-specific prerequisite.
- [ ] A Product Variant receives a stable system identity, belongs permanently to exactly one Product, and cannot be moved to another Product.
- [ ] New Product Variants default to Active and may exist without a BOM Implementation or commercial specification.
- [ ] An Admin or Operator can rename a Product Variant and change its status between Active and Inactive.
- [ ] Variant names are case-insensitively unique among non-deleted Active and Inactive Variants of the same Product, while the same name remains valid under a different Product.
- [ ] An Inactive or soft-deleted Product cannot receive a new Product Variant, regardless of Lifecycle Status.
- [ ] Inactivating a Product Variant preserves its identity and Product ownership.
- [ ] Validation and availability failures preserve entered form values and explain the corrective action.
- [ ] Focused API and Product-route tests cover registration, listing, editing, status changes, ownership, uniqueness, authentication, and unavailable Product behavior.
