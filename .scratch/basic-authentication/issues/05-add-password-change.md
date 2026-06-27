# Add `Password Change`

Status: ready-for-agent

## Parent

- [PRD](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/basic-authentication/PRD.md)

## What to build

Deliver one complete authenticated `Password Change` path. A signed-in `User` can submit the current password and a new password, the API accepts only a valid current password and a new password meeting the minimum rule, and a successful change signs the `User` out everywhere by revoking all active tokens.

## Acceptance criteria

- [ ] A signed-in `User` can submit current password plus new password from the web app.
- [ ] `POST /auth/change-password` rejects an incorrect current password and rejects a new password shorter than 8 characters.
- [ ] A successful `Password Change` revokes all active bearer tokens for the affected `User`.
- [ ] After a successful password change, old tokens no longer work and the `User` must sign in again with the new password.
- [ ] API and web tests verify password-change success and failure behavior end-to-end.

## Blocked by

- [02-bootstrap-current-authenticated-session](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/basic-authentication/issues/02-bootstrap-current-authenticated-session.md)
