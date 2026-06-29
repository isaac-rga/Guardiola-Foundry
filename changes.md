# Changes: Current Authenticated Session Bootstrap

This document explains the implementation for `.scratch/basic-authentication/issues/02-bootstrap-current-authenticated-session.md`.

The goal of this slice is narrow: once a `User` has already signed in and stored a bearer token, the system should be able to recover the current authenticated session after a reload by calling `me`. If the token is expired or revoked, both the API and web app should fall back to an unauthenticated state.

## Start with the shared contract

The shared types for this slice live in:

- `packages/shared-types/src/index.ts`
- `packages/shared-validation/src/index.ts`

The sign-in slice already had `AuthSessionResponse`, which includes the raw bearer token returned at login time.

This slice adds `CurrentSessionResponse`, which intentionally does not include a token:

- the client already has the stored bearer token,
- `GET /auth/me` only needs to confirm whether that token still represents a valid session,
- the API returns the refreshed `expiresAt` plus the current `user` payload.

That keeps the `me` endpoint focused on session introspection instead of token issuance.

## API walkthrough

The API entrypoint is still `apps/api/start/routes.ts`.

This slice adds:

- `GET /auth/me`

That route is handled by `apps/api/app/modules/auth/controllers/auth_controller.ts`.

The controller logic is intentionally thin:

1. Read the `Authorization` header.
2. Extract the bearer token.
3. Reject the request with `401 Unauthorized` if the header is missing or malformed.
4. Delegate token validation to `apps/api/app/modules/auth/auth_service.ts`.
5. Return the current session payload on success, or `401` on failure.

## The auth service change

The main new API behavior lives in `apps/api/app/modules/auth/auth_service.ts`.

The existing `signIn` function still creates opaque bearer tokens and stores only their SHA-256 hash.

This slice adds `getCurrentSession(token)`, which works like this:

1. Hash the presented bearer token with the same `hashToken` helper used during sign-in.
2. Look up the persisted `AccessToken` by hash.
3. Reject the token if it does not exist.
4. Reject the token if it has `revokedAt`.
5. Reject the token if `expiresAt` is already in the past.
6. Load the owning `User`.
7. Return the minimal current-session payload: `tokenType`, `expiresAt`, and `user`.

The key idea is that the API never trusts the raw token directly and never stores it at rest. Session recovery works by hashing the presented token and matching that hash against persisted token records.

## Web walkthrough

The web implementation is spread across three files:

- `apps/web/src/lib/api/auth.ts`
- `apps/web/src/lib/auth/session-storage.ts`
- `apps/web/src/features/auth/sign-in-page.tsx`

### API client

`apps/web/src/lib/api/auth.ts` now has two auth calls:

- `signIn(credentials)`
- `getCurrentSession(token)`

`getCurrentSession` sends `GET /auth/me` with `Authorization: Bearer <token>`, parses the response with the shared `currentSessionResponseSchema`, and throws when the API responds with a failure.

### Session storage

`apps/web/src/lib/auth/session-storage.ts` now does more than just write to `localStorage`.

It contains:

- `saveAuthSession(session)`
- `loadAuthSession()`
- `clearAuthSession()`

`loadAuthSession()` validates whatever is in `localStorage` against the shared `authSessionResponseSchema`. If the stored payload is malformed, it clears the bad value instead of letting invalid state leak into the UI.

### Sign-in page bootstrap

`apps/web/src/features/auth/sign-in-page.tsx` now handles both fresh sign-in and reload bootstrap.

The flow is:

1. Read the stored auth session on render.
2. Use that stored session as the initial local session state.
3. In `useEffect`, call `getCurrentSession(storedSession.token)` if a stored session exists.
4. If `me` succeeds, rebuild the stored session with:
   - the original stored token,
   - the API-confirmed `tokenType`,
   - the API-confirmed `expiresAt`,
   - the API-confirmed `user`.
5. Save that refreshed session back to `localStorage`.
6. If `me` fails, clear storage and set the page back to an unauthenticated state.

This is deliberately small. It gives the app one concrete bootstrap path without introducing a global auth provider or route guard yet.

## Tests and verification

The API behavior is covered by `apps/api/tests/functional/auth/sign-in.spec.ts`.

The new tests prove:

- `GET /auth/me` returns the current authenticated `User` for a valid bearer token,
- a revoked bearer token is treated as unauthenticated,
- an expired bearer token is treated as unauthenticated.

The web behavior is covered by `apps/web/src/features/auth/sign-in-page.test.tsx`.

The new tests prove:

- a successful sign-in still stores the session payload,
- a reload with stored credentials calls `GET /auth/me`,
- valid stored credentials remain stored after successful bootstrap,
- invalid stored credentials are cleared and treated as signed out.

One implementation detail that mattered during verification: the shared packages had to be rebuilt so the app runtime could see the new `CurrentSessionResponse` exports from `dist`.

## Why the implementation is shaped this way

This slice intentionally avoids broader architecture.

It does not add:

- a global auth context,
- protected-route redirects,
- logout,
- refresh tokens,
- cross-tab session synchronization.

Those would increase scope beyond what this issue asks for. The current shape proves the end-to-end bootstrap path first:

- API can validate an existing bearer token,
- web can recover a session after reload,
- invalid sessions are actively cleared.

## What remains for later slices

This change still leaves obvious follow-up work:

- protect routes using the bootstrapped session,
- add current-session logout,
- revoke all sessions after password change,
- reject inactive users on authenticated endpoints,
- move session ownership out of the sign-in page into a reusable app-level boundary.

That is consistent with the issue ordering in `.scratch/basic-authentication/issues/`.

## Technical debt audit

### [AUDIT DETECTED]: Current Authenticated Session Bootstrap

- **Architectural Shortcuts Found**:
  - `apps/web/src/features/auth/sign-in-page.tsx` owns session bootstrap, persistence refresh, and signed-in display state locally, so any future protected route or shared header will need to duplicate or extract that logic.
  - `apps/api/app/modules/auth/controllers/auth_controller.ts` parses the bearer token inline inside `me`, which is fine for one endpoint but will create repeated authorization-header parsing once more authenticated routes are added.
  - Shared contract changes in `packages/shared-types` and `packages/shared-validation` require rebuilt `dist` output before the apps see the new runtime exports, which is a process footgun for future slices.
- **Debt Metric Aggregation**:
  - New Bypass Comments: `0`
  - Missing Test Coverage: `No`
- **Downstream Impact Statement**:
  - Leaving session bootstrap page-local slows the next auth slices because route protection, logout, and invalidation behavior will have to untangle UI concerns from session ownership before they can be reused safely.
- **Remediation Action**:
  - Extract bearer-session ownership into a reusable web auth boundary and move API bearer-token parsing into a dedicated middleware or guard before adding more authenticated endpoints.
