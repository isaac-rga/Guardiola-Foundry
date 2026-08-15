# 03 — Import Source details and Vendor Shades

**What to build:** Complete the imported Source model with optional technical knowledge, future Landed Unit Cost inputs, and Vendor Shades. These values must be preserved as structured facts without implying that the application calculates Landed Unit Cost or that optional omissions make a Source invalid.

**Blocked by:** 02 — Import the commercial Source catalog.

**Status:** ready-for-agent

- [ ] The Source model supports optional Vendor SKU, URL, description, manufacturer, fiber, composition, GSM, width, finish, weave, presentation notes, country of origin, and comments.
- [ ] GSM is represented in grams per square meter and width in centimeters.
- [ ] Estimated shipping is represented in USD per kilogram and IGI as a Source-specific percentage.
- [ ] IVA is represented as the fixed 16 percent business rule rather than as a Source-specific editable value.
- [ ] Future costing inputs are stored without calculating or changing the manually entered Landed Unit Cost.
- [ ] A Source owns zero or more optional Vendor Shades containing the Vendor's shade name or code.
- [ ] A Material–Source relationship may reference one Vendor Shade owned by its linked Source and may omit the shade when none is known.
- [ ] Persistence rejects a relationship that references a Vendor Shade owned by another Source.
- [ ] Imported optional fields and Vendor Shades are preserved for every valid Source row that supplies them.
- [ ] An Active Source without Landed Unit Cost derives `Cost needs attention`, while missing optional information derives the non-blocking `Data needs attention` state.
- [ ] Missing optional details or Vendor Shades do not invalidate a Source or prevent a Material link.
- [ ] Focused database-backed importer tests cover optional-field preservation, canonical units, shade ownership, attention derivation, and the absence of Landed Unit Cost calculation.
