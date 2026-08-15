# 07 — Edit Source data and Vendor Shades

**What to build:** Let Admins and Operators correct and enrich an existing Source, including its Vendor Shades, while protecting application identity and import provenance. Attention states must respond to saved data and future-cost inputs must remain informational.

**Blocked by:** 05 — Inspect Source detail; 06 — Create a Source from the catalog.

**Status:** ready-for-agent

- [ ] Admins and Operators can edit Source commercial, technical, manual Landed Unit Cost, and future-costing fields.
- [ ] Admins and Operators can add, update, and remove Vendor Shades without introducing a Vendor Shade lifecycle.
- [ ] Source public ID and legacy Source provenance are visible but immutable.
- [ ] Vendor remains required free text and editing does not introduce a separate Vendor entity.
- [ ] Controlled Textile Family, Purchase Presentation, Purchase Unit, and Vendor Currency values remain enforced.
- [ ] Saving Landed Unit Cost clears `Cost needs attention`; removing it from an Active Source restores that condition.
- [ ] Optional data changes update `Data needs attention` without blocking the Source's validity.
- [ ] Future-costing inputs never recalculate or overwrite Landed Unit Cost.
- [ ] Missing global Currency Conversion Rate does not block editing a USD Source.
- [ ] Field-level errors preserve unsaved user input and successful edits refresh the catalog and detail views.
- [ ] Unauthenticated users cannot update Sources.
- [ ] Focused API and route tests cover editable fields, Vendor Shade management, immutable identity, validation, attention changes, cache refresh behavior, missing-rate behavior, and non-calculation.
