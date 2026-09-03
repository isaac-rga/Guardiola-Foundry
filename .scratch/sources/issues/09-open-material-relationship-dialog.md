# 09 — Open the Material relationship Dialog

**What to build:** Add the authoritative Material detail and relationship Dialog to the Materials view. Users can inspect Material identity plus active and historical Source relationships and navigate between Material and Source context without gaining Material-field editing or relationship mutations yet.

**Blocked by:** 05 — Inspect Source detail and linked Materials.

**Status:** done

- [x] A Material in the Materials view opens a Dialog containing its read-only identity and Source relationship context.
- [x] The Dialog distinguishes the Preferred Source, active alternates, and historical Retired Source relationships.
- [x] Material identity fields remain read-only and no Material create, edit, retire, or restore controls are introduced.
- [x] The Dialog does not allow Source creation.
- [x] A Source reference in the Materials view or Material Dialog opens Source detail.
- [x] A linked Material on Source detail opens the Materials view with the relevant Material Dialog active.
- [x] Navigation preserves enough route state for refresh and direct entry to reopen the intended context.
- [x] The relationship-detail API and web route reject unauthenticated access.
- [x] Loading, missing-record, error, and permission states retain the surrounding Materials view and explain the failure.
- [x] Focused API and route tests cover relationship summaries, read-only boundaries, active and historical presentation, bidirectional navigation, route state, and failure states.

## Comments

- 2026-09-02: Added authenticated read-only Material relationship detail, including Preferred, active alternate, and historical Retired Source context with Vendor Shade references. `/app/materials?materialId=M-####` now opens and restores the Dialog, Materials and Source references navigate bidirectionally, and all dialog failure states preserve the surrounding Materials view. No Material or relationship mutation controls were introduced.
