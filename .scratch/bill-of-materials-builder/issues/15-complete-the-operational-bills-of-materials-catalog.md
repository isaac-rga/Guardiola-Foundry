# 15 — Complete the operational Bills of Materials catalog

**What to build:** Complete the validated operational catalog so Users can scan, retrieve, and act on Templates and Implementations together. The catalog should expose compact Product, lineage, line-review, attention, and cost context without turning into the rejected Product workspace or master-detail directions.

**Blocked by:** 14 — Delete and restore Bills of Materials.

**Status:** ready-for-agent

- [ ] One operational table lists Templates and Implementations together with Sources-style density, spacing, numeric alignment, and horizontal overflow.
- [ ] Columns show Bill of Materials name and stable ID, kind, Product context, immediate BOM Origin, current cost projection, total and Verified line counts, and contextual actions.
- [ ] Availability is not a dedicated ordinary column; deleted records appear only when an authorized User explicitly includes them.
- [ ] Catalog search matches name, ID, Product, Product Variant, and current BOM Origin context.
- [ ] Kind filters support All, Templates, and Implementations, and Admins can opt into soft-deleted records.
- [ ] The page summary shows total available Bills of Materials with Template and Implementation counts.
- [ ] The summary separately shows Bills of Materials without associated Product Variant context and Bills of Materials with at least one Unverified line without redundant explanatory subtitles.
- [ ] Partial and Unavailable projections remain visibly distinct from complete totals, and line attention remains discoverable without becoming a stored BOM status.
- [ ] `Create BOM` keeps separate Template and Implementation actions, and each row exposes only contextually valid edit, derive, delete, or restore actions.
- [ ] Blocked actions are hidden or explain their business reason and next step instead of requiring the User to know mutation rules.
- [ ] Loading, failure, empty-result, no-Bills-of-Materials, and filtered-empty states provide clear recovery actions.
- [ ] Catalog state that benefits from refresh or sharing is preserved consistently with existing application catalog patterns.
- [ ] Focused API functional and route tests cover projections, summaries, search, filters, roles, deleted records, context columns, empty and failure states, and contextual actions.
