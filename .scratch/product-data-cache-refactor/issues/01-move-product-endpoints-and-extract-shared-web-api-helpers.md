# Move Product endpoints and extract shared web API helpers

Status: ready-for-agent

## Parent

.scratch/product-data-cache-refactor/PRD.md

## What to build

Move the Product endpoint adapter into the Product feature API area and extract only the shared web API transport helpers that Product and auth both need today. Product screens should continue to behave exactly as they do now, but Product-specific endpoint calls should live with the Product feature, while shared base URL resolution and common error-message extraction live in the shared web API helper area.

This slice should not introduce Product data hooks or change Product cache ownership yet. It is the locality cleanup that makes the next Product data module slice straightforward.

## Acceptance criteria

- [ ] Product endpoint calls are owned by the Product feature API area rather than the generic web API library area.
- [ ] Product screens import Product endpoint functions from the Product feature API area.
- [ ] Shared base API URL resolution and trailing slash normalization are extracted into shared web API helpers.
- [ ] Shared response error-message extraction is extracted into a shared helper that accepts endpoint-specific fallback text.
- [ ] Product and auth endpoint adapters reuse the shared helpers where the helper meaning is identical.
- [ ] Product endpoint schema parsing, multipart request construction, auth header construction, and endpoint request bodies remain feature-specific.
- [ ] Existing Product list, create, edit, delete, and restore route behavior remains unchanged.
- [ ] Existing auth endpoint behavior remains unchanged.
- [ ] Focused verification includes the existing Product route tests and web type checking.

## Blocked by

None - can start immediately
