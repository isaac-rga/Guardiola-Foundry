# 07 — Verify and close the unified filter migration

**What to build:** Complete the unified release by verifying the shared filter experience across all five table surfaces, removing any residual legacy filter presentation, and resolving cross-catalog inconsistencies discovered during focused visual and behavioral review. The result should be one coherent production standard rather than a mixture of old and new patterns.

**Blocked by:** 03 — Standardize Sources with Include retired; 04 — Standardize Bills of Materials filters; 05 — Standardize Pattern Set filters; 06 — Standardize Product Variant filters.

**Status:** ready-for-agent

- [ ] Products, Sources, Bills of Materials, Pattern Sets, and Product Variants all match the approved shared composition while retaining only their documented feature-specific criteria and state ownership.
- [ ] Visual review confirms prototype fidelity for toolbar proportions, chips, popover hierarchy, close behavior, wrapping, historical badges, empty results, and permission recovery on all applicable surfaces.
- [ ] Repository search confirms that prototype gates, prototype-only messages, rejected variants, and superseded legacy filter controls are absent from production paths.
- [ ] Focused frontend and backend checks pass for the affected surfaces, with no duplicated full interaction suites and no unrelated repository-wide quality work added.
- [ ] The implementation remains aligned with the durable Table Filter Standard and the parent specification, and any necessary exception is documented explicitly before release.
