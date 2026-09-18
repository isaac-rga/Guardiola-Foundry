# 11 — Update a whole Bill of Materials safely

**What to build:** Let Users update Templates and Implementations through the same Construction Board without partial saves or silent concurrent overwrites. The whole draft remains local until explicit Save, and conflicts preserve the User's work for deliberate recovery.

**Blocked by:** 10 — Create manual BOM Implementations.

**Status:** complete

- [x] An Admin or Operator can open an available Template or Implementation in the same Builder used for creation.
- [x] Editable metadata, BOM Lines, additions, permanent removals, Line Notes, order, Material Quantity, Pattern Set, and verification persist through one explicit Save.
- [x] Identity, permanent kind, BOM Origin, Created By, Created At, Implementation Product Variant, and assigned Template Product remain immutable.
- [x] A structural or field validation failure leaves the previously saved Bill of Materials unchanged and preserves the local draft.
- [x] Attempting to leave with unsaved changes requires choosing whether to continue editing or discard the draft.
- [x] Every persisted Bill of Materials or BOM Line change advances a server-owned update marker.
- [x] Saving with a stale update marker is blocked rather than merged or forced over newer data and offers a path to reload the current saved version.
- [x] A Bill of Materials soft-deleted while open rejects a later stale Save and is never restored implicitly.
- [x] Live Material, Source, cost, or Pattern Set projection changes do not advance the Bill of Materials update marker or create an editing conflict.
- [x] A successful Save returns canonical current projections and replaces local previews.
- [x] Concurrent update tests prove that only the first valid Save mutates the record and that the losing Save leaves no partial line or order changes.
- [x] Focused API functional and Builder-route tests cover both kinds, atomic updates, removals, immutable fields, navigation protection, stale conflicts, draft preservation, projection freshness, and deleted-record conflicts.
