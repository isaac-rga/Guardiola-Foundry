# Basic Authentication

Status: ready-for-agent

## Problem Statement

Guardiola Foundry currently has no authentication beyond a public health endpoint. The system needs a basic, production-shaped authentication flow for a `User` to sign in with an `Email Address` and password, stay authenticated with bearer tokens, identify the current authenticated `User`, sign out, and perform an authenticated `Password Change`. The first version must be small enough to implement cleanly in the current API skeleton while still making concrete decisions about token storage, expiration, lockout behavior, inactive users, and the distinction between `Password Change` and `Password Recovery`.

## Solution

Introduce a basic authentication flow centered on opaque stored bearer tokens. `User` records are created by seed or setup flows, not public registration. A `User` signs in with `Email Address` and password, receives a bearer token with a 30-day lifetime, uses that token for authenticated requests, can inspect the current authenticated session through `me`, can sign out by revoking the presented token, and can perform a `Password Change` by presenting the current password plus a new password. `Admin` and `Operator` roles are stored and returned for future use, but route-level authorization remains out of scope for this version.

## User Stories

1. As a `User`, I want to sign in with my `Email Address` and password, so that I can access protected parts of the system.
2. As a `User`, I want sign-in to return a bearer token, so that I can authenticate subsequent API requests.
3. As a `User`, I want sign-in to return my basic identity details, so that the client can know who I am after authentication.
4. As a `User`, I want sign-in to return my role, so that the client can tailor the interface for an `Admin` or `Operator`.
5. As a `User`, I want sign-in to return token expiration information, so that the client can handle session expiry predictably.
6. As a `User`, I want to call `me` with my bearer token, so that I can recover the current authenticated session after a reload.
7. As a `User`, I want `me` to fail once my token is expired or revoked, so that the client does not treat an invalid session as valid.
8. As a `User`, I want to sign out from the current session, so that the presented bearer token can no longer be used.
9. As a `User`, I want other active sessions to remain signed in when I log out from one session, so that multi-session usage works predictably.
10. As a `User`, I want to change my password while authenticated, so that I can rotate credentials without an admin changing them for me.
11. As a `User`, I want password change to require my current password, so that a stolen token alone is not enough to silently replace my credentials.
12. As a `User`, I want all my active bearer tokens revoked after a successful password change, so that old sessions stop working immediately.
13. As an `Admin`, I want seeded or setup-created `User` records to be able to sign in without public self-registration, so that access can be provisioned operationally.
14. As an `Admin`, I want inactive `User` records blocked from signing in, so that access can be disabled without deleting the `User`.
15. As an `Admin`, I want existing bearer tokens for an inactive `User` to stop working, so that deactivation takes effect immediately.
16. As an `Operator`, I want the system to recognize my role even before role-based authorization exists, so that the client can begin reflecting role-aware behavior.
17. As a developer, I want `Email Address` lookup and uniqueness to be case-insensitive, so that users are not locked out by casing differences.
18. As a developer, I want token values hashed at rest, so that a database leak does not directly expose active bearer tokens.
19. As a developer, I want a simple `/auth` route group, so that authentication behavior stays discoverable and isolated from future user-management routes.
20. As a developer, I want no refresh-token flow in v1, so that the initial implementation stays small and understandable.
21. As a maintainer, I want specific login failure messages for unknown email, incorrect password, and inactive user, so that operational troubleshooting is straightforward.
22. As a maintainer, I want basic login lockout behavior after repeated failures on the same `Email Address`, so that brute-force attempts are slowed down.
23. As a maintainer, I want successful login to clear the failed-attempt counter, so that old failures do not keep blocking legitimate access.
24. As a future implementer, I want `Password Recovery` kept separate from authenticated `Password Change`, so that forgotten-password behavior can be designed deliberately in a later slice.
25. As a future implementer, I want `Admin` and `Operator` roles stored now without route-level enforcement yet, so that a later authorization slice can build on a stable identity model.

## Implementation Decisions

- The feature will be implemented as an authentication module in the API, with explicit support for `User` identity, bearer token issuance and validation, authenticated session introspection, logout, and authenticated `Password Change`.
- The API surface is grouped under `/auth` and includes `login`, `logout`, `me`, and `change-password`.
- Sign-in uses `Authorization: Bearer <token>` for authenticated requests.
- Tokens are opaque values, not JWTs.
- Only hashed token values are stored server-side. The raw token is returned once at sign-in.
- Tokens are multi-session per `User`, not single-session.
- Each token expires after 30 days.
- There is no refresh-token flow in v1. Expired sessions must sign in again.
- `logout` revokes only the presented active token.
- `change-password` requires the current password plus a new password.
- A successful `Password Change` revokes all active tokens for the affected `User`.
- `Password Recovery` is explicitly out of scope for this PRD and must be designed as a separate flow later.
- `User` records are created by seed or setup flows for now. Public self-signup is not part of the feature.
- The system stores and returns `Admin` and `Operator` roles, but does not yet add role-based route restrictions.
- `Email Address` matching and uniqueness are case-insensitive through normalized storage and lookup.
- `User` records include an active/inactive access state. Inactive users cannot sign in, and authenticated endpoints reject tokens associated with inactive users.
- Sign-in and `me` return only the minimum session payload needed for the client: token metadata plus `user { id, email, role, active }`.
- Login failures are intentionally specific and distinguish between email not found, incorrect password, and inactive user.
- Basic login protection is included in v1 through a per-email lockout after 5 failed attempts for 15 minutes.
- A successful sign-in clears the failed-attempt counter for that `Email Address`.
- Seeded or setup-created users may keep their initial password until they voluntarily perform a `Password Change`.
- The minimum password requirement for the first version is 8 characters.
- The highest preferred implementation seam is the API HTTP boundary. The feature should be shaped so most behavior can be verified through route-level functional tests instead of deep unit-level seams.

## Testing Decisions

- Good tests should verify external behavior only: request shape, response shape, status codes, authenticated access rules, revocation effects, lockout outcomes, and session expiry behavior. They should avoid asserting internal helper structure, hashing implementation details, or storage-specific incidental behavior unless that detail is externally observable.
- The primary seam is API functional testing at the `/auth` route boundary. This should cover sign-in success, sign-in failure cases, `me`, `logout`, `change-password`, token expiry handling, inactive-user handling, and login lockout behavior.
- Database-backed behavior such as token persistence, token revocation, case-insensitive `Email Address` lookup, and failed-attempt tracking should be verified through HTTP-visible outcomes wherever practical.
- If one lower seam becomes necessary, it should be reserved for narrow logic that is awkward to express through functional tests alone, such as token lookup or lockout calculation. New lower seams should be minimized.
- Prior art for testing in the current codebase is the existing API functional test style used for the health endpoint, which exercises HTTP behavior through Japa rather than testing internal implementation details.
- Seed or setup-created `User` fixtures should be used in tests to exercise both `Admin` and `Operator` records, inactive `User` behavior, and multi-session token scenarios.
- Password-change tests should verify that old tokens stop working after a successful change and that the new password can be used to sign in.
- Lockout tests should verify the exact threshold, lockout response, and reset-on-success behavior from the client perspective.

## Out of Scope

- `Password Recovery`
- Public self-signup
- Admin user-management endpoints
- Role-based route authorization
- Refresh tokens
- Social login or third-party identity providers
- MFA or step-up authentication
- Password complexity rules beyond the minimum 8-character length
- Audit trails, login history, or device/session management UIs
- Email delivery, notifications, or messaging around auth events

## Further Notes

- This PRD intentionally keeps the first slice narrow but not toy-level. It establishes a real token lifecycle, a real distinction between `Password Change` and `Password Recovery`, and a minimal but explicit security posture for inactive users, revocation, and brute-force resistance.
- The current API skeleton is minimal, so the implementation will likely need schema, persistence, route, validation, and middleware work in one coordinated pass.
- A follow-up PRD can cover `Password Recovery` once delivery channels, reset-token semantics, and expiry rules are ready to be decided.
