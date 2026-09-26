# 03 — Standardize Sources with Include retired

**What to build:** Adopt the shared table-filter experience in Sources and replace the exclusive Active-or-Retired catalog view with additive Include retired behavior. The default catalog remains Active-only; an authorized Admin can include Active and Retired Sources together and distinguish every retired result beside its Source name.

**Blocked by:** 02 — Productionize the approved shared filter UI.

**Status:** ready-for-agent

- [ ] Sources uses the shared search, Filter popover, chips, editing, clearing, responsive, empty, and accessible interaction pattern with Textile family, Material link, Attention, and Include retired criteria.
- [ ] The Sources contract accepts Include retired and returns Active and Retired Sources together, including Source Status in each list summary needed to identify Retired rows.
- [ ] Retired Sources display a Retired badge beside the Source name, while Active Sources receive no additional lifecycle badge.
- [ ] Existing `status=active` URLs canonicalize to the default URL and existing `status=retired` URLs canonicalize to `includeRetired=true` without adding duplicate history entries.
- [ ] Include retired is offered only to Admins, explicit unauthorized API requests return `403`, unauthorized URL state is sanitized before querying, and table-level permission recovery follows the shared behavior.
- [ ] Focused Sources route and API tests prove only the feature-specific contract and do not duplicate the full shared interaction suite.
