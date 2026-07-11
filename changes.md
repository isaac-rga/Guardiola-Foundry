# Product endpoint locality and shared transport helpers

This slice is the first step in the Product data cache refactor. It does not introduce Product data hooks yet. It moves the Product endpoint adapter to the Product feature area and extracts only the shared web API transport behavior that Product and auth already duplicated.

The Product list, create, edit, delete, and restore workflows are intended to behave exactly as before.

## Start with the new shared transport helper

The shared transport behavior now lives in [apps/web/src/lib/api/transport.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/lib/api/transport.ts).

That file owns:

- `resolveApiUrl`, including `VITE_API_URL` handling
- `ensureTrailingSlash`, so absolute API base URLs compose consistently
- `getResponseErrorMessage`, with endpoint-specific fallback text

This is intentionally narrow. It does not introduce a generic authenticated fetch wrapper, shared request builders, or schema parsing helpers.

## Then follow the auth adapter reuse

The auth adapter remains in [apps/web/src/lib/api/auth.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/lib/api/auth.ts).

It now imports `resolveApiUrl` and `getResponseErrorMessage` from the shared transport helper. Auth still owns its endpoint bodies, headers, request payload parsing, and response schema parsing. The fallback auth error copy remains local to the auth adapter.

## Next read the Product endpoint adapter in its feature home

Product endpoint calls now live in [apps/web/src/features/products/api/endpoints.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/features/products/api/endpoints.ts).

That adapter still owns the Product-specific details:

- Product request and response schema parsing
- explicit bearer auth headers
- list query-string construction for `includeDeleted`
- multipart `FormData` construction for Product image updates
- endpoint-specific fallback messages

The old generic [apps/web/src/lib/api/products.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/lib/api/products.ts) file was removed because Product endpoints are no longer a generic web API concern.

## Then check the Product screen imports

The Product screens now import endpoint functions from the Product feature API area:

- [apps/web/src/features/products/product-management-page.tsx](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/features/products/product-management-page.tsx)
- [apps/web/src/features/products/product-edit-page.tsx](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/features/products/product-edit-page.tsx)

The screens still own their current TanStack Query calls and cache updates. That is deliberate: Product data hooks are the next issue, not this one.

## End at the tracker and verification

The completed issue is [.scratch/product-data-cache-refactor/issues/01-move-product-endpoints-and-extract-shared-web-api-helpers.md](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/product-data-cache-refactor/issues/01-move-product-endpoints-and-extract-shared-web-api-helpers.md).

Verification run for this slice:

- `pnpm --dir apps/web test -- src/routes/-products.test.tsx`
- `pnpm --dir apps/web typecheck`

## Scope note

This slice is a locality cleanup only. It does not change backend behavior, Product route behavior, cache ownership, Product visual list projection, optimistic updates, auth contracts, or Product API contracts.
