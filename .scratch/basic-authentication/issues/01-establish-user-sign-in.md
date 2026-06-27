# Establish `User` sign-in

Status: ready-for-agent

## Parent

- [PRD](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/basic-authentication/PRD.md)

## What to build

Deliver the first complete authentication path across API and web so a seeded `User` can sign in with `Email Address` and password from the web app, receive a bearer token from the API, and have the client store the returned session payload. This slice includes the minimum persistent identity and token model needed to support opaque stored bearer tokens, case-insensitive `Email Address` lookup, 30-day token expiration, and returning `user { id, email, role, active }` together with token metadata after successful sign-in.

## Acceptance criteria

- [ ] A seeded `User` can successfully sign in with `Email Address` and password through the web login flow and receive a bearer token-backed session.
- [ ] The API stores only hashed token values, treats `Email Address` matching case-insensitively, and returns the agreed session payload on successful sign-in.
- [ ] API and web tests verify successful sign-in behavior end-to-end for at least one seeded `User`.

## Blocked by

None - can start immediately
