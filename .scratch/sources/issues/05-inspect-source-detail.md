# 05 — Inspect Source detail and linked Materials

**What to build:** Let authenticated users open a Source and inspect its complete catalog record, including read-only Material usage context. Source detail is the authoritative inspection surface but does not become a second place for changing Material relationships.

**Blocked by:** 04 — Browse and filter the Source catalog.

**Status:** done

- [x] A Source row opens a stable Source detail route using the app-owned Source ID.
- [x] Source detail displays commercial data, technical data, future costing inputs, Vendor Shades, Source Status, and attention conditions.
- [x] Future costing inputs are grouped and labeled to explain that they do not recalculate the manual Landed Unit Cost.
- [x] IVA is shown as the fixed 16 percent rule and is not presented as a Source-specific editable value.
- [x] Linked Materials appear as read-only summaries, including historical relationships when applicable.
- [x] Source detail does not expose link, unlink, Preferred Source, or Material-field mutation controls.
- [x] Admins and Operators may inspect Active Sources; only Admins may open Retired Source detail.
- [x] Unauthenticated requests are rejected and unauthorized Retired access does not disclose the record.
- [x] Loading, missing-record, error, and permission states are understandable and recoverable.
- [x] Focused API and route tests cover the full detail contract, read-only relationships, authorization, routing, labels, and route states.

## Comments

- 2026-09-01: Implemented the authenticated detail contract and `/app/sources/$sourceId` inspection route. Retired Source access uses the same 404 response as a missing Source for Operators, preserving the non-disclosure requirement. No Source or Material mutation controls were added.
