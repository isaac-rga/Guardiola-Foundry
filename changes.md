# Protected Route Auth Gate

This change adds the first protected web route in the auth flow: `/app`.

The goal of the slice is small and specific:

- an unauthenticated visitor cannot enter the route
- a previously authenticated `User` can recover their current session and enter it
- an invalid stored session sends the visitor back to sign-in

## 1. Route entry now enforces authentication

The new route lives in `apps/web/src/routes/app.tsx`.

It uses a TanStack Router loader instead of checking auth inside the page component. That keeps the gate at the route boundary:

- the loader calls `requireCurrentAuthSession()`
- if that returns a session, the route renders normally
- if it cannot restore a valid session, the loader throws a redirect to `/sign-in`

This is the important behavior change: `/app` is now protected before the page renders.

## 2. Existing session bootstrap became a reusable route guard

The main auth logic lives in `apps/web/src/lib/auth/current-auth-session.ts`.

There were already two useful behaviors in place:

- read the stored session token from local storage
- call `GET /auth/me` to confirm that the token still maps to a valid current session

This change adds `requireCurrentAuthSession()` on top of that existing bootstrap flow.

Walk through the code in order:

1. `bootstrapCurrentAuthSession()` loads the stored session.
2. If nothing is stored, it returns `null`.
3. If a token exists, it calls `getCurrentSession(token)`.
4. On success, it rewrites local storage with the refreshed session payload and returns it.
5. On failure, it clears local storage and returns `null`.
6. `requireCurrentAuthSession()` turns that `null` case into a router redirect to `/sign-in`.

That keeps the responsibility narrow:

- bootstrap answers "can we restore a current session?"
- the route guard answers "if not, where should the visitor go?"

## 3. The protected page is intentionally minimal

The protected UI lives in `apps/web/src/features/auth/protected-app-page.tsx`.

It only shows enough to prove that the authenticated route is using the current `User`:

- a heading for the authenticated area
- the signed-in email address
- the current role

That matches the issue scope. It proves the route is backed by the authenticated API session without introducing broader app-shell or dashboard work.

## 4. Tests verify the behavior from the user’s point of view

The new route tests live in `apps/web/src/routes/-app.test.tsx`.

They use a memory router so the assertions stay at the public behavior seam: navigation and rendered UI.

The three test cases cover the acceptance criteria directly:

1. `redirects unauthenticated visitors to sign-in`
   When the visitor opens `/app` with no stored session, they land on the sign-in screen and no API call is made.

2. `shows the current authenticated user on the protected route`
   When a stored token exists and `/auth/me` succeeds, the route renders the protected page and shows the current `User`.

3. `returns visitors to sign-in when the stored session is no longer valid`
   When a stored token exists but `/auth/me` returns `401`, the stored session is cleared and the visitor is sent back to the unauthenticated flow.

## 5. Why this shape was chosen

This implementation keeps the diff small and aligned to the issue:

- one protected route
- one focused route guard
- one minimal authenticated view
- one router-level test file

It does not add:

- a global auth provider
- automatic post-login redirects
- background session polling
- a larger app shell

Those may be useful later, but they were not needed to satisfy this slice cleanly.
