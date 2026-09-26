# 04 — Standardize Bills of Materials filters

**What to build:** Move the Bills of Materials catalog's Kind and Include deleted controls into the shared filter experience while preserving its existing server-backed URL behavior and operational summary semantics. Authorized Admins can include deleted Bills of Materials and distinguish them without changing what the global catalog summaries mean.

**Blocked by:** 02 — Productionize the approved shared filter UI.

**Status:** ready-for-agent

- [ ] Bills of Materials uses the shared visible search, Filter popover, chips, editing, clearing, responsive, empty, and accessible interaction pattern with Kind and Include deleted criteria.
- [ ] Search, Kind, and Include deleted continue to hydrate from and synchronize to canonical URL state with the approved history behavior.
- [ ] Include deleted is additive and Admin-only; explicit unauthorized API requests return `403`, unauthorized URL state is sanitized, and table-level permission recovery follows the shared behavior.
- [ ] Deleted Bills of Materials are visibly identified with a Deleted badge while current records receive no additional lifecycle badge.
- [ ] Filtering changes returned rows without changing the existing global meaning of Available BOMs, BOMs without an associated Product Variant, or BOMs pending line verification.
- [ ] Focused route and API tests prove Bills of Materials-specific URL, permission, historical badge, and global-summary behavior without repeating the complete shared interaction suite.
