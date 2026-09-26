# 05 — Standardize Pattern Set filters

**What to build:** Adopt the shared table-filter experience for the Pattern Set catalog and persist its admin-only Include retired criterion in canonical route state. Authorized Admins can mix Active and Retired Pattern Sets and identify the historical rows while Operators retain the default Active-only view.

**Blocked by:** 02 — Productionize the approved shared filter UI.

**Status:** ready-for-agent

- [ ] Pattern Sets uses the shared Filter popover, additive chip, clearing, responsive, empty, and accessible interaction pattern for Include retired.
- [ ] Include retired state hydrates from and synchronizes to the route URL, omits its default, and follows the approved history and invalid-parameter behavior.
- [ ] Include retired is offered only to Admins; explicit unauthorized API requests return `403`, unauthorized URL state is sanitized, and table-level permission recovery follows the shared behavior.
- [ ] Retired Pattern Sets display a Retired badge while Active Pattern Sets receive no additional lifecycle badge.
- [ ] Focused route and API tests prove Pattern Set-specific URL, permission, and historical-row behavior without repeating the complete shared interaction suite.
