# Product Domain And Create Workflow

This slice completes `.scratch/product-management/issues/01-establish-the-product-domain-and-create-workflow.md`.

The branch started with only a shell-level `/app/products` placeholder. This change turns that route into the first real Product workflow and establishes the Product seam the later product-management issues can build on.

If you are reviewing the patch, read it in this order.

## 1. Shared contracts define the Product seam once

Start with:

- `packages/shared-types/src/index.ts`
- `packages/shared-validation/src/index.ts`

This slice introduces the Product language that both apps now share:

- `ProductLifecycleStatus`
- `ProductStatus`
- `ProductCollection`
- `ProductSummary`
- `ListProductsResponse`
- `CreateProductRequest`

The important decision here is that the create path stays small without staying vague. The contract now makes the defaults explicit:

- `Lifecycle Status` defaults to `concept`
- `Product Status` defaults to `active`

It also establishes the durable record shape that later list and edit work can keep using:

- short stable `Product ID`
- immutable `Created by`
- immutable `Created at`
- optional `Collection`

That keeps the domain vocabulary in one place instead of letting the API and web invent separate Product models.

## 2. The API now owns real Product persistence instead of placeholder route copy

Then read:

- `apps/api/database/migrations/1783341000000_create_collections_table.ts`
- `apps/api/database/migrations/1783341000500_seed_collections_table.ts`
- `apps/api/database/migrations/1783341001000_create_products_table.ts`
- `apps/api/app/models/collection.ts`
- `apps/api/app/models/product.ts`
- `apps/api/app/modules/products/products_service.ts`
- `apps/api/app/modules/products/controllers/products_controller.ts`
- `apps/api/start/routes.ts`

This is the backend seam for the first Product workflow.

The migrations add two tables:

- `collections` as controlled reference data, prefilled with annual tags
- `products` as the new Product register

`products_service.ts` keeps the logic intentionally small:

- list products newest first
- create a Product with persisted defaults when the request omits statuses
- allow explicit lifecycle and product-status overrides
- validate optional collection linkage
- generate a short stable public Product ID in the form `P-XXXXXX`
- serialize immutable creation metadata from the authenticated user

The controller does not introduce a broad auth abstraction. It reuses the existing bearer-token flow, authenticates the request, validates the shared create payload, and returns either:

- `200` for list
- `201` for create
- `401` for unauthenticated access
- `422` for invalid payloads or a missing collection reference

That is enough to establish the Product domain seam without dragging in edit, delete, or workflow-transition logic from later issues.

## 3. `/app/products` is now a real working surface

Then read:

- `apps/web/src/lib/api/products.ts`
- `apps/web/src/features/products/product-management-page.tsx`
- `apps/web/src/routes/app.products.tsx`

The route no longer renders shell placeholder copy. It now renders a real Product page with two responsibilities:

- load the persisted Product register
- create a Product from a lightweight modal

The modal stays aligned with the PRD’s first-slice rule:

- `Product name` is required
- `Lifecycle Status` is editable but defaults to `Concept`
- `Product Status` is editable but defaults to `Active`

`Collection` is established in the domain and API, but it is not pushed into this lightweight modal yet. That keeps issue 01 scoped to fast registration instead of starting list/filter/reference-data UI work early.

After a successful create:

- the modal closes
- the form resets to its defaults
- the new Product is inserted at the top of the local query cache
- the working list shows the new persisted row immediately

The list itself is deliberately modest in this slice. It shows the newly established Product metadata without trying to pre-implement the full search-and-filter table from issue 02.

## 4. The tests cover both the persisted seam and the route seam

Then read:

- `apps/api/tests/functional/products/create_products.spec.ts`
- `apps/web/src/routes/-products.test.tsx`
- `apps/web/src/routes/-app.test.tsx`

The API test covers the persistence contract:

- create with only `name` persists `concept` and `active`
- Product IDs are short and stable in the API response
- created metadata comes from the authenticated user
- list results are returned newest first with the seeded collection reference data
- lifecycle, product-status, and collection overrides persist correctly

The web route test covers the user-facing create flow:

- the create modal opens from `/app/products`
- submitting only a product name sends the default statuses
- explicit lifecycle and product-status overrides are submitted when selected
- the new Product appears in the working list immediately after success

`-app.test.tsx` also now treats `/app/products` as a live route instead of a placeholder route, which keeps the shared shell suite aligned with the current UI.

## 5. Verification

The checks for this slice were:

- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH ./node_modules/.bin/tsc -p tsconfig.json` in `packages/shared-types`
- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH ./node_modules/.bin/tsc -p tsconfig.json` in `packages/shared-validation`
- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH ./node_modules/.bin/tsc --noEmit` in `apps/api`
- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH ./node_modules/.bin/eslint app/modules/products app/models/collection.ts app/models/product.ts tests/functional/products/create_products.spec.ts database/migrations/1783341000000_create_collections_table.ts database/migrations/1783341000500_seed_collections_table.ts database/migrations/1783341001000_create_products_table.ts start/routes.ts --ignore-pattern 'database/schema.ts'` in `apps/api`
- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH CI=true node ace.js test functional` in `apps/api`
- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH ./node_modules/.bin/oxlint src` in `apps/web`
- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH ./node_modules/.bin/tsc -b --pretty false` in `apps/web`
- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH ./node_modules/.bin/vitest run --reporter=verbose` in `apps/web`

## 6. Technical debt

- The product route tests still need a few jsdom compatibility shims for the Radix Select interaction path. The assertions are passing, but the test file is carrying environment-level glue that would be better centralized if more select-heavy route tests arrive.
- Collection reference data is seeded with a minimal annual set to establish the controlled-data seam. If the business already has a canonical collection catalog, a later slice should move those values from migration defaults into a clearer source of truth.
