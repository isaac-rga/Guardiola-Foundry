# 09 — Open the Material relationship Dialog

**What to build:** Add the authoritative Material detail and relationship Dialog to the Materials view. Users can inspect Material identity plus active and historical Source relationships and navigate between Material and Source context without gaining Material-field editing or relationship mutations yet.

**Blocked by:** 05 — Inspect Source detail and linked Materials.

**Status:** ready-for-agent

- [ ] A Material in the Materials view opens a Dialog containing its read-only identity and Source relationship context.
- [ ] The Dialog distinguishes the Preferred Source, active alternates, and historical Retired Source relationships.
- [ ] Material identity fields remain read-only and no Material create, edit, retire, or restore controls are introduced.
- [ ] The Dialog does not allow Source creation.
- [ ] A Source reference in the Materials view or Material Dialog opens Source detail.
- [ ] A linked Material on Source detail opens the Materials view with the relevant Material Dialog active.
- [ ] Navigation preserves enough route state for refresh and direct entry to reopen the intended context.
- [ ] The relationship-detail API and web route reject unauthenticated access.
- [ ] Loading, missing-record, error, and permission states retain the surrounding Materials view and explain the failure.
- [ ] Focused API and route tests cover relationship summaries, read-only boundaries, active and historical presentation, bidirectional navigation, route state, and failure states.
