# Product Edit Page

This slice turns Products from a list-plus-create workflow into a real two-surface module. `/app/products` stays the working list, but each Product now has its own direct route at `/app/products/$productId`, and that page is where the first real editing workflow lives.

## Start with the route shape

The first important change is structural rather than visual. The old [`apps/web/src/routes/app.products.tsx`](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/routes/app.products.tsx) route rendered the list page directly, which meant a nested detail route would never appear. This slice converts `/app/products` into a layout route with an `Outlet`, moves the list UI into [`apps/web/src/routes/app.products.index.tsx`](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/routes/app.products.index.tsx), and adds [`apps/web/src/routes/app.products.$productId.tsx`](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/routes/app.products.$productId.tsx) for direct Product-page loading.

That route split is what makes browser refresh, deep links, and short-ID navigation work without bolting detail behavior onto the list page.

## Add the missing Product contract

The earlier slice only needed Product summaries for the list. The edit page needs more:

- direct lookup by short `Product ID`
- mutable optional fields for `Product Category`, `Short product description`, and `Collection`
- an explicit update request shape
- immutable metadata returned with the detail payload

Those additions land in [`packages/shared-types/src/index.ts`](/Users/isaacruiz/Development/gub/Guardiola-Foundry/packages/shared-types/src/index.ts) and [`packages/shared-validation/src/index.ts`](/Users/isaacruiz/Development/gub/Guardiola-Foundry/packages/shared-validation/src/index.ts). The validation rules now make `Product name` required for saves, while still allowing the optional fields to round-trip as `null`.

## Persist the editable fields in the API

The backend needed real storage before the page could exist. A new migration adds nullable `product_category` and `short_description` columns to `products`, and the Product model now normalizes text at the edge so saved values stay trimmed.

From there, the Product module grows from list/create into list/show/update:

1. `GET /products/:productId` loads one Product by short ID plus the available collection reference data.
2. `PUT /products/:productId` saves the editable first-slice fields explicitly.
3. The serializer now returns the real category and description values instead of hard-coded `null`s.

The core work lives in [`apps/api/app/modules/products/products_service.ts`](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/app/modules/products/products_service.ts) and [`apps/api/app/modules/products/controllers/products_controller.ts`](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/app/modules/products/controllers/products_controller.ts), with the routes wired in [`apps/api/start/routes.ts`](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/start/routes.ts).

## Build the explicit-save page

[`apps/web/src/features/products/product-edit-page.tsx`](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/features/products/product-edit-page.tsx) is the main user-facing slice.

The page is intentionally straightforward:

1. Load the Product directly by `Product ID`.
2. Reset the form from the saved record.
3. Let the user edit the agreed first-slice fields.
4. Save only when they click `Save changes`.
5. Warn before navigation if the form is dirty.

The form keeps the editable surface and metadata separate:

- editable fields: `Product name`, `Product Category`, `Short product description`, `Collection`, `Lifecycle Status`, and `Product Status`
- low-emphasis metadata: `Product ID`, `Created by`, and `Created at`

The save is explicit rather than reactive. Changing a field does nothing server-side until submit. After success, the page resets to the saved state, updates the cached list row, and shows lightweight confirmation feedback.

## Keep the list as the entry point

The list page still owns the working set, but each Product name is now a direct link into the dedicated Product page. That is the smallest change that turns the table into a real navigation surface without redesigning the list again in the same diff.

## Verification

The focused web proof is in [`apps/web/src/routes/-products.test.tsx`](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/routes/-products.test.tsx):

- list/create behavior from the earlier slice still works
- the Product page loads directly by short ID
- metadata is visible
- edits are not persisted until explicit save
- inline validation blocks empty `Product name`
- optional fields can be cleared back to `null`
- leaving with unsaved changes triggers a warning

The focused API proof is in [`apps/api/tests/functional/products/create_products.spec.ts`](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/tests/functional/products/create_products.spec.ts):

- short-ID detail loading returns immutable metadata and optional fields
- update persists the editable fields by short ID
- text is trimmed on save
- optional fields can be cleared back to `null`

Verification run for this slice:

- `node .../vitest.mjs run src/routes/-products.test.tsx`
- `node ace.js test functional --files tests/functional/products/create_products.spec.ts`
- direct TypeScript checks for `apps/web`, `apps/api`, `packages/shared-types`, and `packages/shared-validation`
