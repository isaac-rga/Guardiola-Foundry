# 14 — Delete and restore Bills of Materials

**What to build:** Let authorized Users remove Bills of Materials from ordinary work and let Admins restore them when their exclusive relationships remain available. Deletion must preserve independent lineage and explain the relationship slot it releases without cascading into Products, Variants, origins, or descendants.

**Blocked by:** 02 — Delete and restore Product Variants safely; 13 — Derive BOM Templates and preserve lineage.

**Status:** ready-for-agent

- [ ] An Admin or Operator can soft-delete an available Bill of Materials after explicit confirmation showing its name and Product or Product Variant context.
- [ ] When descendants exist, confirmation shows their count and explains that they retain this Bill of Materials as BOM Origin.
- [ ] Soft deletion preserves the record and lineage, releases its Product or Product Variant slot, prevents ordinary use, and does not cascade.
- [ ] Soft-deleted Bills of Materials are excluded from ordinary results and are available as read-only records through an Admin-only deleted-record view.
- [ ] An Operator encountering a deleted origin sees only compact current name, kind, and unavailable context and cannot open its full deleted record.
- [ ] An Admin can restore a Template when its Product association slot remains available and can restore an Implementation when its Variant and typification constraints remain available.
- [ ] A restoration conflict identifies and links the occupying Bill of Materials without overwriting, deleting, or reassigning either record.
- [ ] Soft deletion and restoration remain available when a related Product or Product Variant is itself soft-deleted.
- [ ] An existing non-deleted Bill of Materials remains editable when its Product or Variant is Inactive but becomes read-only when that related record is soft-deleted.
- [ ] Product or Variant inactivity and soft deletion preserve all permanent Bill of Materials relationships and never cascade deletion.
- [ ] Deleting a Bill of Materials open in another Builder causes its later Save to fail without implicit restoration or partial mutation.
- [ ] Concurrent delete, restore, association, occupancy, and typification constraints are enforced atomically.
- [ ] Focused API functional, catalog, and Builder-route tests cover roles, confirmations, descendant lineage, slot release, restore conflicts, related-record availability, read-only behavior, and concurrent operations.
