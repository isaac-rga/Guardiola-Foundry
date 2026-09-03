# 03 — Import Source details and Vendor Shades

**What to build:** Complete the imported Source model with optional technical knowledge, future Landed Unit Cost inputs, and Vendor Shades. These values must be preserved as structured facts without implying that the application calculates Landed Unit Cost or that optional omissions make a Source invalid.

**Blocked by:** 02 — Import the commercial Source catalog.

**Status:** done

- [x] The Source model supports optional Vendor SKU, URL, description, manufacturer, fiber, composition, GSM, width, finish, weave, presentation notes, country of origin, and comments.
- [x] GSM is represented in grams per square meter and width in centimeters.
- [x] Estimated shipping is represented in USD per kilogram and IGI as a Source-specific percentage.
- [x] IVA is represented as the fixed 16 percent business rule rather than as a Source-specific editable value.
- [x] Future costing inputs are stored without calculating or changing the manually entered Landed Unit Cost.
- [x] A Source owns zero or more optional Vendor Shades containing the Vendor's shade name or code.
- [x] A Material–Source relationship may reference one Vendor Shade owned by its linked Source and may omit the shade when none is known.
- [x] Persistence rejects a relationship that references a Vendor Shade owned by another Source.
- [x] Imported optional fields and Vendor Shades are preserved for every valid Source row that supplies them.
- [x] An Active Source without Landed Unit Cost derives `Cost needs attention`, while missing optional information derives the non-blocking `Data needs attention` state.
- [x] Missing optional details or Vendor Shades do not invalidate a Source or prevent a Material link.
- [x] Focused database-backed importer tests cover optional-field preservation, canonical units, shade ownership, attention derivation, and the absence of Landed Unit Cost calculation.

## Comments

- Implemented Source-owned optional details, canonical future-cost inputs, fixed IVA vocabulary, Vendor Shade persistence, nullable relationship shade selection, database-enforced shade ownership, and derived attention states.
- Preserved 1,089 populated optional workbook facts plus 85 explicit Vendor Shade values from 66 `Color:`/`Colors:` descriptions. Omitted one contradictory one-inch width instead of importing the repeated `5 cm` value.
- Verification: 19 focused importer tests, 55 complete API tests, and 37 web tests pass. Repository lint, strict typecheck, production builds, migration application/status, normal seeding, and the expected 156-exclusion catalog audit all pass or return their documented expected result.
- The required Standards and Spec reviews both report no remaining findings after corrections.
- Changes remain uncommitted for user review.
