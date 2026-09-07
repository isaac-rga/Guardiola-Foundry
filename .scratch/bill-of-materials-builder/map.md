# Find the way to the Bills of Materials Builder

Label: wayfinder:map

## Destination

Resolve the domain and product decisions needed to describe a Bills of Materials Builder that creates and updates BOM Templates and concrete BOM Implementations for Product Variants. The completed map should be sufficient to author an implementation PRD and its issue set without leaving foundational model or workflow decisions implicit.

## Notes

- Work this map one decision ticket at a time with the `grilling` and `domain-modeling` skills; use `prototype` for the Builder and catalog interaction tickets.
- This map plans the route. It does not publish the implementation PRD, create implementation issues, or build production code.
- The established language lives in [`CONTEXT.md`](../../CONTEXT.md): `BOM Template`, `BOM Implementation`, `BOM Line`, `Pattern Set`, and `Product Variant`.
- A BOM Template may be associated with one Product, and the product experience should strongly recommend that association without requiring it.
- Creating a Template from another Bill of Materials produces an independent copy with its own identity and recorded origin; it does not change the source BOM's kind or propagate later edits.
- Template and Implementation use one discriminated Bill of Materials model with a permanent kind and strict kind-specific relationships: a Template has no Product Variant and may have a Product, while an Implementation requires a Product Variant and does not duplicate its Product relationship.
- Every Bill of Materials has its own stable identity, required display name, optional description, and independently owned BOM Lines. Copying a BOM creates new BOM Lines rather than sharing them with the origin.
- A BOM Implementation's required name is its manually assigned BOM Typification, while the current commercial name of its Product Variant is displayed separately and remains live.
- BOM Typification is required when an Implementation is created and remains editable without changing its Product Variant.
- Template and Implementation share one optional, immutable BOM Origin pointing to the immediate BOM from which they were copied; manually authored BOMs have no origin.
- An unassociated Template is valid but cannot create an Implementation until it is associated with the destination Variant's Product. An associated Template can only be applied to Variants of that Product; creating a Template from an Implementation proposes that Product association but allows removing it.
- The first delivery is Materials-only. Supplies remain a separate future concern.
- One Builder should support both create and update. Resolve that Builder before the surrounding CRUD/catalog experience.
- A Pattern Set may expose live width-based quantity suggestions in the Builder, but each BOM Line persists only its Pattern Set reference and independently decided Material Quantity. Automatic meter calculation and proposal history are not required in the first delivery.
- BOM Lines persist Material rather than Source or cost evidence. Material cost is a live MXN projection from the current or retained Preferred Source relationship, and unavailable catalog references remain usable with non-blocking line-level attention.
- The existing Sources workflow can currently remove Landed Unit Cost from a Preferred Source despite the established invariant. The BOM must handle that condition defensively, while the invariant remains owned and must be corrected by Sources.
- Bills of Materials have no separate lifecycle status in the first delivery. Soft deletion alone controls availability, releases exclusive Product relationships, and preserves independently evolving lineage.
- The Builder creates and updates a complete Bill of Materials through explicit atomic saves with stale-edit protection; it exposes only contextually valid actions rather than requiring users to learn the underlying mutation rules.
- Existing spreadsheet compositions may be used as fixtures, but importing or migrating them is not part of this effort.

## Decisions so far

- [Decide the invariants of BOM Templates and BOM Implementations](issues/01-decide-template-and-implementation-invariants.md) — Use one discriminated BOM model with permanent kinds, independent copied lines, strict kind-specific Product or Product Variant relationships, optional immutable origin, and a separately stored manual BOM Typification for Implementations.
- [Define the relationship between Product Variants and Bills of Materials](issues/02-define-product-variant-bom-relationship.md) — A Product owns permanent Variants, at most one associated Template, and at most one non-deleted Implementation per Variant; availability, uniqueness, deletion, and restoration preserve those relationships without cascades.
- [Define how BOM Lines resolve from Template to Implementation](issues/03-define-bom-line-resolution.md) — Template and Implementation share independently owned ordered lines whose Construction Piece, optional Material, meter quantity, completeness, copying, and per-line verification follow explicit rules without automatic calculation or line-level lineage.
- [Define BOM Template derivation and lineage](issues/04-define-template-derivation-lineage.md) — Every BOM copy atomically creates an independent destination with immutable immediate origin, acyclic traversable lineage, destination-specific naming and relationships, and references that survive soft deletion without propagation or historical snapshots.
- [Define the Pattern Set boundary for the first delivery](issues/05-define-pattern-set-boundary.md) — Pattern Sets are globally reusable Active or Retired catalog references with optional live width-based quantity suggestions; BOM Lines retain only an optional Pattern Set and their final quantity, while retirement preserves existing use with a non-blocking line-level attention signal.
- [Decide Material, Source, and cost behavior in Bills of Materials](issues/06-decide-material-source-and-cost-behavior.md) — BOM Lines retain Material but no Source or cost snapshot; line and aggregate material costs are current derived MXN projections, while unavailable Material or sourcing data remains usable with independent non-blocking attention and partial-cost semantics.
- [Define Bill of Materials lifecycle and mutation rules](issues/07-define-bom-lifecycle-and-mutations.md) — Bills of Materials use reversible soft deletion without a separate lifecycle status; explicit atomic Builder saves, immutable structural relationships, stale-edit protection, non-cascading lineage, and role-specific deletion recovery govern their mutations.
- [Prototype the shared create and update BOM Builder](issues/08-prototype-shared-bom-builder.md) — Use the Variant B Construction Board with focused line editing, drag-handle ordering, searchable Material and Pattern Set catalogs, on-demand quantity proposals, primary line verification, and a separate Whole BOM summary; defer construction groups and production catalog-query dependencies.

## Not yet specified

- [Define the large-catalog search boundary for the BOM Builder](issues/10-define-large-catalog-search-boundary.md) — Resolve production query ownership, matching, result projections, pagination or virtualization, caching, lifecycle, stale-selection, loading, failure, recovery, and accessibility behavior for Material and Pattern Set selection.
- Acceptance boundaries and the later PRD/implementation-issue handoff after the interaction prototypes are approved.

## Out of scope

- Automatic Pattern Set meter calculation in the first delivery; Pattern Sets may propose a quantity while the BOM Implementation records the final quantity.
- Product Specification and commercial-specification management; Product Variant only preserves a future relationship seam.
- Historical Product Variant or BOM revisions, change-history UI, and audit reconstruction.
- Supplies and other non-textile inputs in the first delivery.
- Importing or migrating existing spreadsheet compositions.
- Inventory allocation, purchasing, production orders, and manufacturing execution.
- Cross-Product shared Templates and live propagation from an origin Template into derived Templates.
- Construction groups or nested organization of BOM Lines; the first delivery retains one flat ordered Construction Board unless a later decision ticket brings grouping back into scope.
- Publishing the PRD, creating implementation issues, or implementing the feature as part of this decision map.
