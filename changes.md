# Product Working List

This slice turns `/app/products` from a create-only landing page into a real working list. The page still opens with the same high-level product-management framing, but the main card now behaves like an operational table: it loads the visible product set once, keeps that list ordered newest first, and lets the user retrieve records without another round-trip to the API.

## Start at the list contract

The first change was to make the product-summary contract explicit enough for the list UI. `ProductSummary` now carries a nullable `productCategory`, and the API serializer returns that field consistently even though the current slice still treats every persisted product as uncategorized. That keeps the web list honest about the "No category" state the issue requires and gives the route test a stable shape to assert against.

## Move retrieval into the page

Inside [`apps/web/src/features/products/product-management-page.tsx`](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/features/products/product-management-page.tsx), the page now derives a client-side working set from the loaded products query.

The flow is intentionally simple:

1. Load the visible product list and collection reference data.
2. Sort the loaded products newest first by `createdAt`.
3. Apply the product-name search term.
4. Apply one selected value for each filter: lifecycle status, product status, product category, and collection.

The search input is now visually first and prominent, because name lookup is the primary retrieval path in the issue. The filter row stays single-select and includes the explicit `No category` and `No collection` options called out by the acceptance criteria.

## Compact the table surface

The table was also reshaped to match the compact-list requirement:

- The product column now groups the product name with compact badges for collection context and category state.
- The state column combines lifecycle status and product status badges in one place.
- The created column keeps `Created by` and `Created at` together.
- The final column keeps the short product ID visible but subdued.

This keeps the scan path short while still exposing the operational context the PRD asked for.

## Make empty states reflect the user’s intent

There are now two different empty experiences:

- If there are no products at all, the page keeps the original registration-oriented empty state.
- If products exist but the current search and filters eliminate them, the page shows a filtered-result empty state and offers a one-click reset for the current retrieval controls.

That distinction matters because "nothing exists yet" and "nothing matches what I asked for" are different user situations.

## Verification

The main web proof lives in [`apps/web/src/routes/-products.test.tsx`](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/routes/-products.test.tsx):

- create flow still works and inserts the new row immediately
- explicit lifecycle and product-status overrides still submit correctly
- the list renders newest first
- search narrows by product name
- single-select category and collection filters work, including `No category` and `No collection`
- the filtered empty state appears and can be cleared

On the API side, [`apps/api/tests/functional/products/create_products.spec.ts`](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/tests/functional/products/create_products.spec.ts) now also asserts the product-summary category field and newest-first ordering. The direct TypeScript checks passed for `apps/web`, `apps/api`, `packages/shared-types`, and `packages/shared-validation`.
