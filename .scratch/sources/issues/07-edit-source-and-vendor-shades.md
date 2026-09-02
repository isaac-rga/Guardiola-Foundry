# 07 — Edit Source data and Vendor Shades

**What to build:** Let Admins and Operators correct and enrich an existing Source, including its Vendor Shades, while protecting application identity and import provenance. Attention states must respond to saved data and future-cost inputs must remain informational.

**Blocked by:** 05 — Inspect Source detail; 06 — Create a Source from the catalog.

**Status:** done

- [x] Admins and Operators can edit Source commercial, technical, manual Landed Unit Cost, and future-costing fields.
- [x] Admins and Operators can add, update, and remove Vendor Shades without introducing a Vendor Shade lifecycle.
- [x] Source public ID and legacy Source provenance are visible but immutable.
- [x] Vendor remains required free text and editing does not introduce a separate Vendor entity.
- [x] Controlled Textile Family, Purchase Presentation, Purchase Unit, and Vendor Currency values remain enforced.
- [x] Saving Landed Unit Cost clears `Cost needs attention`; removing it from an Active Source restores that condition.
- [x] Optional data changes update `Data needs attention` without blocking the Source's validity.
- [x] Future-costing inputs never recalculate or overwrite Landed Unit Cost.
- [x] Missing global Currency Conversion Rate does not block editing a USD Source.
- [x] Field-level errors preserve unsaved user input and successful edits refresh the catalog and detail views.
- [x] Unauthenticated users cannot update Sources.
- [x] Focused API and route tests cover editable fields, Vendor Shade management, immutable identity, validation, attention changes, cache refresh behavior, missing-rate behavior, and non-calculation.

## Comments

- 2026-09-02: Implemented authenticated `PUT /sources/:sourceId` and `/app/sources/$sourceId/edit`. Source identity, legacy provenance, lifecycle status, normalized unit, and Material relationships remain outside the editable contract. Commercial, technical, future-cost, manual Landed Unit Cost, and Vendor Shade changes save transactionally; removed referenced shades clear only their shade association. Detail data is replaced from the update response and Source lists are invalidated after success. Focused API and web route tests, workspace lint and typecheck, production builds, and the complete API and web test suites passed.
