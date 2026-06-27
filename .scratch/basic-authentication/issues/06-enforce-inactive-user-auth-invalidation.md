# Enforce inactive `User` auth invalidation

Status: ready-for-agent

## Parent

- [PRD](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/basic-authentication/PRD.md)

## What to build

Deliver one complete inactive-`User` enforcement path. An inactive `User` cannot sign in, and if a previously active `User` becomes inactive, their existing bearer tokens stop working and the web app falls back to an unauthenticated state.

## Acceptance criteria

- [ ] An inactive `User` cannot sign in and receives the agreed inactive-user failure response.
- [ ] A bearer token that belonged to a `User` who later became inactive is rejected on authenticated API requests.
- [ ] When the web app uses a token for an inactive `User`, it transitions out of the authenticated state.
- [ ] API and web tests verify both blocked sign-in and invalidation of previously issued tokens.
- [ ] The slice does not introduce admin user-management endpoints beyond what is needed to set up the inactive-user scenario for tests or fixtures.

## Blocked by

- [02-bootstrap-current-authenticated-session](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/basic-authentication/issues/02-bootstrap-current-authenticated-session.md)
