# Tighten the Product list row layout for density and scannability

Status: done

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

## Completion note

Shipped the product-list density pass entirely inside the existing `/app/products` table surface.

The list still shows the same Product data, filters, ordering, and row navigation, but each row now uses tighter spacing and a more compact vertical rhythm so the full row is easier to scan.

The correction to this slice was to keep the original information structure inside each cell while tightening the row layout. Product rows still retain their explicit `Status` and `Lifecycle` labels, the created-by and created-at pairing, and the `Stable short ID` helper text for the record identifier. The density improvement now comes from reduced spacing and better row-level alignment instead of from removing those cues.

Focused web coverage was extended in the route-level Products test so the compact row still has to render the same user-visible facts for a Product: collection/category badges, state badges, creator email, created date, and Product ID.

Follow-up work: none required for this slice.
