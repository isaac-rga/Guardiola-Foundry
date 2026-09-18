# 09 — Use Pattern Sets in BOM Lines

**What to build:** Let Users attach reusable Pattern Sets to BOM Lines, consult their current width-based Quantity Proposals, and explicitly use a proposed quantity without surrendering the final Material Quantity decision. Retired references remain usable as historical construction context and catalog mutations explain their current impact.

**Blocked by:** 03 — Manage the Pattern Set catalog; 06 — Verify complete BOM Lines; 07 — Project live material costs and sourcing attention.

**Status:** partially-complete

- [x] A BOM Line can retain zero or one Pattern Set independently from Construction Piece, Material, Source, and BOM Line Completeness.
- [x] Pattern Set selection uses an authenticated, bounded remote-search dialog showing name, stable identity, and Quantity Proposal count.
- [x] The Builder exposes proposals only when the selected Pattern Set currently has them and shows assumed width, proposed meters, and evidence note.
- [x] `Use proposed quantity` explicitly copies the chosen number into editable Material Quantity and stores no proposal selection, assumed width, evidence, or history.
- [x] Using a proposal follows the ordinary quantity-change verification rule and never performs automatic meter calculation.
- [x] Changing or removing Pattern Set preserves Material Quantity and BOM Line Verification.
- [x] Deriving attention for a retained Retired Pattern Set produces `Pattern needs attention` without changing completeness, verification, cost eligibility, or saveability.
- [ ] A retained Retired Pattern Set remains visible, removable, consultable, and copyable but is absent from ordinary new selections.
- [x] Material, Source, and Pattern attention conditions can coexist independently on one line and contribute to the Whole BOM attention count.
- [x] Editing or retiring a referenced Pattern Set requires a non-blocking confirmation showing affected BOM Line and Bill of Materials counts.
- [x] Pattern Set edits and retirement leave retained final quantities and verification unchanged; restoration clears `Pattern needs attention` without mutating the Bill of Materials.
- [ ] Newly selected Pattern Sets retired before Save are rejected with a field-level error while the local draft is preserved; unchanged retained references remain saveable.
- [x] Focused API functional, Pattern Set route, and Builder-route tests cover selection, proposals, verification interaction, retirement, restoration, impact confirmation, stale selection, retained references, and coexisting attention.

**Remaining dependency:** The API retains and projects Retired Pattern Set context, and the creation draft keeps a stale selection visible, removable, consultable, and copyable. Exercising those actions on a persisted BOM and saving an unchanged retained reference requires the existing-BOM open/update workflow assigned to issue 11; this slice does not pre-implement that workflow.
