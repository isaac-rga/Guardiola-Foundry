# Introduce Product data hooks and cache helper tests

Status: ready-for-agent

## Parent

.scratch/product-data-cache-refactor/PRD.md

## What to build

Introduce a Product data module in the Product feature API area that owns Product query keys, authenticated session token usage, endpoint calls, and Product cache update or invalidation rules. Product screens should call endpoint-shaped hooks for Product list, detail, create, update, delete, and restore operations instead of assembling query keys, endpoint calls, and cache mutations inline.

The refactor must preserve current Product behavior exactly. The goal is deeper locality for Product server-state mechanics, not Product UI changes or optimistic updates.

## Acceptance criteria

- [ ] Product screens use endpoint-shaped Product data hooks for list, detail, create, update, delete, and restore operations.
- [ ] Product data hooks read the authenticated app shell session internally instead of requiring screens to pass a session token.
- [ ] Product data hooks return standard TanStack Query query and mutation objects.
- [ ] Product query keys are owned by the Product data module.
- [ ] Create success inserts the created Product into the currently active Product list cache.
- [ ] Update success updates the Product detail cache and both default and deleted-inclusive Product list caches.
- [ ] Delete success removes the Product detail cache, removes the Product from the default Product list cache, and invalidates deleted-inclusive Product list data.
- [ ] Restore success invalidates Product detail, default Product list, and deleted-inclusive Product list data.
- [ ] Product visual list projection rules, including filters, sorting, labels, and active-filter calculations, remain outside the Product data module.
- [ ] No optimistic updates are introduced.
- [ ] Focused cache helper tests cover create insertion, update propagation, delete removal/invalidation, and restore invalidation.
- [ ] Existing Product route tests continue to cover user-visible Product behavior.

## Blocked by

- .scratch/product-data-cache-refactor/issues/01-move-product-endpoints-and-extract-shared-web-api-helpers.md
