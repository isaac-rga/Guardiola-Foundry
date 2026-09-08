# 17 — Harden Product Variant candidate selection

**What to build:** Make Product Variant selection reliable for manual and Template-derived Implementation creation at production catalog scale. One server-composed candidate contract explains eligibility, retains deterministic search behavior, and survives concurrent occupancy without losing the User's draft.

**Blocked by:** 10 — Create manual BOM Implementations.

**Status:** ready-for-agent

- [ ] Manual creation searches globally, Product-context creation carries Product identity, and Template derivation carries Template identity so the server derives the allowed Product scope.
- [ ] One server-owned candidate response composes Product availability with BOM-owned Implementation occupancy and returns stable Variant and Product identity, `selectable`, one canonical outcome, and existing Implementation identity when occupied.
- [ ] Outcome precedence is `implementation-exists`, then `product-unavailable`, then `variant-inactive` when more than one reason applies.
- [ ] Derivation excludes Variants outside the associated Template's Product, while in-scope ineligible matches remain visible and non-selectable.
- [ ] Matching ignores case, accents, and insignificant whitespace and uses order-independent AND semantics across Variant ID and name plus Product ID and name.
- [ ] Results use the shared deterministic relevance order, with Variant relevance primary and eligible candidates winning only otherwise equivalent ties.
- [ ] Responses return at most 25 items plus `hasMore`; no total, pagination, incremental loading, virtualization, recency, or personalized ranking is introduced.
- [ ] Empty, loading, superseded request, more-matches, recoverable failure, authentication failure, authorization failure, and ineligible-result states preserve the creation context.
- [ ] Selecting an eligible Variant closes the dialog, restores trigger focus, and announces the choice; activating an ineligible Variant keeps it open and announces its reason.
- [ ] Same-session identical searches may use the 30-second cache, and Product, Product Variant, or BOM Implementation mutations invalidate the relevant candidate results.
- [ ] Candidate search provides guidance rather than a reservation; atomic Implementation Save always revalidates eligibility.
- [ ] If another User occupies the Variant first, Save creates no partial Implementation, preserves the local draft, and identifies the conflict without automatic reassignment.
- [ ] A repeatable performance check demonstrates server-response p95 at or below 500 milliseconds against at least 10,000 active Product Variants, measured separately from debounce.
- [ ] Focused database-backed search, concurrency, and route tests cover scopes, eligibility precedence, ranking, bounds, caching, states, accessibility, atomic revalidation, draft preservation, and performance.
