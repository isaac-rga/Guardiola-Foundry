# Finish the Bearer Authentication Seam

This refactor makes the existing bearer middleware the single authentication implementation for ordinary protected API routes. It preserves ADR-0001, keeps Admin and Operator authorization in controllers, and leaves Logout and Password Change as explicit credential-lifecycle operations.

## Authentication Boundary

[apps/api/start/routes.ts](apps/api/start/routes.ts) now defines one bearer-protected route group containing:

- `GET /auth/me`;
- all Material routes;
- all Product routes;
- all Source routes;
- `GET /currency-conversion-rate`.

The group uses the existing [bearer authentication middleware](apps/api/app/middleware/bearer_auth_middleware.ts). Route URLs and response contracts are unchanged.

The following routes remain outside the group:

- `GET /health` is public;
- `POST /auth/login` is public;
- `POST /auth/logout` remains responsible for revoking only the presented token;
- `POST /auth/change-password` remains responsible for validating the current password and revoking all active tokens for the User.

Future classification of public and credential-lifecycle routes for integration with other apps is deferred. This change introduces no alternate guard, client type, claim model, or speculative integration seam.

## Controller and Service Changes

[AuthController](apps/api/app/modules/auth/controllers/auth_controller.ts) now returns the middleware-provided `authenticatedSession` from `/auth/me`. It no longer parses or validates that route's bearer token itself.

[MaterialsController](apps/api/app/modules/materials/controllers/materials_controller.ts) no longer authenticates the Material list request inside the controller.

[ProductsController](apps/api/app/modules/products/controllers/products_controller.ts) now consumes `authenticatedSession.user`. Existing role-based decisions remain in the controller:

- only an Admin may include deleted Products in the list;
- only an Admin may restore a deleted Product.

[products_service.ts](apps/api/app/modules/products/products_service.ts) now receives the authenticated User ID needed for `Created By`. It no longer requires a database-backed `User` model, which removes the redundant User lookup previously performed by the Products controller.

Existing Source authorization remains unchanged, including Admin-only Retired Source listing and restoration.

## Inactive User Sessions

[auth_service.ts](apps/api/app/modules/auth/auth_service.ts) now rejects a valid, unexpired token while its User is inactive. The response from ordinary protected routes remains the generic `401 { message: "Unauthorized" }`.

The token is not revoked by this check. If the User becomes active again before the token expires, the same token may authenticate successfully. Explicit token revocation remains part of Logout and Password Change.

## ADR-0001 Correction

[docs/adr/0001-token-based-auth.md](docs/adr/0001-token-based-auth.md) now matches the established API contract:

- Login returns `token`, `expiresAt`, and `user`;
- `/auth/me` returns `expiresAt` and `user` without echoing the presented bearer token;
- bearer authentication remains independent of Admin and Operator authorization.

No `CONTEXT.md` change was needed because the existing User, Active User, Admin, Operator, and Password Change terms already cover this work.

## Test-Driven Development

The Inactive User behavior followed a red-to-green cycle:

1. Added an HTTP test that signs in an Active User, makes the User inactive, and calls `/auth/me` with the existing token.
2. Confirmed the red state: the API returned `200` instead of the required `401`.
3. Added the Active User check to the shared current-session lookup.
4. Confirmed the green state: all 18 focused authentication tests passed.
5. The same test reactivates the User and confirms that the non-revoked token works again.

[protected_routes.spec.ts](apps/api/tests/functional/auth/protected_routes.spec.ts) is a behavior-preserving characterization test. It checks every route in the protected group and requires a missing bearer token to produce the same generic `401 Unauthorized` response before and after the controller refactor.

## Verification

- The protected-route characterization test passed before and after the refactor.
- The focused authentication, Product, Material, and Source authorization suites passed: 48 tests.
- The final protected-route test passed after improving its route-specific failure labels.
- API strict TypeScript checking passed.
- API lint passed.
- Focused lint for the new protected-route test passed.
- `git diff --check` passed.
- The route group structure was checked against the AdonisJS v7 routing documentation.

The complete test suite and the human/CI-owned `pnpm quality` gate were not run, as agreed.

All changes remain uncommitted for review.
