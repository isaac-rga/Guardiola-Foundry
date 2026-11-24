# 07 — Verify and close the unified filter migration

**What to build:** Complete the unified release by verifying the shared filter experience across all five table surfaces, removing any residual legacy filter presentation, and resolving cross-catalog inconsistencies discovered during focused visual and behavioral review. The result should be one coherent production standard rather than a mixture of old and new patterns.

**Blocked by:** 03 — Standardize Sources with Include retired; 04 — Standardize Bills of Materials filters; 05 — Standardize Pattern Set filters; 06 — Standardize Product Variant filters.

**Status:** done

- [x] Products, Sources, Bills of Materials, Pattern Sets, and Product Variants all match the approved shared composition while retaining only their documented feature-specific criteria and state ownership.
- [x] Visual review confirms prototype fidelity for toolbar proportions, chips, popover hierarchy, close behavior, wrapping, historical badges, empty results, and permission recovery on all applicable surfaces.
- [x] Repository search confirms that prototype gates, prototype-only messages, rejected variants, and superseded legacy filter controls are absent from production paths.
- [x] Focused frontend and backend checks pass for the affected surfaces, with no duplicated full interaction suites and no unrelated repository-wide quality work added.
- [x] The implementation remains aligned with the durable Table Filter Standard and the parent specification, and any necessary exception is documented explicitly before release.

## Verification

- Compared the production composition with the approved Variant A source in `58c1fa3`. Production paths contain no prototype route gate, labels, confirmation messages, or alternate toolbar. The obsolete URL parameter remains covered by the Products normalization test.
- Reviewed all five tables at 1043 px and 390 px in a browser using the running web app and an isolated API fixture. Confirmed toolbar proportions, chip wrapping, the popover hierarchy and dismissal, Collection search, historical badges, empty-result guidance, Admin-only historical criteria, and session-preserving `403` recovery. Bills of Materials kept its global summary and Product Variants kept the parent URL. The Pattern Sets popover aligned with the table edge after its toolbar moved into the card content.
- Verified that clearing a denied Product selection retries the default API query even when the previous default result is still fresh in the cache. The regression failed before the fix and passed afterward. Independent standards and specification reviews passed.
- Seven web suites passed 137 tests. Five API functional suites passed 40 tests using an isolated PostgreSQL database with `en_US.UTF-8` collation. Both app type checks and lint on the migration files passed.

A pending search draft can still settle after Back or Forward when adjacent entries have the same effective search value. The history checks cover applied criteria and effective search values. Catalog authentication consolidation remains tracked in [issue 08](08-consolidate-catalog-authentication-failure-handling.md).
