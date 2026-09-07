# Decide the invariants of BOM Templates and BOM Implementations

Type: grilling
Status: resolved
Blocked by: None

## Question

Which identity, ownership, data, and invariants are shared by BOM Templates and BOM Implementations, which differ by kind, and can one discriminated domain and persistence model enforce those differences without ambiguous nullable state?

## Answer

Use one discriminated Bill of Materials domain and persistence model. Every BOM has its own stable identity, required name, optional description, independently owned ordered BOM Lines, permanent kind, and optional immutable BOM Origin pointing to the immediate BOM from which it was copied.

The kind-specific invariants are:

- A BOM Template has no Product Variant. It may be associated with one Product, but that association is optional for the Template to exist.
- An unassociated Template cannot be applied until it is associated with the destination Product. An associated Template can only create Implementations for Variants of that Product.
- A BOM Implementation always belongs to one Product Variant and does not duplicate an independently editable Product relationship.
- An Implementation may be authored manually without an origin or copied from a Template with that Template recorded as its origin.
- Creating a Template from an Implementation or another Template creates a new Template with a new identity and records the source as its origin; it never changes the source BOM's kind.
- Copying any BOM creates new BOM Lines. Source and copy evolve independently without shared lines or live propagation.
- Every Implementation has a required, user-assigned, editable BOM Typification as its name. The current commercial Product Variant name is displayed separately and is not copied into or synchronized with that typification.
- Creating a Template from an Implementation proposes the Product reached through the Implementation's Variant, but the user may remove that optional association.

These exclusive relationship rules make the single discriminated model valid without treating unrelated nullable combinations as valid domain states. Detailed Variant cardinality, BOM Line resolution, lineage graph behavior, and lifecycle rules remain with their dedicated decision tickets.
