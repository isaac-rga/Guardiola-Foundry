# Prototype the Bills of Materials catalog and CRUD entry points

Type: prototype
Status: resolved
Blocked by: 08

## Question

How should the Bills of Materials section list and distinguish Templates from Implementations, expose their Product, Product Variant, origin, and availability, and route create, edit, derive, restore, and delete actions into the shared Builder or focused confirmations?

## Captured prototype

- Branch: `prototype-bill-of-materials-builder`
- Run: `pnpm prototype:bom`
- Route: `/app/bills-of-materials?screen=catalog&variant=A`
- Variant A — Operational catalog: one searchable, filterable table mixing Templates and Implementations with compact context and row actions.
- Variant B — Product workspace: a Product-first view that places its one primary Template above the Implementations belonging to Product Variants, with unassociated Templates kept visible separately.

## Validated direction

- **Winner: Variant A — Operational catalog.** Templates and Implementations share one operational list rather than requiring the User to enter through a Product workspace. The Product-first Variant B remains on this throwaway branch only as comparison evidence.
- **Rejected: Variant C — Master detail.** It was removed from the active prototype after review.
- The page header introduces the Bills of Materials area and exposes one `Create BOM` menu with separate Implementation and Template actions.
- The summary shows total available BOMs with its Template and Implementation breakdown, BOMs without an associated Product Variant, and BOMs with at least one unverified line. The last two metrics do not repeat explanatory subtitles.
- The catalog searches name, ID, Product, Product Variant, and origin. It filters All, Templates, Implementations, and optionally includes soft-deleted records.
- The table follows the existing Sources catalog pattern for its Card, filter spacing, row density, numeric alignment, and horizontal overflow.
- Table columns are Bill of Materials name and ID, Type, Product context, immediate Origin, current material-cost projection, total and verified Lines, and contextual Actions. Availability is not a dedicated column; normal results exclude deleted records unless the User explicitly includes them.
- Creating an Implementation from the catalog first opens a searchable Product Variant dialog. Variants with an active Implementation are excluded. Deriving from a Template restricts the dialog to that Template's Product.
- The chosen Product Variant is required before entering the Builder, travels with the catalog route state, and appears there as immutable context. BOM Typification remains a separate manually entered BOM Name.
- Create, edit, and derive actions open the approved Variant B Construction Board Builder on the same route. Delete and restore use focused confirmations and simulated in-memory state only.
- The prototype is intentionally in-memory and does not define production loading, mutation, or large-catalog query behavior.

## Deferred production decisions

- Resolve the Material, Pattern Set, and Product Variant search boundary, result projections, pagination or virtualization, caching, stale selections, and recovery behavior in issue 10.
- Define detailed loading, failure, empty, permission, confirmation, and responsive behavior in the production specification without reopening the validated catalog direction.
