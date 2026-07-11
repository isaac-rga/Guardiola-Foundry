# Move Product endpoints and extract shared web API helpers

Status: done

## Parent

.scratch/product-data-cache-refactor/PRD.md

## What to build

Move the Product endpoint adapter into the Product feature API area and extract only the shared web API transport helpers that Product and auth both need today. Product screens should continue to behave exactly as they do now, but Product-specific endpoint calls should live with the Product feature, while shared base URL resolution and common error-message extraction live in the shared web API helper area.

This slice should not introduce Product data hooks or change Product cache ownership yet. It is the locality cleanup that makes the next Product data module slice straightforward.

## Acceptance criteria

- [x] Product endpoint calls are owned by the Product feature API area rather than the generic web API library area.
- [x] Product screens import Product endpoint functions from the Product feature API area.
- [x] Shared base API URL resolution and trailing slash normalization are extracted into shared web API helpers.
- [x] Shared response error-message extraction is extracted into a shared helper that accepts endpoint-specific fallback text.
- [x] Product and auth endpoint adapters reuse the shared helpers where the helper meaning is identical.
- [x] Product endpoint schema parsing, multipart request construction, auth header construction, and endpoint request bodies remain feature-specific.
- [x] Existing Product list, create, edit, delete, and restore route behavior remains unchanged.
- [x] Existing auth endpoint behavior remains unchanged.
- [x] Focused verification includes the existing Product route tests and web type checking.

## Blocked by

None - can start immediately

## Comments

- Completed by moving the Product endpoint adapter to `apps/web/src/features/products/api/endpoints.ts`, extracting shared URL and error helpers to `apps/web/src/lib/api/transport.ts`, and updating Product screens plus auth endpoints to use the new locations. Verified with `pnpm --dir apps/web test -- src/routes/-products.test.tsx` and `pnpm --dir apps/web typecheck`.
