# 03 — Standardize Sources with Include retired

**What to build:** Adopt the shared table-filter experience in Sources and replace the exclusive Active-or-Retired catalog view with additive Include retired behavior. The default catalog remains Active-only; an authorized Admin can include Active and Retired Sources together and distinguish every retired result beside its Source name.

**Blocked by:** 02 — Productionize the approved shared filter UI.

**Status:** done

- [x] Sources uses the shared search, Filter popover, chips, editing, clearing, responsive, empty, and accessible interaction pattern with Textile family, Material link, Attention, and Include retired criteria.
- [x] The Sources contract accepts Include retired and returns Active and Retired Sources together, including Source Status in each list summary needed to identify Retired rows.
- [x] Retired Sources display a Retired badge beside the Source name, while Active Sources receive no additional lifecycle badge.
- [x] Existing `status=active` URLs canonicalize to the default URL and existing `status=retired` URLs canonicalize to `includeRetired=true` without adding duplicate history entries.
- [x] Include retired is offered only to Admins, explicit unauthorized API requests return `403`, unauthorized URL state is sanitized before querying, and table-level permission recovery follows the shared behavior.
- [x] Focused Sources route and API tests prove only the feature-specific contract and do not duplicate the full shared interaction suite.

## Comments

### Completion — 2026-10-22

Implemented in `76b1b94` (pushed). Follow-up `e4ced4c` corrects unset Material link and Attention labels to show Not set, preserves selected labels, and restores Not set after clearing. The follow-up commit has not been pushed.

Verification evidence:

- Original implementation: 37 focused web tests and 5 Sources HTTP tests passed; TypeScript and focused lint passed. Independent Standards and Spec reviews closed with no remaining findings.
- Label correction: all 20 Sources route tests passed again before commit, including default labels, selected values, and clearing. Focused lint and diff-check passed; both independent reviews passed.
- Browser walkthrough verified criterion selection, chip editing and removal, Include retired activation, search and updating state, empty results, clearing, Back and Forward, and legacy Retired URL mapping. A narrow-view spot-check verified control wrapping and horizontal table scrolling. Corrected unset labels were also checked in the browser.
- Retired row badges and permission-error recovery were verified by automated tests; the walkthrough had no Retired sample and did not force a 403. No full manual accessibility matrix or `pnpm quality` gate was run.

See [changes.md](../../../changes.md) for the implementation walkthrough and verification details.
