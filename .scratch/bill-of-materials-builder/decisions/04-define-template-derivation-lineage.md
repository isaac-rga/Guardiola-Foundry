# Define BOM Template derivation and lineage

Type: grilling
Status: resolved
Blocked by: 01

## Question

What origin metadata, graph constraints, naming behavior, and later deletion rules preserve useful lineage when one independently evolving BOM Template is derived by copying another?

## Answer

- Every permitted copy from one Bill of Materials to another is a BOM Derivation and records the source as its BOM Origin. Only a manually authored BOM has no origin; copied content cannot be presented as an untracked duplicate.
- BOM Origin is an optional, singular reference to the immediate source BOM. It is assigned only when the derived BOM is created and cannot later be added, changed, or removed.
- Derivation chains may grow without an artificial depth limit. A source must already exist when its destination is created, and the immutable immediate-origin relationship must remain acyclic so that no BOM can directly or indirectly originate from itself.
- Each BOM stores only its immediate origin. A root, derivation depth, duplicated list of descendants, and line-level lineage are not stored; direct descendants are found through their own origin references, and a longer chain is traversed one immediate origin at a time.
- Every Bill of Materials records immutable Created By and Created At metadata. For a derived BOM these identify who performed the derivation and when, without separate derivation-specific author or timestamp fields.
- Derivation atomically copies the source's current description and BOM Lines. The destination receives its own identity and independently owned line identities, preserves their relative order and copied values, and starts every copied line Unverified.
- The destination's permanent kind, required name, and Product or Product Variant relationships follow the destination-kind rules rather than being copied from the origin. Derivation never changes the source's kind.
- A derived BOM Template is offered the editable name `<current origin name> — copy`. Template names may repeat; a case-insensitive match may warn the user but does not block creation, and later origin renames never synchronize into the destination name.
- When creating a Template from an associated Template or an Implementation, the origin's Product is only a creation-time association suggestion. If that Product cannot accept the association, the new Template is created unassociated; the unassociated result may later become permanently associated with any eligible Product, including a different Product.
- Cross-Product reuse through independently owned derived Templates is allowed and is distinct from sharing one live Template across Products.
- BOM Origin is informational after creation. It does not restrict editing, association, or use of the derived BOM, and there is no refresh, synchronization, merge, or reapplication operation between source and destination. Starting again from the source creates another independently identified BOM.
- Lineage does not promise a historical comparison or reconstruction. The system retains no snapshot of the origin's former name, metadata, or content and no correspondence between source and copied lines; it shows the origin's current name, kind, and availability state instead.
- Soft-deleting any BOM in a derivation chain neither cascades to nor changes its origins, descendants, or siblings. Existing origin references remain navigable and identify unavailable origins; restoring an origin also leaves every descendant unchanged.
- A soft-deleted BOM cannot be the source of a new derivation until restored. Physical deletion of a referenced BOM is not available in the first delivery.
- A non-deleted BOM remains eligible as the source of a new unassociated Template even when its related Product or Product Variant is inactive or soft-deleted. An unavailable suggested Product cannot receive the association, but the new Template may remain unassociated or use another eligible Product.
