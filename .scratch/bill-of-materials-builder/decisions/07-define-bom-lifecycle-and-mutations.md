# Define Bill of Materials lifecycle and mutation rules

Type: grilling
Status: resolved
Blocked by: 02, 04, 05, 06

## Question

Which availability and mutation rules govern BOM Templates and BOM Implementations, and when are editing, deriving, restoring, or deleting each kind allowed after it has relationships or downstream use?

## Answer

- A Bill of Materials has no separate lifecycle status in the first delivery. It is available while non-deleted and unavailable when soft-deleted; no Active, Archived, Draft, Published, aggregate readiness, or approval state is introduced.
- A newly created Bill of Materials is available even when it has no lines or contains Incomplete, Unverified, or attention-bearing lines. Availability, BOM Line Completeness, BOM Line Verification, and attention conditions remain independent.
- A related Product or Product Variant becoming Inactive or soft-deleted does not soft-delete the Bill of Materials or change its permanent relationships. The related record's availability may restrict specific operations without cascading a mutation into the Bill of Materials.
- An existing non-deleted Bill of Materials remains editable when its related Product or Product Variant is Inactive. Inactivity prevents creation of new Product-bound relationships rather than maintenance of an existing Bill of Materials.
- A Bill of Materials whose related Product or Product Variant is soft-deleted is read-only until that related record is restored. While the Bill of Materials remains non-deleted, it retains the previously established exception allowing derivation of a new unassociated Template from it.
- The product experience should expose only contextually valid actions and explain a blocked action with its reason and next step rather than requiring users to learn the lifecycle rule set.
- Soft deletion preserves the Bill of Materials and lineage, releases its Product or Product Variant slot, prevents ordinary use, and does not cascade to origins or descendants.
- Soft deletion requires explicit confirmation showing the Bill of Materials name and related Product or Product Variant, and explaining that its exclusive relationship slot will be released. When descendants exist, the confirmation also shows their count and explains that they retain this Bill of Materials as their origin; it requires no typed-name confirmation.
- Restoring a soft-deleted Bill of Materials makes it available again.
- Soft-deleted Bills of Materials are excluded from ordinary lists and are available through a deleted-record filter or view as read-only records. Exact catalog placement remains for the interaction prototype.
- Restoration remains blocked when another non-deleted Bill of Materials occupies the Product or Product Variant slot or, for an Implementation, its BOM Typification conflicts within the Product. The conflict identifies and links to the current Bill of Materials without overwriting, deleting, or reassigning either record.
- A non-deleted Bill of Materials remains editable after it gains descendants. Its name or BOM Typification, description, and BOM Lines may change without blocking or propagating changes to independently evolving descendants.
- Bill of Materials identity, permanent kind, BOM Origin, Created By, Created At, Product Variant ownership, and any permanent Product association remain immutable.
- A Bill of Materials has no line-level archive or trash. Its Builder may add, edit, reorder, or remove BOM Lines; a removed line is permanently deleted when the Bill of Materials is saved, while the unsaved editing experience may offer undo.
- Create and update use an explicit Save action rather than field-level autosave. Bill of Materials metadata, lines, and line order are persisted atomically, so a structural validation failure leaves the prior saved Bill of Materials unchanged; Incomplete lines remain valid saved data.
- Attempting to leave the Builder with unsaved changes requires choosing whether to continue editing or discard those changes.
- Saving detects whether another user or session changed the Bill of Materials after it was loaded. A stale save is blocked rather than merged or forced over the newer data, and the user may reload the current saved version.
- Every Bill of Materials records its latest update timestamp in addition to immutable Created By and Created At metadata. Updated By, historical versions, per-line audit records, and a change-history interface are outside the first delivery.
- Any persisted change to Bill of Materials metadata, BOM Lines, line order, or BOM Line Verification updates its concurrency marker. Changes to live Material, Source, cost, or Pattern Set projections do not modify the Bill of Materials and therefore do not create an editing conflict.
- Soft deletion or restoration remains available when a related Product or Product Variant is soft-deleted, although content editing remains blocked until the related record is restored. This avoids requiring a particular restoration order without making the Bill of Materials usable outside its Product structure.
- Admin and Operator may create, edit, derive, and soft-delete available Bills of Materials. Browsing soft-deleted Bills of Materials and restoring them are restricted to Admin, following the existing Product-management boundary.
- When an Operator encounters a soft-deleted BOM Origin through retained lineage, the interface shows only a compact reference with its current name, kind, and deleted availability. Opening the complete soft-deleted Bill of Materials is restricted to Admin.
- Concurrent creation, association, or restoration operations that compete for one Product or Product Variant slot or for a unique BOM Typification are enforced atomically. Only the first valid operation succeeds; a conflicting operation leaves no partial changes and identifies the Bill of Materials that now occupies the relationship or typification.
- Soft-deleting a Bill of Materials while it is open in another Builder makes any later save from that stale Builder fail. Saving never restores a deleted record implicitly; the unsaved local changes may remain visible until the user leaves but cannot be persisted to that Bill of Materials.
- Opening a create Builder does not persist or reserve a Bill of Materials. The first explicit Save atomically creates the Bill of Materials with its required identity, kind-specific relationships, and current lines; leaving before that save creates no abandoned record and occupies no exclusive relationship slot.
