# 06 — Create a Source from the catalog

**What to build:** Let Admins and Operators create an operational Source from the authoritative Sources catalog. The workflow must enforce the commercial core, preserve entered values when validation fails, and allow a valid Source to exist without Landed Unit Cost while making its costing limitation clear.

**Blocked by:** 04 — Browse and filter the Source catalog.

**Status:** ready-for-agent

- [ ] Admins and Operators can start Source creation from the Sources catalog and save a valid Source.
- [ ] Source creation is unavailable to unauthenticated users.
- [ ] Required commercial fields, controlled values, positive quantity rules, nonnegative prices, and Price Date are validated consistently at the API and UI boundaries.
- [ ] A created Source receives the next stable `S-` public ID and has no fabricated legacy Source ID.
- [ ] New Sources default to Active.
- [ ] Optional commercial, technical, future-costing, and manual Landed Unit Cost fields can be supplied during creation.
- [ ] A Source may be saved without Landed Unit Cost and then displays `Cost needs attention`.
- [ ] Missing optional information may display `Data needs attention` but does not block creation.
- [ ] Missing global Currency Conversion Rate does not block creating a USD Source.
- [ ] Field-level validation messages appear beside the relevant controls and preserve the user's entered values.
- [ ] The workflow does not calculate Landed Unit Cost from the supplied future-costing inputs.
- [ ] Focused API and route tests cover authorization, successful creation, stable identity, validation, attention states, missing-rate behavior, value preservation, and absence of calculation.
