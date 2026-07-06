# Duplicate-name warnings and mutation feedback

This slice finishes the warning-only duplicate-name behavior for Product create and edit, and it makes the existing Product mutations feel more explicit while they are running and after they complete.

## Start with the shared duplicate-name rule

The new helper in [apps/web/src/features/products/utils/product-name-warning.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/features/products/utils/product-name-warning.ts) defines the matching rule once for the web app:

- trim only the edges of the entered name
- compare case-insensitively
- optionally exclude the current Product when editing

That keeps the create modal and the Product page aligned instead of letting each screen drift into slightly different warning semantics.

## Show the warning where the user is already working

[apps/web/src/features/products/product-management-page.tsx](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/features/products/product-management-page.tsx) now watches the create-form name field against the already loaded Product list. When the user types a matching active Product name, the modal shows a warning under `Product name`, but the submit path stays open.

The same rule now powers [apps/web/src/features/products/product-edit-page.tsx](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/features/products/product-edit-page.tsx). The edit page loads the Product list query alongside the detail query, ignores the current Product ID, and shows the same live warning while the user types.

The important behavior here is intentionally narrow:

- warnings are informative only
- neither create nor save is blocked
- existing saved-name trimming still comes from the request schema and model layer

## Make create and save feel explicit while requests are running

This issue also tightens feedback around the Product mutations that already exist.

On the create modal:

- the name input, selects, and cancel action disable while the request is pending
- the dialog shows visible pending copy during creation
- the list shows a lightweight success confirmation after the modal closes

On the Product edit page:

- save and back actions disable while save is in flight
- editable fields and image controls disable during the request
- the page shows visible pending copy during save
- the existing lightweight success confirmation remains visible after completion

That keeps the workflow explicit without introducing toasts or new mutation endpoints.

## Verify the behavior at the accepted seams

[apps/web/src/routes/-products.test.tsx](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/routes/-products.test.tsx) now covers the user-visible route behavior for this slice:

1. create shows disabled pending state and success feedback
2. create warns on duplicate names without blocking submission
3. edit shows disabled pending state and success feedback
4. edit warns on duplicate names without blocking save

[apps/api/tests/functional/products/create_products.spec.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/tests/functional/products/create_products.spec.ts) adds the backend regression that proves duplicate Product names are still accepted after trimmed, case-insensitive normalization.

Verification run for this slice:

- `node node_modules/vitest/vitest.mjs run src/routes/-products.test.tsx` in `apps/web`
- `node ace.js test functional --files tests/functional/products/create_products.spec.ts` in `apps/api`

Typecheck note:

- `pnpm typecheck` in `apps/web` and `apps/api` attempted to recreate workspace `node_modules` and then stalled on blocked registry access in this environment, so I did not get a clean typecheck result from those scripts.
