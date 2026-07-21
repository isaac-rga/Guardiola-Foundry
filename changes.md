# Materials Import Cleanup and Follow-Up Boundaries

This slice completes issue 04 for the Materials feature. It is documentation and tracker upkeep only: no runtime behavior changes were needed after the persisted API, lean table, route states, and Preferred Source attention states were already implemented in the earlier slices.

## Start With The Tracker

Read the completed issue at [.scratch/materials/issues/04-document-materials-import-cleanup-and-follow-ups.md](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/materials/issues/04-document-materials-import-cleanup-and-follow-ups.md).

The issue now records the cleanup boundary directly: the first import/list only includes Materials whose linked Source IDs resolve to imported Sources. The current fixture keeps the example intentionally small and non-exhaustive. `MAT-999` is skipped because it references unresolved Source ID `SRC-MISSING`.

## Then Read The Parent Notes

The parent PRD notes were updated in [.scratch/materials/PRD.md](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/materials/PRD.md).

Those notes preserve the rule future agents should keep intact: a listed Material needs a valid Preferred Source. Unresolved spreadsheet rows should be reconciled back to the source data before import rather than surfaced as draft Materials in this first list.

## Confirm The Import Evidence

The implementation evidence is in [apps/api/database/fixtures/materials_import_fixture.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/database/fixtures/materials_import_fixture.ts) and [apps/api/app/modules/materials/materials_importer.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/app/modules/materials/materials_importer.ts).

The fixture has three valid Materials with resolved Sources and one unresolved example row. The importer skips a Material when any linked Source ID cannot be resolved, so the API starts from active, Source-backed Materials only.

## Keep Follow-Ups Separate

The documentation keeps these deferred areas out of the first Materials slice:

- Source table/detail screens, Source technical fields, Source images, Preferred Source changes, and Source deletion warnings.
- Supplies, Tools, Inventory, Inventory movement, and Bills of Materials.
- Table search, filters, pagination, summary stats, dashboards, category charts, bulk actions, and URL-synced table state.

The temporary spreadsheet `En BOMs` column is also called out again as a spreadsheet filter, not an app domain concept.

## What Did Not Change

No code paths changed in this slice. The Materials API, web table, route states, and tests remain as implemented by issues 01 through 03.
