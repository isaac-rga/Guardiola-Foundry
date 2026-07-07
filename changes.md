# Product soft delete and hidden-by-default behavior

This slice completes issue 07 by adding a real Product delete flow, implementing it as soft delete in the API, and making deleted Products disappear from the normal working list by default.

## Start at the persistence layer

The backend now records deletion instead of removing Product rows outright.

[apps/api/database/migrations/1783389321000_add_product_soft_delete_to_products_table.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/database/migrations/1783389321000_add_product_soft_delete_to_products_table.ts) adds a nullable `deleted_at` timestamp.

From there, the delete behavior is implemented natively in Lucid instead of through a third-party addon:

- [apps/api/app/mixins/soft_delete.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/app/mixins/soft_delete.ts) defines a small reusable soft-delete mixin
- [apps/api/app/models/product.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/app/models/product.ts) composes that mixin into `Product`

That gives the Product module a recoverable delete marker without introducing hard delete behavior anywhere in the user workflow.

## Follow the Product visibility rule through the model

[apps/api/app/mixins/soft_delete.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/app/mixins/soft_delete.ts) is where the hidden-by-default behavior now lives.

The important changes are:

- the mixin registers Lucid `beforeFind` and `beforeFetch` hooks that automatically add `whereNull('deleted_at')` to ordinary Product reads
- `Product` gets `softDelete()` and `restore()` instance methods, so the delete state change belongs to the model instead of being repeated in services
- [apps/api/app/modules/products/products_service.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/app/modules/products/products_service.ts) can now use normal Product queries for list, show, update, and delete

This keeps the behavior aligned with the issue wording: delete is stronger than ordinary inactivity, but it is still recoverable in the data model.

There is one explicit escape hatch: `queryWithDeleted()`. The Product service uses it only where deleted rows still matter internally, such as checking generated short IDs against the full table. The API regression test verifies the persisted soft-delete state directly against the `products` table so the default model hook stays intact.

## Wire the delete endpoint

[apps/api/app/modules/products/controllers/products_controller.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/app/modules/products/controllers/products_controller.ts) now exposes a `destroy` action, and [apps/api/start/routes.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/start/routes.ts) registers `DELETE /products/:productId`.

The controller keeps the existing pattern for auth and not-found handling:

- unauthorized requests still get `401`
- deleting an unknown or already deleted Product returns `404`
- a successful delete returns `204 No Content`

## Walk the user flow from the Product page back to the list

The delete workflow starts on the Product page in [apps/web/src/features/products/product-edit-page.tsx](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/features/products/product-edit-page.tsx).

What changed there:

- the header now includes a confirmation-based `Delete` action
- delete calls the new `DELETE` API through [apps/web/src/lib/api/products.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/lib/api/products.ts)
- while delete is in flight, the page disables the same controls that already disable during save
- after success, the cached Product list removes the deleted row and navigation returns the user to `/app/products`

The redirect carries lightweight confirmation feedback through route search state. That is wired in:

- [apps/web/src/routes/app.products.tsx](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/routes/app.products.tsx)
- [apps/web/src/routes/app.products.index.tsx](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/routes/app.products.index.tsx)
- [apps/web/src/features/products/product-management-page.tsx](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/features/products/product-management-page.tsx)

The list page now reads an optional `deletedProductName` search param, shows `Deleted <name>.`, and lets the user dismiss that message without disturbing the rest of the list state.

## End at the regression seams

Two focused tests prove the accepted behavior at the agreed boundaries.

[apps/api/tests/functional/products/create_products.spec.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/tests/functional/products/create_products.spec.ts) now verifies that deleting a Product:

- keeps the row in the database
- forces `Product Status = Inactive`
- stamps `deletedAt`
- removes the Product from the default list response

[apps/web/src/routes/-products.test.tsx](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/routes/-products.test.tsx) now verifies the user-visible route behavior:

1. the Product page asks for confirmation before delete
2. the page issues `DELETE /products/:productId`
3. the user returns to the Product list after success
4. the list shows the delete confirmation and no longer shows the deleted Product

Verification run for this slice:

- `./node_modules/.bin/tsc -b --pretty false` in `apps/web`
- `./node_modules/.bin/tsc -b --pretty false` in `apps/api`
- `./node_modules/.bin/vitest run src/routes/-products.test.tsx` in `apps/web`
- `./node_modules/.bin/vitest run` in `apps/web`
- `node ace.js test functional --files tests/functional/products/create_products.spec.ts` in `apps/api`
- `node ace.js test` in `apps/api`

Scope note:

- deleted Products currently resolve as normal not found in the direct Product route; the dedicated deleted-record page state and restore workflow remain for issues 08 and 09.
