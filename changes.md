# Product Image Upload And Removal

This slice keeps Product image handling deliberately small and attached to the existing Product edit page. A Product can now carry one optional primary image, that image survives a reload because it is persisted with the Product record, and the same page can clear it back to a true no-image state.

## Start with the Product contract

The earlier Product detail contract had no way to describe image state. This slice adds a small `image` object to [`packages/shared-types/src/index.ts`](/Users/isaacruiz/Development/gub/Guardiola-Foundry/packages/shared-types/src/index.ts) and validates it in [`packages/shared-validation/src/index.ts`](/Users/isaacruiz/Development/gub/Guardiola-Foundry/packages/shared-validation/src/index.ts).

That is intentionally narrow:

- list rows still stay text-only
- the create modal still ignores images
- only the Product detail payload learns whether an image exists and what filename is currently saved

## Persist one saved image in the API

The storage side starts with [`apps/api/database/migrations/1783341003000_add_product_image_fields_to_products_table.ts`](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/database/migrations/1783341003000_add_product_image_fields_to_products_table.ts), which adds two nullable Product columns:

- the original filename shown back to the user
- the internal storage key used on disk

[`apps/api/app/models/product.ts`](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/app/models/product.ts) exposes those columns, and [`apps/api/app/modules/products/products_service.ts`](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/app/modules/products/products_service.ts) keeps the behavior simple:

1. save uploaded files under `apps/api/tmp/product-images`
2. replace the previous file when a new one is uploaded
3. clear both the stored file and database fields when the user removes the image
4. serialize the saved filename back through the Product detail response

The Product module still does not grow a general media system. It just manages one Product-owned file at the existing Product update seam.

## Accept multipart saves without splitting the workflow

The important controller change is in [`apps/api/app/modules/products/controllers/products_controller.ts`](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/app/modules/products/controllers/products_controller.ts). `PUT /products/:productId` now accepts multipart form data, validates an optional image file, normalizes the non-file fields back into the existing update schema, and passes a simple `removeImage` intent when the page is clearing the current file.

That keeps the request model aligned with the existing explicit-save page instead of introducing separate upload and delete endpoints just for this slice.

## Keep image changes on the existing Product page

[`apps/web/src/lib/api/products.ts`](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/lib/api/products.ts) now sends Product updates as `FormData`, which lets the page carry the usual edit fields plus an optional image file in one save request.

[`apps/web/src/features/products/product-edit-page.tsx`](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/features/products/product-edit-page.tsx) adds the user-facing behavior:

1. an upload control on the Product page
2. a visible current-image state area that shows whether the Product has no image, a selected pending upload, a saved filename, or a pending removal
3. `Remove image` and `Keep current image` actions that stay inside the same explicit-save flow
4. dirty-state tracking that now treats image selection and removal the same way it treats other unsaved Product edits

The result is still the same Product page workflow: edit fields, decide what should happen to the image, and persist everything only when `Save changes` is clicked.

## Verification

The focused API regression lives in [`apps/api/tests/functional/products/create_products.spec.ts`](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/tests/functional/products/create_products.spec.ts). It proves:

- a Product image can be uploaded through the Product update route
- saved image state is returned again on a follow-up load
- remove-to-empty clears the Product back to `image: null`

The focused web regression lives in [`apps/web/src/routes/-products.test.tsx`](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/routes/-products.test.tsx). It proves:

- Product saves now submit multipart data
- the edit page shows saved image state after upload
- a reload still shows the persisted saved filename
- removing the image returns the page to the empty state

Verification run for this slice:

- `pnpm build` in `packages/shared-types`
- `pnpm build` in `packages/shared-validation`
- `node ace.js test functional --files tests/functional/products/create_products.spec.ts`
- `node node_modules/vitest/vitest.mjs run src/routes/-products.test.tsx`
- `pnpm typecheck` in `apps/api`
- `pnpm typecheck` in `apps/web`
