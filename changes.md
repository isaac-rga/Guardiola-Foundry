# Deleted Product page states and normal missing-record handling

This slice completes issue 08 by teaching direct Product routes to distinguish between three different outcomes:

- an active Product that can still be edited
- a deleted Product that should stay visible but read-only
- a Product ID that does not exist at all and should stay on the normal not-found path

## Start at the Product read contract

The first change is the shared read shape for `GET /products/:productId`.

[packages/shared-types/src/index.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/packages/shared-types/src/index.ts) now defines `GetProductResponse` as a discriminated union instead of a single always-editable payload:

- `state: 'active'` returns the editable Product detail plus collections
- `state: 'deleted'` returns a deleted Product detail with `deletedAt`

[packages/shared-validation/src/index.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/packages/shared-validation/src/index.ts) mirrors that union in Zod, so both the API and the web client validate the same active-versus-deleted distinction.

That contract change is what lets the route behave differently without guessing from a generic error.

## Follow the deleted-record branch in the API

[apps/api/app/modules/products/products_service.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/app/modules/products/products_service.ts) now reads Products with deleted rows included when the request is for one specific Product page.

The important behavior is:

- unknown Product IDs still return `'not-found'`
- deleted Products now return `state: 'deleted'` instead of falling through the same not-found path
- active Products still return the editable detail payload and collections

That required a small fix in [apps/api/app/mixins/soft_delete.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/app/mixins/soft_delete.ts). The soft-delete escape hatch now bypasses the hidden-by-default hooks without converting results into POJOs, so deleted-aware reads still get real Lucid models with dates and relations intact.

From there, [apps/api/tests/functional/products/create_products.spec.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/tests/functional/products/create_products.spec.ts) verifies the direct route contract:

1. delete a Product
2. fetch it again by short id
3. assert `state: 'deleted'`
4. fetch a made-up Product id
5. assert the normal `404 Product not found.`

## Walk the Product page states in the web app

[apps/web/src/lib/api/products.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/lib/api/products.ts) now parses the new shared union, and [apps/web/src/features/products/product-edit-page.tsx](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/features/products/product-edit-page.tsx) uses that state to render the correct screen.

There are now three route outcomes for `/app/products/$productId`:

### 1. Active Product

The existing edit page still appears for active records. Save, delete, image upload, duplicate-name warnings, and metadata all behave the same as before.

### 2. Deleted Product

Deleted records now render a dedicated page state instead of the editable form.

What the reader should notice in that state:

- the page still shows the Product identity and metadata
- the record explains that it has been removed from normal Product views
- there is no editable form, save action, or delete action
- the page is explicitly read-only until a later recovery slice adds restore behavior

The message also depends on the signed-in user:

- admins are told that recovery behavior will arrive in a later slice
- non-admin users are told that an admin is required for recovery

### 3. Nonexistent Product

If the Product id does not exist at all, the page still shows the normal error path. That keeps true missing records distinct from deleted-but-preserved ones.

## End at the regression seams

[apps/web/src/routes/-products.test.tsx](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/routes/-products.test.tsx) now covers the user-visible route behaviors that issue 08 asked for:

- admins see a deleted Product page state with no editable controls
- non-admin users see the removed-record message that says an admin is required for recovery
- missing Product ids still render the normal not-found alert

The existing edit-page, delete, and image tests were also updated to use the new active-record response shape so the route file exercises the current API contract end to end.

## Verification

Verified implementation against TanStack Router and TanStack Query current docs via Context7 for the route/component and query-cache seams, and against the current AdonisJS app behavior in local tests.

Verification run for this slice:

- `./node_modules/.bin/oxlint src` in `packages/shared-types`
- `./node_modules/.bin/oxlint src` in `packages/shared-validation`
- `./node_modules/.bin/oxlint src` in `apps/web`
- `./node_modules/.bin/eslint app/mixins/soft_delete.ts app/modules/products/products_service.ts tests/functional/products/create_products.spec.ts` in `apps/api`
- `./node_modules/.bin/tsc --noEmit` in `packages/shared-types`
- `./node_modules/.bin/tsc --noEmit` in `packages/shared-validation`
- `./node_modules/.bin/tsc -b --pretty false` in `apps/web`
- `./node_modules/.bin/tsc -b --pretty false` in `apps/api`
- `./node_modules/.bin/vitest run src/routes/-products.test.tsx` in `apps/web`
- `./node_modules/.bin/vitest run` in `apps/web`
- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH CI=true node ace.js test functional --files tests/functional/products/create_products.spec.ts` in `apps/api`
- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH CI=true node ace.js test` in `apps/api`

Scope note:

- the deleted Product page is intentionally read-only in this slice; actual restore controls remain for the follow-up deleted-filter and restore workflow issue.
