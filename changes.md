# Current-Session Logout

This slice adds one complete logout path for the current authenticated session.

The goal is narrow:

- a signed-in `User` can log out from the web app
- `POST /auth/logout` revokes only the presented bearer token
- the current browser session becomes unauthenticated
- another active session for the same `User` keeps working

## 1. API route wiring

The API entrypoint is `apps/api/start/routes.ts`.

This change adds:

- `POST /auth/logout`

That route is handled by `AuthController.logout`, alongside the existing `login` and `me` endpoints. Keeping it inside the same `/auth` group makes the token lifecycle easy to follow in one place.

## 2. Controller behavior

The HTTP behavior lives in `apps/api/app/modules/auth/controllers/auth_controller.ts`.

Walk through `logout()` in order:

1. Read the `Authorization` header.
2. Extract the bearer token with the existing `extractBearerToken()` helper.
3. Return `401` when the request is missing a valid bearer token.
4. Ask the auth service to revoke the current session token.
5. Return `401` when that token is already invalid, revoked, or expired.
6. Return `204 No Content` when revocation succeeds.

That keeps the controller thin. It handles HTTP concerns only and leaves token state changes to the auth module.

## 3. Token revocation logic

The token revocation logic lives in `apps/api/app/modules/auth/auth_service.ts`.

The new function is `revokeCurrentSession(token)`.

Its responsibilities are small:

- hash the presented raw token the same way sign-in and `me` already do
- find the matching access token record
- reject missing, expired, or already-revoked tokens
- set `revokedAt` for the matching token only

The important part is what it does **not** do:

- it does not revoke every token for the user
- it does not change any other active session

That matches the issue scope exactly: current-session logout, not global logout.

## 4. Web API client

The web client entrypoint is `apps/web/src/lib/api/auth.ts`.

This change adds `logoutCurrentSession(token)`, which:

- sends `POST /auth/logout`
- includes the current bearer token
- returns quietly on success
- throws a user-facing error when the API rejects the request

This keeps the web route code simple. The route does not need to know fetch details or response parsing.

## 5. Protected route logout flow

The route behavior lives in `apps/web/src/routes/app.tsx`.

This is where the browser session transitions back to unauthenticated state.

Walk through `handleSignOut()`:

1. Set local UI state to `isSigningOut`.
2. Clear any previous logout error.
3. Call `logoutCurrentSession(session.token)`.
4. On success, remove the stored auth session with `clearAuthSession()`.
5. Navigate back to `/sign-in`.
6. On failure, keep the current session in place and show an error message.

The route owns this flow because it already has the authenticated session from the route loader. That keeps the feature local instead of introducing a broader auth coordinator.

## 6. Protected page UI

The UI lives in `apps/web/src/features/auth/protected-app-page.tsx`.

The page is still intentionally small. It now shows:

- the authenticated identity details
- a `Sign out` button
- an inline error message if logout fails

The component stays presentational:

- it receives `session`
- it receives `isSigningOut`
- it receives `logoutError`
- it receives `onSignOut`

That separation keeps async logout behavior in the route while the page just renders state.

## 7. API test coverage

The API regression test lives in `apps/api/tests/functional/auth/sign-in.spec.ts`.

The new test proves the main contract:

1. Sign in twice as the same user.
2. Call `POST /auth/logout` with the first token.
3. Verify the first token now fails against `GET /auth/me`.
4. Verify the second token still succeeds against `GET /auth/me`.

This is the key behavior of the slice. It verifies logout from the public HTTP boundary instead of asserting internal storage details.

## 8. Web test coverage

The web regression test lives in `apps/web/src/routes/-app.test.tsx`.

It verifies the user-visible flow:

1. Start on `/app` with a stored authenticated session.
2. Confirm the protected route renders.
3. Click `Sign out`.
4. Verify the app calls `POST /auth/logout` with the current token.
5. Verify local session storage is cleared.
6. Verify the router returns to `/sign-in`.

That gives confidence that the browser experience matches the API behavior.

## 9. Why this shape

This implementation stays intentionally small:

- one new API endpoint
- one small auth-service addition
- one web client function
- one route-owned logout flow
- one presentational UI update
- one API regression test
- one web regression test

It does not add:

- a global auth provider
- session management screens
- logout-all-sessions behavior
- refresh-token handling

Those would expand the surface area without helping this issue land more clearly.

## 10. Technical debt

- The protected auth feature still has no colocated component test for `apps/web/src/features/auth/protected-app-page.tsx`. The route test covers the happy-path logout flow, but the presentational states for `isSigningOut` and `logoutError` can drift without a nearby feature-level regression. Remediation: add `apps/web/src/features/auth/protected-app-page.test.tsx` that renders the component directly and asserts the identity, loading, and error states.

- `apps/web/src/lib/api/auth.ts` still reuses the shared `getErrorMessage()` fallback text `Unable to sign in. Check your credentials and try again.` for logout failures. That couples endpoint-specific UX copy to multiple auth actions and can surface the wrong message during a logout error. Remediation: let each auth client call provide its own fallback message, or split sign-in and logout error mapping.

- `apps/api/tests/functional/auth/sign-in.spec.ts` now carries sign-in, current-session, and logout behavior under a single `Auth sign-in` test group. The HTTP coverage is present, but the file scope is drifting away from its name and makes future session-related failures harder to locate quickly. Remediation: split the session/logout cases into a dedicated auth-session spec or rename the suite so its boundary matches the behaviors it owns.
