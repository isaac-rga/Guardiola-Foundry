# 01 — Adopt stable Source identity

**What to build:** Expand the existing minimal Source persistence shell in place into the canonical Source identity foundation. Existing Materials must continue working while Source records move from provisional `MS-` identifiers to stable sequential `S-` identifiers, legacy spreadsheet provenance becomes optional and immutable, and Material–Source relationship constraints become safe for later mutations. Do not create a parallel Source model or table.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Existing Source records receive stable sequential public IDs using the `S-0001` convention, and existing `MS-` identifiers are no longer exposed as the routing contract.
- [ ] Source public-ID allocation is independent of spreadsheet row order and does not reassign an existing Source during reruns.
- [ ] Legacy Source ID is optional for app-created records, remains available as immutable provenance when imported, and is not used as application identity.
- [ ] The existing minimal Source persistence shell is expanded in place; no competing Source model or duplicate Source table is introduced.
- [ ] Database rules continue preventing duplicate Material–Source links and prevent more than one Preferred Source link for the same Material.
- [ ] The authenticated Materials list continues returning Preferred Source references, derived cost, and alternate counts after the identity migration.
- [ ] Existing Materials UI behavior remains operational with the new `S-` Source references.
- [ ] Focused migration, API, and web tests cover ID conversion, stable allocation, nullable legacy provenance, relationship uniqueness, and preservation of the Materials experience.
