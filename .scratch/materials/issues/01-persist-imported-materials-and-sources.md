# Persist imported Materials and Sources behind the Materials API

Status: ready-for-agent

## Parent

.scratch/materials/PRD.md

## What to build

Build the first persisted Materials tracer bullet: authenticated users can call the Materials list API and receive real Material summary data backed by persisted Materials and Sources imported or seeded from the current spreadsheet. The slice should establish the Material/Source data shape, preserve legacy spreadsheet references, generate app-owned `M-` Material IDs, require each listed Material to have a Preferred Source, derive Material cost from that Preferred Source, and exclude spreadsheet rows with missing or unresolved Source links.

This issue should not expose user-facing create, update, delete, restore, import management, Source management, filtering, search, or pagination.

## Acceptance criteria

- [ ] Authenticated users can request the Materials list API and receive a successful response.
- [ ] Unauthenticated requests to the Materials list API are rejected.
- [ ] The API response is a lean Material summary, not full nested Source records.
- [ ] Each Material summary includes Material ID, name, Material Color, Material Use, Material Unit, Preferred Source reference, derived cost, alternate Source count, and comments when present.
- [ ] Material IDs are app-owned public IDs using the current `M-` prefix and are distinct from preserved legacy spreadsheet IDs.
- [ ] The persisted import/seed preserves legacy Material spreadsheet IDs and Source spreadsheet IDs for reconciliation.
- [ ] Only Materials with valid linked Source data are imported into the first listed dataset.
- [ ] Materials with multiple linked Sources use the first listed Source as the initial Preferred Source.
- [ ] Material cost is derived from the Preferred Source normalized cost rather than copied onto the Material.
- [ ] Materials and Sources support soft deletion in the data model.
- [ ] The Materials list returns active Materials only.
- [ ] Focused API tests cover authentication, the Material summary contract, Preferred Source cost derivation, alternate Source count, import exclusion for invalid Source links, first-linked Preferred Source behavior, legacy ID preservation, and soft-deleted Material exclusion.

## Blocked by

None - can start immediately
