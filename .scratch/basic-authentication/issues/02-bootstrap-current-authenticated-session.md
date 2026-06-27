# Bootstrap the current authenticated session

Status: ready-for-agent

## Parent

- [PRD](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/basic-authentication/PRD.md)

## What to build

Deliver the end-to-end session bootstrap path so the web app can recover the current authenticated `User` after reload by calling `me` with the stored bearer token. This slice should prove that a valid token restores the session and that expired or revoked tokens move the web app back to an unauthenticated state without a refresh-token flow.

## Acceptance criteria

- [ ] `GET /auth/me` returns the current authenticated `User` when the presented bearer token is valid.
- [ ] Reloading the web app restores the current authenticated session from stored credentials and `me`.
- [ ] Expired or revoked tokens cause both API and web flows to treat the session as unauthenticated.

## Blocked by

- [01-establish-user-sign-in](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/basic-authentication/issues/01-establish-user-sign-in.md)
