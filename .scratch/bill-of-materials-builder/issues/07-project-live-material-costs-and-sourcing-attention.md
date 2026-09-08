# 07 — Project live material costs and sourcing attention

**What to build:** Show Users the current material-cost implication of a Bill of Materials without storing Source or cost evidence on its lines. Calculable amounts, excluded lines, and independent Material or Source attention conditions must remain honest when catalog references become unavailable.

**Blocked by:** 05 — Compose Template BOM Lines with Materials.

**Status:** ready-for-agent

- [ ] A BOM Line persists only its Material reference and construction data, never Source, Vendor Shade, width, unit cost, calculated cost, currency, price date, or effective-date evidence.
- [ ] The Builder shows current Preferred Source name, Vendor, Vendor Shade or detail, width, and Landed Unit Cost as read-only Material context when available.
- [ ] A calculable line projection equals Material Quantity multiplied by Landed Unit Cost in MXN per meter and is rounded to the nearest cent.
- [ ] An explicit Landed Unit Cost of MXN zero is calculable, while an absent cost is unavailable.
- [ ] The Bill of Materials projection sums already rounded visible line projections so line and aggregate amounts reconcile.
- [ ] Projection availability is Complete when all lines are calculable, Partial when some are calculable, and Unavailable when none are calculable, including no-line Bills of Materials.
- [ ] Partial projection shows the calculable sum and excluded-line count; Unavailable projection is never displayed as MXN zero.
- [ ] Excluded lines identify missing Material, missing Material Quantity, or no usable Landed Unit Cost independently from completeness and verification.
- [ ] A retained unavailable Material remains visible, replaceable, removable, and saveable and derives `Material needs attention` without automatically losing cost eligibility.
- [ ] A line with no usable current or retained Preferred Source relationship and Landed Unit Cost derives `Source needs attention` and is excluded from cost.
- [ ] Material and Source attention may coexist and never block Save, verification, or use.
- [ ] The API is authoritative for projection on load and Save; the Builder may preview from loaded data and replaces that preview with the canonical response.
- [ ] Focused domain, API functional, and Builder-route tests cover rounding, repeated Materials, explicit zero, every availability state, exclusions, live Source changes, retained references, and independent attention.
