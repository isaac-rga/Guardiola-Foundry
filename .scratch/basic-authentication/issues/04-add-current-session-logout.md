# Add current-session logout

Status: ready-for-agent

## Parent

- [PRD](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/basic-authentication/PRD.md)

## What to build

Deliver one complete current-session logout path. A signed-in `User` can trigger logout from the web app, the presented bearer token is revoked by the API, the current browser session becomes unauthenticated, and a different active session for the same `User` remains valid.

## Acceptance criteria

- [ ] A signed-in `User` can trigger logout from the web app for the current session.
- [ ] `POST /auth/logout` revokes only the presented active bearer token.
- [ ] After logout, the current browser session is unauthenticated and cannot use the revoked token.
- [ ] A different active token for the same `User` still works after current-session logout.
- [ ] API and web tests verify current-session logout behavior from the user’s perspective.

## Blocked by

- [02-bootstrap-current-authenticated-session](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/basic-authentication/issues/02-bootstrap-current-authenticated-session.md)
