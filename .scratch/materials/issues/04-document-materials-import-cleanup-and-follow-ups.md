# Document Materials import cleanup and follow-up boundaries

Status: done

## Parent

.scratch/materials/PRD.md

## What to build

Document the operational cleanup and follow-up boundaries discovered while implementing the first Materials list. The result should make the first slice easier to hand off: which spreadsheet rows were excluded because their Source links were invalid, what Source/Supply/Tool data remains outside the first Materials slice, and which follow-up workflows should be planned separately.

This issue is documentation and tracker upkeep for the Materials feature. It should not change the parent PRD's scope or implement deferred workflows.

## Acceptance criteria

- [x] The Materials planning artifacts identify that only Materials with valid linked Sources are imported into the first listed dataset.
- [x] Excluded or unresolved spreadsheet rows are documented at a useful level for future cleanup without pasting sensitive or excessive spreadsheet content.
- [x] Deferred Source work is called out separately from the first Materials list, including Source table/detail, Source technical fields, Source images, Preferred Source changes, and Source deletion warnings.
- [x] Deferred Supply, Tool, Inventory, Inventory movement, and Bill of Materials work remains clearly out of scope for this Materials slice.
- [x] Deferred table search, filters, pagination, summary stats, dashboards, category charts, bulk actions, and URL-synced table state remain clearly out of scope.
- [x] The issue or related comments record any implementation notes future agents need to avoid treating the temporary spreadsheet `En BOMs` column as a domain concept.

## Blocked by

- .scratch/materials/issues/01-persist-imported-materials-and-sources.md

## Comments

Completed the Materials cleanup and follow-up documentation pass. The parent PRD now records the implementation cleanup boundary: the first import/list only includes Materials whose linked Source IDs resolve to imported Sources. The current fixture keeps the example intentionally small and non-exhaustive: `MAT-999` is skipped because it references unresolved Source ID `SRC-MISSING`.

Future cleanup should reconcile unresolved Material rows back to the source spreadsheet before they are imported. Future agents should not relax the first-list invariant by listing draft Materials without a Preferred Source.

Deferred Source work remains separate from this Materials slice: Source table/detail screens, Source technical fields, Source images, Preferred Source changes, and Source deletion warnings should be planned independently.

Deferred Supply, Tool, Inventory, Inventory movement, and Bill of Materials work also remains out of scope. Those workflows depend on the Materials model but should not be folded into this textile Materials list.

Deferred table mechanics remain out of scope until the product need is explicit: search, filters, pagination, summary stats, dashboards, category charts, bulk actions, and URL-synced table state.

The temporary spreadsheet `En BOMs` column remains a spreadsheet filter, not a domain concept. Keep the app language anchored on `Material`, `Source`, `Preferred Source`, `Material Use`, `Material Color`, `Material Unit`, and Source-owned `Textile Family`.
