# 02 — Import the commercial Source catalog

**What to build:** Expand the Source model with the required commercial catalog data and migrate every valid workbook row categorized as `Textil`, including Unlinked Sources. Invalid records must remain anchored to correction in the original workbook through one actionable migration report rather than being guessed or partially persisted.

**Blocked by:** 01 — Adopt stable Source identity.

**Status:** ready-for-agent

- [ ] The existing Source model stores Source Name, Vendor, Textile Family, Purchase Presentation, optional fixed piece length, Purchase Unit, Minimum Purchase Quantity, Purchase Price per unit, Price Date, Vendor Currency, optional Landed Unit Cost, and Source Status.
- [ ] Source Name, Vendor, Textile Family, Purchase Presentation, Purchase Unit, Minimum Purchase Quantity, Purchase Price, Price Date, and Vendor Currency form the required commercial core.
- [ ] Purchase Presentation is limited to Roll or Piece, Purchase Unit is limited to Meter or Yard, and fixed piece length remains distinct from Minimum Purchase Quantity.
- [ ] Vendor Currency is limited to USD or MXN, while Landed Unit Cost is stored independently as an optional nonnegative MXN-per-meter value.
- [ ] Textile Family is controlled by the exact seeded workbook values defined in the PRD.
- [ ] Every valid `Textil` Source row is considered for import, including Sources without a Material link; Supply, Tool, and workshop rows are excluded.
- [ ] A Source missing or violating the required commercial core is excluded without a partial Source record being persisted.
- [ ] A Material with zero or multiple Preferred Sources is excluded rather than repaired through an inferred choice.
- [ ] Every exclusion reports its legacy ID, record type, invalid or missing fields, and corrective guidance in one structured result.
- [ ] Valid records may persist alongside exclusions, but any exclusion makes the overall migration result non-successful.
- [ ] Import reruns do not duplicate records or reassign stable Source IDs.
- [ ] Focused database-backed importer tests cover the complete inclusion boundary, validation, exclusions, report contents, partial-success semantics, and rerun stability.
