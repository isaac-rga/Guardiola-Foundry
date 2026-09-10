# Use Pattern Sets in BOM Lines

BOM Template lines can now retain an optional Pattern Set, consult its current width-based Quantity Proposals, and explicitly copy a proposal into editable Final meters. Pattern guidance remains advisory: the BOM persists only the Pattern Set reference and final quantity, while API reads retain retired Pattern Sets as historical construction context.

## Scope Anchor

This slice implements `.scratch/bill-of-materials-builder/issues/09-use-pattern-sets-in-bom-lines.md` on the existing Bills of Materials and Pattern Set modules. It preserves the approved Construction Board layout and language while adding the Pattern Set control beside Material and exposing proposals as a secondary action.

## Implementation Journey

The shared contracts now describe the optional line reference, active bounded Pattern Set search results, usage-impact counts, and the independent `pattern-needs-attention` signal. A nullable restricted foreign key retains the Pattern Set identity on each BOM Line without coupling it to Material completeness, verification, or cost projection.

Template creation locks and resolves all selected Pattern Sets inside the existing transaction and rejects a retired or missing selection before any BOM record is written. Read projection hydrates the current Pattern Set name, lifecycle status, and proposal count, so retirement and restoration change live attention without mutating the saved BOM.

Pattern Set routes now support authenticated active search, retained-detail lookup including proposals, and BOM-owned usage counts. The catalog consults those counts before editing or retiring a referenced Pattern Set and presents a non-blocking confirmation with both affected BOM Line and Bill of Materials totals.

In the Builder, Pattern Set selection is independent from Material and Final meters. Proposal cards show assumed width, proposed meters, evidence, and the current Material width match. `Use proposed quantity` performs the same ordinary quantity edit as manual entry, including the existing verification-reset rule; changing or removing the Pattern Set itself leaves quantity and verification untouched.

## Important Behavior

- Ordinary selection returns at most 25 active Pattern Sets and signals when more matches exist; retired Pattern Sets are excluded from new choices.
- Retained Pattern Sets are loaded by stable identity even after retirement, preserving their current proposal context for the existing-BOM Builder workflow in issue 11.
- Material, Source, and Pattern attention are derived independently, may coexist on one line, and contribute once per affected line to the derived Whole BOM count.
- Pattern Set edit and retirement confirmations report distinct affected BOM and line counts without blocking unreferenced catalog changes.
- A Pattern Set retired after selection is rejected at save with a Pattern Set field error, and the Builder keeps the unsaved draft in place.

## Responsibility Check

- Pattern Sets own catalog lifecycle, searchable identity, and Quantity Proposal detail.
- Bills of Materials own the optional persisted reference, save-time eligibility check, usage-impact counting, and live line attention.
- The Builder owns the explicit copy interaction only; it does not persist a proposal choice, assumed width, evidence note, or derived history.

This keeps the cross-domain dependency narrow: Pattern Set mutation asks a BOM-owned query for impact, while BOM reads current Pattern Set context without moving construction decisions into the Pattern Set catalog.

## Evidence

- Pattern Set API functional file: 9 tests passed, covering active bounded search, retained detail, usage counts, lifecycle, and authorization.
- Issue-specific BOM API tests: 2 tests passed independently, covering retained/retired/restored context, coexisting attention, and atomic stale-selection rejection.
- Builder and Pattern Set route tests: 2 files and 17 tests passed, covering remote selection, proposal copying, verification interaction, removal/reselection, save payloads, field-level stale-selection handling, and referenced mutation confirmations.
- API, web, shared-types, and shared-validation lint and TypeScript checks passed.
- The new development migration applied successfully and migration status reports it complete.
- Scoped Prettier verification and `git diff --check` passed.

## Boundaries

This slice does not add automatic meter calculation, persist which proposal was used, introduce BOM update semantics, or redesign the approved prototype. Because issue 11 owns opening and atomically saving existing BOMs, persisted retired-reference removal/copying and unchanged retained-reference saving remain pending there; issue 09 is marked partially complete rather than claiming those two workflow assertions prematurely. Complete test suites and `pnpm quality` were intentionally not run. A combined run of the existing BOM functional file was not used as acceptance evidence because its shared mutable Material fixtures interfere when run together; the two issue-specific cases pass independently, and repairing that broader test isolation is outside issue 09.
