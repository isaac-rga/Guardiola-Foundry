---
status: accepted
---

# Scope the web query cache to the authenticated session

A cached catalog `401` caused Bills of Materials to send the User back to sign-in after a successful sign-in. The authenticated web app uses one query client per mounted session under `/app`. The authenticated app shell creates the client, and the route remounts the session when the bearer token changes. [ADR 0001](0001-token-based-auth.md) · [Issue 08](../../.scratch/table-filter-standard/issues/08-consolidate-catalog-authentication-failure-handling.md)

Clearing a shared query client at sign-out removes its current cache entries. Pending requests and mutation callbacks can still hold a reference to that client. A separate client per session keeps late results and cache updates with the session that started them.

Catalogs share the cache as the User moves between pages in one session. After sign-in, the cache starts empty and each catalog fetches its data when opened. Catalogs continue to own their query keys and invalidation rules. Session ownership of the cache does not cover the separate `/auth/me` verification flow.
