# Add protected route auth gate

Status: ready-for-agent

## Parent

- [PRD](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/basic-authentication/PRD.md)

## What to build

Deliver one protected web route backed by the authenticated API session. An unauthenticated visitor who tries to open that route should be redirected to sign-in. An authenticated `User` who already has a valid current session should be able to enter the protected route and see a minimal authenticated view that reflects the current `User`.

## Acceptance criteria

- [ ] The web app has at least one protected route that cannot be accessed without a valid current session.
- [ ] Unauthenticated access to that route redirects the user to sign-in.
- [ ] After successful session bootstrap, an authenticated `User` can load the protected route and see a minimal authenticated view based on the current `User`.
- [ ] If the current session becomes invalid while accessing the protected route, the user is returned to an unauthenticated flow.
- [ ] Web tests verify protected-route entry, redirect behavior, and authenticated access from the user’s perspective.

## Blocked by

- [02-bootstrap-current-authenticated-session](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/basic-authentication/issues/02-bootstrap-current-authenticated-session.md)
