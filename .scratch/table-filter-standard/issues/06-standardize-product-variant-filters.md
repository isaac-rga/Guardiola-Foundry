# 06 — Standardize Product Variant filters

**What to build:** Adopt the shared filter experience for the Product Variants table embedded in a Product page while keeping its Include deleted state local to that table. Authorized Admins can include and identify deleted Product Variants without affecting the parent Product route's URL or unrelated Product page state.

**Blocked by:** 02 — Productionize the approved shared filter UI.

**Status:** ready-for-agent

- [ ] Product Variants uses the shared Filter popover, additive chip, clearing, responsive, empty, and accessible interaction pattern for Include deleted.
- [ ] Include deleted remains local to the embedded table and does not add filter state to the parent Product URL.
- [ ] Include deleted is offered only to Admins; explicit unauthorized API requests return `403`, and table-level permission recovery follows the shared behavior without disrupting the parent Product page.
- [ ] Deleted Product Variants display a Deleted badge while current Variants receive no additional lifecycle badge.
- [ ] Focused route and API tests prove Product Variant-specific local state, permission, historical-row, and recovery behavior without repeating the complete shared interaction suite.
