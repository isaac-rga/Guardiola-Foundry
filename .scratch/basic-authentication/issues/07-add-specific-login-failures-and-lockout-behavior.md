# Add specific login failures and lockout behavior

Status: ready-for-agent

## Parent

- [PRD](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/basic-authentication/PRD.md)

## What to build

Deliver the agreed sign-in protection and feedback behavior. Login must return specific authentication failures for unknown `Email Address`, incorrect password, and inactive `User`. Repeated failed attempts for the same `Email Address` must trigger a 15-minute lockout after 5 failures, and a successful sign-in must clear the failed-attempt counter.

## Acceptance criteria

- [ ] Login returns the agreed specific failure cases for unknown `Email Address`, incorrect password, and inactive `User`.
- [ ] The per-email login lockout activates after 5 failed attempts for 15 minutes and prevents further sign-in during the lockout window.
- [ ] A successful sign-in clears the failed-attempt counter, and API plus web tests verify the lockout behavior end-to-end.

## Blocked by

- [01-establish-user-sign-in](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/basic-authentication/issues/01-establish-user-sign-in.md)
