# 02 — Preserve the required Variant through delete and restore

**What to build:** Keep the Product Variant invariant intact after registration. Users can delete a Variant only when another non-deleted Variant remains, and restoring an exceptional empty Product creates `Base` without changing Products that already retain their Variants.

**Blocked by:** 01 — Register and regularize Products with a Base Variant.

**Status:** ready-for-agent

- [ ] Direct soft deletion is rejected when the target is the Product's last non-deleted Variant, including when the Product itself is soft-deleted.
- [ ] Last-Variant protection locks and evaluates the owning Product and current Variant set atomically so concurrent deletion attempts cannot leave the Product empty.
- [ ] A Variant may still be soft-deleted normally when another non-deleted Variant remains.
- [ ] The Product Variant interface keeps the last Variant's Delete action visible but disabled and explains that another Variant must be created first.
- [ ] After another Variant is created, the previously protected Variant becomes deletable through the ordinary confirmation workflow.
- [ ] Restoring a Product with no non-deleted Variant creates one Active `Base` Variant in the same transaction as restoration.
- [ ] Restoring a Product that already has a non-deleted Variant leaves every Variant unchanged.
- [ ] Product soft deletion continues to preserve Product Variants, Bills of Materials, and their relationships without cascading soft deletion.
- [ ] Existing BOM read-only and restoration behavior remains unchanged while a related Product or Variant is soft-deleted.
- [ ] Relevant Product, Product Variant, and candidate caches are refreshed after successful deletion or restoration behavior changes.
- [ ] Focused API tests cover allowed deletion, blocked last deletion, concurrent deletion, empty restoration, preserved restoration, permissions, and absence of partial writes.
- [ ] Focused route tests cover the disabled last-Variant action, its explanation, and normal deletion after a replacement Variant exists.
- [ ] `changes.md` records the deletion/restoration rules, concurrency evidence, focused verification, and remaining scope.
