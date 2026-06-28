# Changes: Basic Authentication Sign-In Slice

This document explains the implementation for `.scratch/basic-authentication/issues/01-establish-user-sign-in.md`.

The goal of this slice is narrow: a seeded `User` can sign in from the web app with `Email Address` and password, the API returns a bearer-token session payload, and the client stores that payload locally for later use.

## Start with the shared contract

The shared shape for this slice lives in:

- `packages/shared-types/src/index.ts`
- `packages/shared-validation/src/index.ts`

These files define the login request, the returned session payload, and the `user { id, email, role, active }` structure.

Important update: the API now uses the same shared `loginRequestSchema` as the web app. That means both sides validate login payloads from the same schema instead of drifting into separate checks.

## API walkthrough

The API entrypoint is `apps/api/start/routes.ts`.

- `POST /auth/login` is registered there.
- The request is handled by `apps/api/app/modules/auth/controllers/auth_controller.ts`.

The controller stays thin:

- It parses the request body with the shared `loginRequestSchema`.
- It rejects malformed input with `422` using shared-schema validation errors.
- It delegates the sign-in work to `apps/api/app/modules/auth/auth_service.ts`.

The service contains the actual sign-in flow:

1. Normalize the `Email Address` to lowercase before lookup.
2. Find the matching `User`.
3. Verify the submitted password against the stored password hash.
4. Generate an opaque token.
5. Store only the SHA-256 hash of that token in `access_tokens`.
6. Set a 30-day expiration.
7. Return the raw token once, along with `tokenType`, `expiresAt`, and the minimal `user` payload.

Persistence is introduced by:

- `apps/api/app/models/user.ts`
- `apps/api/app/models/access_token.ts`
- `apps/api/database/migrations/1782681000000_create_users_table.ts`
- `apps/api/database/migrations/1782681001000_create_access_tokens_table.ts`

Important details:

- `User.email` is normalized on write for case-insensitive matching.
- `User.password` is hashed before save.
- `AccessToken.hash` stores the token hash, never the raw bearer token.

## Seeded admin user

The slice now includes a real seeder at:

- `apps/api/database/seeders/admin_user_seeder.ts`

The seeder creates or resets a predictable local admin user:

- `email`: `admin@example.com`
- `password`: `Password123`
- `role`: `admin`
- `active`: `true`

This makes `node ace db:seed` useful for local sign-in testing instead of being a no-op.

## CORS support for the web app

The web app runs on a different origin during local development, so the API now includes a small CORS middleware:

- `apps/api/app/middleware/cors_middleware.ts`
- `apps/api/start/kernel.ts`

That middleware currently allows requests from `http://localhost:5173` and does two things:

1. Answers browser preflight `OPTIONS` requests for `/auth/login`.
2. Adds the expected CORS headers to the actual login response.

This is intentionally narrow and local-dev oriented. It solves the immediate sign-in flow without turning this slice into a broader environment/config project.

## Web walkthrough

The sign-in screen is added at:

- `apps/web/src/routes/sign-in.tsx`
- `apps/web/src/features/auth/sign-in-page.tsx`

The home page now links to `/sign-in` from `apps/web/src/features/home/home-page.tsx`.

The sign-in page does three things:

1. Validates `email` and `password` with React Hook Form plus the shared Zod schema.
2. Calls `apps/web/src/lib/api/auth.ts` to post credentials to `/auth/login`.
3. Stores the returned session payload with `apps/web/src/lib/auth/session-storage.ts`.

For this slice, session storage is intentionally simple: the full returned session payload is written to `localStorage` under one key. A later issue can build `me`, reload bootstrap, logout, and invalidation behavior on top of that stored payload.

## Tests and verification

The API behavior is covered by `apps/api/tests/functional/auth/sign-in.spec.ts`.

That test proves:

- invalid login payloads are rejected by the shared schema,
- browser preflight requests for the web origin are answered correctly,
- a seeded `User` can sign in,
- email lookup is case-insensitive,
- the endpoint returns the expected session shape,
- the persisted token value is hashed instead of stored raw.

The web behavior is covered by `apps/web/src/features/auth/sign-in-page.test.tsx`.

That test proves:

- the sign-in form submits credentials to the API,
- the returned session payload is stored,
- the UI reflects the signed-in user after success.

Supporting setup changes:

- `apps/api/tests/bootstrap.ts` now runs migrations for the API test suite.
- `apps/api/package.json` now depends on `@guardiola-foundry/shared-validation`, so the API can consume the shared login schema directly.
- `apps/web/src/routeTree.gen.ts` was regenerated to include the new sign-in route.

## What this slice does not do yet

This change does not implement:

- `GET /auth/me`
- logout
- password change
- inactive-user invalidation
- lockout behavior

Those remain for the follow-up issues in `.scratch/basic-authentication/issues/`.

## Unsolved technical debt

The current slice is intentionally small, but it leaves a few known shortcuts behind for future work:

- **CORS is hardcoded for local development**  
  `apps/api/app/middleware/cors_middleware.ts` currently allows only `http://localhost:5173` with a fixed method list. This is enough for local sign-in, but it should move to config or environment-driven settings before additional clients or environments are introduced.

- **Session state is still page-local on the web**  
  `apps/web/src/features/auth/sign-in-page.tsx` stores the returned session and renders signed-in UI locally in the page component. That is fine for the first sign-in slice, but issue `02-bootstrap-current-authenticated-session` should move current-session ownership into a reusable app-level auth/session boundary.

- **Session storage is intentionally minimal**  
  `apps/web/src/lib/auth/session-storage.ts` only writes the raw session payload to `localStorage`. There is no bootstrap, expiration handling, revocation handling, or invalidation flow yet.

- **The seeded admin password is reset on every seed run**  
  `apps/api/database/seeders/admin_user_seeder.ts` recreates or resets the admin user to `Password123` each time `db:seed` runs. That is useful for predictable local setup, but it is a tradeoff: rerunning seeds will overwrite manual password changes for that user.

- **Validation messages now come directly from the shared Zod schema**  
  The API and web now share one login schema, which removes drift, but the API currently exposes schema-derived validation messages as-is. If the product later needs curated or localized validation copy, that should be an explicit response-contract decision instead of ad hoc controller logic.
