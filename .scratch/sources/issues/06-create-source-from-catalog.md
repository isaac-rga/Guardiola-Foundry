# 06 — Create a Source from the catalog

**What to build:** Let Admins and Operators create an operational Source from the authoritative Sources catalog. The workflow must enforce the commercial core, preserve entered values when validation fails, and allow a valid Source to exist without Landed Unit Cost while making its costing limitation clear.

**Blocked by:** 04 — Browse and filter the Source catalog.

**Status:** done

- [x] Admins and Operators can start Source creation from the Sources catalog and save a valid Source.
- [x] Source creation is unavailable to unauthenticated users.
- [x] Required commercial fields, controlled values, positive quantity rules, nonnegative prices, and Price Date are validated consistently at the API and UI boundaries.
- [x] A created Source receives the next stable `S-` public ID and has no fabricated legacy Source ID.
- [x] New Sources default to Active.
- [x] Optional commercial, technical, future-costing, and manual Landed Unit Cost fields can be supplied during creation.
- [x] A Source may be saved without Landed Unit Cost and then displays `Cost needs attention`.
- [x] Missing optional information may display `Data needs attention` but does not block creation.
- [x] Missing global Currency Conversion Rate does not block creating a USD Source.
- [x] Field-level validation messages appear beside the relevant controls and preserve the user's entered values.
- [x] The workflow does not calculate Landed Unit Cost from the supplied future-costing inputs.
- [x] Focused API and route tests cover authorization, successful creation, stable identity, validation, attention states, missing-rate behavior, value preservation, and absence of calculation.

## Comments

- 2026-09-02: Implemented authenticated `POST /sources` and `/app/sources/new`. Creation uses the shared Source contract, database-owned stable identity, transactional Vendor Shades, Active defaults, nullable legacy provenance, field-level validation with preserved form values, and the existing attention serializer. Missing Currency Conversion Rate and Landed Unit Cost do not block creation, and no future-cost input calculates Landed Unit Cost.
