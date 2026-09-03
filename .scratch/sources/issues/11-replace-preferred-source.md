# 11 — Replace the Preferred Source atomically

**What to build:** Let Admins and Operators change the purchasing and cost authority for an Active Material from its relationship Dialog. Promotion and demotion must occur atomically so the Material never has zero or multiple Preferred Sources.

**Blocked by:** 10 — Link and unlink Sources with Vendor Shades.

**Status:** done

- [x] Admins and Operators can select a linked Active alternate Source as the new Preferred Source.
- [x] A Source without Landed Unit Cost is visibly ineligible and cannot become Preferred.
- [x] A Retired or Unlinked Source cannot become Preferred.
- [x] Replacing Preferred Source promotes the selected Source and demotes the former Preferred Source to an alternate in one transaction.
- [x] A failed replacement leaves the previous Preferred Source unchanged.
- [x] Every successful Active Material mutation leaves exactly one linked Active Preferred Source with Landed Unit Cost.
- [x] The Materials list derives its cost from the new Preferred Source's manual Landed Unit Cost.
- [x] Active alternate count updates after replacement and excludes Retired Sources.
- [x] The Material Dialog and Source catalog refresh to show the committed relationship state.
- [x] Eligibility and transaction failures are displayed in business language without closing the Dialog.
- [x] The Preferred replacement endpoint rejects unauthenticated requests.
- [x] Focused API and route tests cover every eligibility rule, atomic success and rollback, exact-one-Preferred enforcement, cost derivation, alternate counts, refreshed UI state, and failure messaging.

## Comments

- 2026-09-03: Added authenticated, transactional Preferred Source replacement for Active Materials. The Material Dialog identifies missing-cost alternates as ineligible, keeps business failures visible in place, and refreshes Material detail/list plus Source queries after success. Material list cost and active alternate count now reflect the committed relationship state and exclude Retired Sources.
