# Use opaque stored tokens for user sign-in

User sign-in will use token-based authentication instead of server-managed sessions, and the issued tokens will be opaque values backed by stored server-side records rather than JWTs. This keeps the first implementation simple while preserving explicit client-managed authentication state, straightforward revocation, and room for future non-browser clients.

The first version uses `Authorization: Bearer <token>` for authenticated requests. Tokens may coexist per user, each token expires after 30 days, and the server stores only hashed token values. `logout` revokes only the presented active token, while `change-password` revokes all active tokens for the user. There is no refresh-token flow in v1; users must log in again after token expiration.

The initial API surface is grouped under `/auth` with `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, and `POST /auth/change-password`. `login` and `me` return `token`, `expiresAt`, and `user { id, email, role, active }`. Roles are stored and returned for now, but not yet used for route-level authorization.

Users are created through seed or setup flows, not public registration. Email addresses are matched case-insensitively using normalized storage. Seeded users may keep their initial password until they choose to change it. A password change requires the current password, the new password must be at least 8 characters long, and forgotten passwords are reserved for a separate recovery flow.

Login failures are intentionally specific: email not found, incorrect password, and inactive user are distinct cases. Basic login rate limiting is included through a per-email lockout: 5 failed attempts cause a 15-minute lockout, and a successful login clears the failed-attempt counter. Inactive users cannot log in, and existing tokens for inactive users are rejected on authenticated endpoints.
