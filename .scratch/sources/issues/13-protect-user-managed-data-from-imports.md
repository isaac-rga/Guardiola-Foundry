# 13 — Protect user-managed data from future imports

**What to build:** Make future Source imports additive and non-destructive after users begin maintaining the catalog. Imports may contribute genuinely new records and untouched imported information, but application-managed commercial decisions and relationships must remain authoritative.

**Blocked by:** 07 — Edit Source data and Vendor Shades; 11 — Replace the Preferred Source atomically; 12 — Retire and restore Sources safely.

**Status:** done

- [x] A later import can add a new valid Source without duplicating existing Sources or reassigning public IDs.
- [x] A later import can populate imported fields that have never been changed through application management.
- [x] A later import cannot overwrite Source fields that users have edited in the application, including manual Landed Unit Cost and Vendor Shade data.
- [x] A later import cannot replace, remove, or recreate Material–Source links maintained in the application.
- [x] A later import cannot change Source Status or restore a Retired Source.
- [x] A later import cannot change Preferred Source choices or relationship Vendor Shade selections.
- [x] Import processing remains atomic within each record so an invalid update cannot partially overwrite that record.
- [x] Invalid or conflicting incoming records appear in the structured migration report with actionable guidance.
- [x] Any exclusion or protected-field conflict keeps the overall import result non-successful even when safe additive records persist.
- [x] Import reruns remain stable and do not duplicate Sources, Vendor Shades, or relationships.
- [x] Focused database-backed importer tests first create realistic user-managed changes and then prove that a subsequent import preserves every protected decision while accepting safe additions.
