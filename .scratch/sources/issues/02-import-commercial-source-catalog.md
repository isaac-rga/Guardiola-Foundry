# 02 — Import the commercial Source catalog

**What to build:** Expand the Source model with the required commercial catalog data and migrate every valid workbook row categorized as `Textil`, including Unlinked Sources. Invalid records must remain anchored to correction in the original workbook through one actionable migration report rather than being guessed or partially persisted.

**Blocked by:** 01 — Adopt stable Source identity.

**Status:** done

- [x] The existing Source model stores Source Name, Vendor, Textile Family, Purchase Presentation, optional fixed piece length, Purchase Unit, Minimum Purchase Quantity, Purchase Price per unit, Price Date, Vendor Currency, optional Landed Unit Cost, and Source Status.
- [x] Source Name, Vendor, Textile Family, Purchase Presentation, Purchase Unit, Minimum Purchase Quantity, Purchase Price, Price Date, and Vendor Currency form the required commercial core.
- [x] Purchase Presentation is limited to Roll or Piece, Purchase Unit is limited to Meter or Yard, and fixed piece length remains distinct from Minimum Purchase Quantity.
- [x] Vendor Currency is limited to USD or MXN, while Landed Unit Cost is stored independently as an optional nonnegative MXN-per-meter value.
- [x] Textile Family is controlled by the exact seeded workbook values defined in the PRD.
- [x] Every valid `Textil` Source row is considered for import, including Sources without a Material link; Supply, Tool, and workshop rows are excluded.
- [x] A Source missing or violating the required commercial core is excluded without a partial Source record being persisted.
- [x] A Material with zero or multiple Preferred Sources is excluded rather than repaired through an inferred choice.
- [x] Every exclusion reports its legacy ID, record type, invalid or missing fields, and corrective guidance in one structured result.
- [x] Valid records may persist alongside exclusions, but any exclusion makes the overall migration result non-successful.
- [x] Import reruns do not duplicate records or reassign stable Source IDs.
- [x] Focused database-backed importer tests cover the complete inclusion boundary, validation, exclusions, report contents, partial-success semantics, and rerun stability.

## Comments

- Expanded the existing Source shell in place with the commercial catalog fields. The schema migration renames provisional `provider` and normalized-cost columns to the approved Vendor and Landed Unit Cost language while leaving newly introduced core columns nullable only for pre-catalog rows; the importer is the current write boundary and rejects incomplete incoming records.
- Added one Source-owned catalog vocabulary for the exact Textile Families plus Purchase Presentation, Purchase Unit, Vendor Currency, and Source Status. Missing imported Source Status defaults to Active because status is not part of the required commercial core.
- Derived a checked-in fixture from all 280 populated workbook Sourcing rows: 156 `Textil`, 85 production-supply, 23 workshop-supply, and 16 Tool rows. The workbook has no auditable Price Date column, so the implementation does not invent dates; all 156 `Textil` rows currently appear in the actionable exclusion report until the workbook is corrected.
- Added the dedicated `source:import-catalog` command. It prints one structured report, persists any valid rows, excludes invalid rows without partial persistence, ignores the 124 non-textile rows, and returns exit code 1 whenever exclusions remain. Normal development `db:seed` remains repeatable and successful.
- Replaced the old first-linked-Source inference with explicit Preferred Source declarations. Materials with zero, multiple, missing, Retired, or costless Preferred Sources are excluded, and Material/link replacement is transactional.
- Preserved the existing authenticated Materials API and table behavior by projecting canonical Vendor and Landed Unit Cost fields through the established lean Material summary contract.
- Verified through the complete workbook-boundary test, commercial validation and partial-success tests, explicit Preferred Source tests, transaction rollback coverage, rerun/stable-ID coverage, Materials API regressions, migration application/status, repository lint/typecheck/test/build commands, and the required two-axis review summarized in `changes.md`.
