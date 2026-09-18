# 02 — Delete and restore Product Variants safely

**What to build:** Let authorized Users remove Product Variants from ordinary work without destroying them, and let Admins restore them when their Product relationship and commercial name remain valid. Deletion and restoration must preserve permanent Product ownership for the later Bill of Materials workflow.

**Blocked by:** 01 — Register and maintain Product Variants.

**Status:** done

- [x] An Admin or Operator can soft-delete a Product Variant after an explicit confirmation that identifies the Variant and Product.
- [x] A soft-deleted Product Variant is excluded from ordinary Product Variant views and new-work selection.
- [x] Soft deletion preserves the Variant's identity, Product ownership, commercial name, and availability history needed for recovery.
- [x] An Admin can include and inspect soft-deleted Product Variants from Product context.
- [x] An Operator cannot browse or restore complete soft-deleted Product Variant records.
- [x] An Admin can restore a Product Variant when no non-deleted Variant under the same Product has taken its case-insensitive name.
- [x] Restoration is blocked with an actionable conflict when another non-deleted Variant has taken the name; neither record is overwritten or reassigned.
- [x] Restoring a Variant does not change its permanent Product ownership.
- [x] Product unavailability does not erase a deleted Variant or weaken its restoration constraints.
- [x] Focused API and Product-route tests cover role boundaries, ordinary-list exclusion, recovery, name conflicts, and preserved ownership.
