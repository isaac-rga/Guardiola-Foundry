# 05 — Inspect Source detail and linked Materials

**What to build:** Let authenticated users open a Source and inspect its complete catalog record, including read-only Material usage context. Source detail is the authoritative inspection surface but does not become a second place for changing Material relationships.

**Blocked by:** 04 — Browse and filter the Source catalog.

**Status:** ready-for-agent

- [ ] A Source row opens a stable Source detail route using the app-owned Source ID.
- [ ] Source detail displays commercial data, technical data, future costing inputs, Vendor Shades, Source Status, and attention conditions.
- [ ] Future costing inputs are grouped and labeled to explain that they do not recalculate the manual Landed Unit Cost.
- [ ] IVA is shown as the fixed 16 percent rule and is not presented as a Source-specific editable value.
- [ ] Linked Materials appear as read-only summaries, including historical relationships when applicable.
- [ ] Source detail does not expose link, unlink, Preferred Source, or Material-field mutation controls.
- [ ] Admins and Operators may inspect Active Sources; only Admins may open Retired Source detail.
- [ ] Unauthenticated requests are rejected and unauthorized Retired access does not disclose the record.
- [ ] Loading, missing-record, error, and permission states are understandable and recoverable.
- [ ] Focused API and route tests cover the full detail contract, read-only relationships, authorization, routing, labels, and route states.
