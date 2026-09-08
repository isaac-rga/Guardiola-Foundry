# 12 — Apply a BOM Template to a Product Variant

**What to build:** Let Users turn an associated BOM Template into an independent BOM Implementation for an eligible Variant of that Product. The operation copies the Template's current composition atomically while preserving the Variant and BOM Typification rules of the destination.

**Blocked by:** 08 — Associate BOM Templates with Products; 10 — Create manual BOM Implementations; 11 — Update a whole Bill of Materials safely.

**Status:** ready-for-agent

- [ ] An associated, non-deleted Template exposes an action to create an Implementation for a Product Variant of its Product.
- [ ] An unassociated Template cannot create an Implementation until it is permanently associated with the destination Variant's Product.
- [ ] Candidate selection is restricted to Variants of the Template's Product and applies the normal Product, Variant, and occupancy eligibility rules.
- [ ] Applying a Template to an occupied Variant is blocked rather than overwriting, merging, or changing the existing Implementation.
- [ ] The User assigns the destination BOM Typification separately from the Variant's commercial name before Save.
- [ ] Save atomically creates a new Implementation identity, records the Template as immutable immediate BOM Origin, and copies the current description and ordered BOM Lines.
- [ ] Every copied BOM Line receives a new identity and independently owned Construction Piece, Material, Material Quantity, Pattern Set, Line Note, and relative order.
- [ ] Copied lines begin Unverified regardless of source verification and retain no line-level lineage or proposal history.
- [ ] The destination projects current sourcing and Pattern Set information rather than copying Source or cost evidence.
- [ ] The source Template remains unchanged and later edits to either Bill of Materials do not propagate.
- [ ] Any concurrent eligibility, typification, reference, or structural failure leaves no destination or partial copied lines and preserves the Builder draft.
- [ ] Focused API functional and Builder-route tests cover association requirements, candidate restriction, occupied Variants, atomic copying, new identities, reset verification, origin, independence, and failure rollback.
