# Document Materials import cleanup and follow-up boundaries

Status: ready-for-agent

## Parent

.scratch/materials/PRD.md

## What to build

Document the operational cleanup and follow-up boundaries discovered while implementing the first Materials list. The result should make the first slice easier to hand off: which spreadsheet rows were excluded because their Source links were invalid, what Source/Supply/Tool data remains outside the first Materials slice, and which follow-up workflows should be planned separately.

This issue is documentation and tracker upkeep for the Materials feature. It should not change the parent PRD's scope or implement deferred workflows.

## Acceptance criteria

- [ ] The Materials planning artifacts identify that only Materials with valid linked Sources are imported into the first listed dataset.
- [ ] Excluded or unresolved spreadsheet rows are documented at a useful level for future cleanup without pasting sensitive or excessive spreadsheet content.
- [ ] Deferred Source work is called out separately from the first Materials list, including Source table/detail, Source technical fields, Source images, Preferred Source changes, and Source deletion warnings.
- [ ] Deferred Supply, Tool, Inventory, Inventory movement, and Bill of Materials work remains clearly out of scope for this Materials slice.
- [ ] Deferred table search, filters, pagination, summary stats, dashboards, category charts, bulk actions, and URL-synced table state remain clearly out of scope.
- [ ] The issue or related comments record any implementation notes future agents need to avoid treating the temporary spreadsheet `En BOMs` column as a domain concept.

## Blocked by

- .scratch/materials/issues/01-persist-imported-materials-and-sources.md
