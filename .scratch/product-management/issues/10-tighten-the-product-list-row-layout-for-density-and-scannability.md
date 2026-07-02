# Tighten the Product list row layout for density and scannability

Status: ready-for-agent

## Parent

- [PRD](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/product-management/PRD.md)

## What to build

Refine the `/app/products` table row layout so the list is denser and easier to scan without changing the underlying Product-list behavior. Keep the same row data and actions, but reduce avoidable whitespace, tighten vertical rhythm, and present related details in a more compact arrangement that works across the supported viewport sizes.

## Acceptance criteria

- [ ] `/app/products` keeps the existing Product list data, ordering, filters, and row actions, but each Product row uses a denser layout with less avoidable whitespace and a tighter arrangement of secondary details.
- [ ] The updated row layout remains readable and scannable on supported desktop and smaller viewport sizes, with badges, metadata, and actions still clearly associated with the correct Product.
- [ ] Focused web tests verify the preserved row behavior and any user-visible layout contracts that can be asserted without overfitting to implementation details.

## Blocked by

- [02 - Ship the Product working list with search and filters](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/product-management/issues/02-ship-the-product-working-list-with-search-and-filters.md)
