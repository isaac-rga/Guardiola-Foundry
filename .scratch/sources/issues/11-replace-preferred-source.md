# 11 — Replace the Preferred Source atomically

**What to build:** Let Admins and Operators change the purchasing and cost authority for an Active Material from its relationship Dialog. Promotion and demotion must occur atomically so the Material never has zero or multiple Preferred Sources.

**Blocked by:** 10 — Link and unlink Sources with Vendor Shades.

**Status:** ready-for-agent

- [ ] Admins and Operators can select a linked Active alternate Source as the new Preferred Source.
- [ ] A Source without Landed Unit Cost is visibly ineligible and cannot become Preferred.
- [ ] A Retired or Unlinked Source cannot become Preferred.
- [ ] Replacing Preferred Source promotes the selected Source and demotes the former Preferred Source to an alternate in one transaction.
- [ ] A failed replacement leaves the previous Preferred Source unchanged.
- [ ] Every successful Active Material mutation leaves exactly one linked Active Preferred Source with Landed Unit Cost.
- [ ] The Materials list derives its cost from the new Preferred Source's manual Landed Unit Cost.
- [ ] Active alternate count updates after replacement and excludes Retired Sources.
- [ ] The Material Dialog and Source catalog refresh to show the committed relationship state.
- [ ] Eligibility and transaction failures are displayed in business language without closing the Dialog.
- [ ] The Preferred replacement endpoint rejects unauthenticated requests.
- [ ] Focused API and route tests cover every eligibility rule, atomic success and rollback, exact-one-Preferred enforcement, cost derivation, alternate counts, refreshed UI state, and failure messaging.
