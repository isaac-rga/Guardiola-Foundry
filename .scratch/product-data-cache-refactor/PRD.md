# Product Data Cache Refactor

Status: ready-for-agent

## Problem Statement

The web Product screens currently carry too much server-state knowledge. Product endpoint calls, authenticated session token usage, query keys, cache updates, and cache invalidation rules are spread through presentation modules. This makes Product screens harder to read, makes Product cache behavior harder to test directly, and weakens locality when Product data synchronization changes.

The codebase also has repeated web API transport helpers across feature-specific endpoint adapters. Since the web app now treats feature-local API modules as the default for feature-owned endpoints, shared transport helper extraction should happen alongside the Product endpoint move so the current state is considered cleanly rather than leaving obvious duplication behind.

## Solution

Create a Product feature API area that owns Product-specific endpoint adapters and Product-specific TanStack Query server-state behavior. Move the Product endpoint adapter into that feature-local API area, extract only the shared transport helpers that have identical meaning across current web API callers, and then introduce Product data hooks that centralize query keys, authenticated session token usage, endpoint calls, and Product cache update rules.

The refactor is intentionally split into two independently reviewable slices. The first slice is a locality cleanup for Product endpoints plus shared transport helpers. The second slice introduces the deeper Product data module with endpoint-shaped hooks and focused cache helper tests. Product list projection rules remain separate from server-state synchronization.

## User Stories

1. As a web maintainer, I want Product endpoint calls to live with the Product feature, so that Product-specific data behavior is easier to find.
2. As a web maintainer, I want Product screens to stop importing Product endpoint functions from a generic library area, so that feature ownership is clearer.
3. As a web maintainer, I want shared API transport helpers extracted once, so that base URL resolution and common error parsing have one authoritative home.
4. As a web maintainer, I want Product and auth endpoint adapters to reuse the same URL resolution helper, so that environment-based API URL behavior stays consistent.
5. As a web maintainer, I want Product and auth endpoint adapters to reuse the same common error parser, so that field-error and message extraction behave consistently.
6. As a web maintainer, I want endpoint-specific fallback messages to remain possible, so that Product and auth errors still use appropriate user-facing copy.
7. As a web maintainer, I want schema parsing to remain inside each endpoint adapter, so that feature-specific contracts stay close to the endpoint that consumes them.
8. As a web maintainer, I want auth headers to remain explicit inside feature endpoint adapters for now, so that the shared helper extraction does not overreach.
9. As a web maintainer, I want request construction to remain feature-specific, so that JSON and multipart Product requests do not get hidden behind premature abstractions.
10. As a web maintainer, I want Product query keys to be owned by the Product data module, so that screens do not assemble cache identity inline.
11. As a web maintainer, I want Product list data to be loaded through a Product data hook, so that list fetching is centralized.
12. As a web maintainer, I want Product detail data to be loaded through a Product data hook, so that direct Product page loading is centralized.
13. As a web maintainer, I want Product creation to be exposed through an endpoint-shaped Product data hook, so that the screen can trigger creation without owning cache insertion.
14. As a web maintainer, I want Product update to be exposed through an endpoint-shaped Product data hook, so that the screen can save changes without owning detail and list cache updates.
15. As a web maintainer, I want Product delete to be exposed through an endpoint-shaped Product data hook, so that the screen can delete a Product without owning cache removal and invalidation rules.
16. As a web maintainer, I want Product restore to be exposed through an endpoint-shaped Product data hook, so that the screen can restore a Product without owning the related invalidation rules.
17. As a Product screen maintainer, I want Product hooks to read the authenticated session internally, so that screens do not repeatedly pass session tokens to every Product endpoint call.
18. As a Product screen maintainer, I want Product hooks to return normal TanStack Query query and mutation objects, so that existing screen behavior can stay familiar.
19. As a Product screen maintainer, I want create success to insert the created Product into the active list cache, so that immediate list feedback remains unchanged.
20. As a Product screen maintainer, I want update success to update the Product detail cache and all relevant Product list caches, so that saved changes stay visible across Product surfaces.
21. As a Product screen maintainer, I want delete success to remove the Product detail cache, remove the Product from the default list cache, and refresh deleted-inclusive data, so that deleted Product visibility remains correct.
22. As a Product screen maintainer, I want restore success to refresh Product detail and list caches, so that restored Product state is reloaded consistently.
23. As a Product screen maintainer, I want cache helper functions with focused tests, so that cache behavior can be verified without rendering full routes.
24. As a Product screen maintainer, I want route tests to remain the integration safety net, so that user-visible Product behavior is still protected.
25. As a reviewer, I want the endpoint move and the Product data hook extraction separated, so that each change has a narrow review surface.
26. As a reviewer, I want the first slice to avoid changing Product UI behavior, so that the endpoint locality cleanup can be reviewed mechanically.
27. As a reviewer, I want the second slice to preserve current cache behavior exactly, so that the deeper module changes locality rather than product behavior.
28. As a future feature implementer, I want the Product data module pattern to match the web app default, so that new feature endpoints and server-state modules have a predictable home.
29. As a future feature implementer, I want visual list projection rules kept separate from Product server-state synchronization, so that filtering, sorting, and labels can evolve independently.
30. As a future feature implementer, I want no optimistic updates added in this refactor, so that a locality refactor does not become a UX behavior change.

## Implementation Decisions

- Product-specific endpoint adapters belong in a feature-local API area, not in the generic web library area.
- Shared web API helpers remain in the generic web API library area only when they are not owned by a single feature.
- The first implementation slice will move the Product endpoint adapter into the Product feature API area.
- The first implementation slice will extract only shared helpers with identical transport meaning across current web API callers.
- The shared helpers to extract are base API URL resolution, trailing slash normalization, and common response error-message extraction.
- The common response error-message helper must accept a fallback message so each endpoint adapter can keep appropriate user-facing fallback text.
- The first slice must not extract request functions, auth header construction, schema parsing, multipart encoding, or feature endpoint bodies.
- Product endpoint schema parsing remains in the Product endpoint adapter.
- Auth endpoint schema parsing remains in the auth endpoint adapter.
- Product update multipart construction remains Product-specific.
- The second implementation slice will introduce a Product data module for TanStack Query server-state behavior.
- The Product data module will own Product query keys, Product endpoint calls, authenticated session token lookup, cache updates, and cache invalidation.
- Product screens will call endpoint-shaped Product hooks: `useProductList`, `useProductDetail`, `useCreateProduct`, `useUpdateProduct`, `useDeleteProduct`, and `useRestoreProduct`.
- Product data hooks will use the authenticated app shell session internally rather than requiring Product screens to pass the session token.
- Product data hooks will return TanStack Query query and mutation objects directly.
- The Product data module will preserve current cache behavior exactly.
- Create success inserts the created Product into the currently active Product list cache.
- Update success updates the Product detail cache and both default and deleted-inclusive Product list caches.
- Delete success removes the Product detail cache, removes the Product from the default list cache, and invalidates the deleted-inclusive list cache.
- Restore success invalidates Product detail, default list, and deleted-inclusive list caches.
- No optimistic updates are introduced in this refactor.
- Product visual list projection rules are not part of the Product data module.
- Product filtering, sorting, labels, and active-filter calculations should remain in screen-level code or move later into a separate Product list model module.
- No ADR is needed for this refactor because the decision follows existing web app guidance, is local, and is easy to reverse.
- If the pattern later becomes a cross-feature architecture standard, it should be documented in the web app guide or a frontend architecture note rather than retroactively encoded as an ADR for this Product-only change.

## Testing Decisions

- Good tests for this refactor should verify externally meaningful behavior and cache outcomes, not TanStack Query internals.
- Existing route tests remain the highest integration seam for user-visible Product list, create, edit, delete, and restore behavior.
- The first slice should be verified by running existing Product route tests and type checks after imports move.
- Shared transport helper behavior should have focused tests only if existing coverage does not already protect URL resolution and error extraction through endpoint adapter tests.
- The second slice should add direct focused tests for Product cache helper functions.
- Cache helper tests should verify create insertion into the active list cache.
- Cache helper tests should verify update propagation into Product detail and Product list caches.
- Cache helper tests should verify delete removal from default list cache and deleted-inclusive cache invalidation.
- Cache helper tests should verify restore invalidation for Product detail and both list cache variants.
- Hook rendering tests are not required initially because the brittle behavior being moved is cache manipulation, and route tests already cover the visible Product flows.
- Product data tests should use a real QueryClient where cache state matters.
- Tests should not assert implementation details of TanStack Query beyond observable cache data and invalidation intent.

## Out of Scope

- Changing Product API contracts
- Changing auth API contracts
- Changing Product UI layout
- Changing Product list filtering or sorting behavior
- Introducing optimistic updates
- Introducing a generic authenticated fetch adapter
- Moving auth endpoints into a feature-local area
- Extracting shared request builders
- Extracting auth header helpers
- Extracting schema parsing helpers
- Reworking session storage or route authentication
- Introducing Product list projection modules
- Adding or changing backend Product behavior
- Creating an ADR for this local refactor

## Further Notes

- The Product data module is an architecture deepening step: it creates a deeper module whose interface gives screens more leverage and improves locality for Product cache behavior.
- The refactor should be reviewed as locality preservation first. Any user-visible Product behavior change should be treated as a regression unless explicitly requested.
- The web app guide has already been updated so future agents treat feature-local API modules as the default location for feature-specific endpoints and TanStack Query server-state behavior.
- The agreed issue split is:
  1. Move the Product endpoint adapter into the Product feature API area and extract shared web API transport helpers.
  2. Introduce Product data hooks and cache helper tests.
