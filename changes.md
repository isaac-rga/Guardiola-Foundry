# Commercial Source Catalog Import

This slice completes Sources issue 02. It expands the existing Source persistence shell into the commercial catalog model, evaluates the complete workbook Sourcing dataset, and replaces inferred Preferred Source selection with an explicit, transactional import rule.

## Start With The Issue

Read the completed tracker item at [.scratch/sources/issues/02-import-commercial-source-catalog.md](.scratch/sources/issues/02-import-commercial-source-catalog.md). The issue is limited to persistence and migration behavior. Source technical details, Vendor Shades, and attention derivation remain in issue 03; Source browsing begins in issue 04.

## Follow The Commercial Model

Open [apps/api/database/migrations/1786766400000_add_source_commercial_catalog.ts](apps/api/database/migrations/1786766400000_add_source_commercial_catalog.ts), then [apps/api/app/models/material_source.ts](apps/api/app/models/material_source.ts).

The migration expands `material_sources` in place. `provider` becomes the approved Vendor term, and the old normalized-cost column becomes Landed Unit Cost. The model now stores Purchase Presentation, fixed piece length, Purchase Unit, Minimum Purchase Quantity, Purchase Price, Price Date, Vendor Currency, optional Landed Unit Cost, and Source Status.

New commercial-core columns remain nullable at the database transition only because pre-catalog rows already exist and the migration must not fabricate workbook facts. The importer is the current write boundary and accepts only complete commercial-core records. The generated schema representation is in [apps/api/database/schema.ts](apps/api/database/schema.ts).

## Inspect The Source-Owned Vocabulary

Next, read [apps/api/app/modules/sources/source_catalog.ts](apps/api/app/modules/sources/source_catalog.ts).

This module is the API-local authority for the twelve workbook Textile Families, Roll/Piece Purchase Presentation, Meter/Yard Purchase Unit, USD/MXN Vendor Currency, and Active/Retired Source Status. It also performs pure commercial-row validation. Source Status is deliberately not part of the required commercial core: a missing imported status defaults to Active.

## Compare The Importer With The Workbook Evidence

The checked-in source data is [apps/api/database/fixtures/source_catalog_import_fixture.ts](apps/api/database/fixtures/source_catalog_import_fixture.ts). It was derived from all 280 populated rows in the workbook's `Sourcing` sheet:

- 156 `Textil` rows are considered for the Source catalog.
- 85 production-supply rows, 23 workshop-supply rows, and 16 Tool rows are outside this textile Source boundary.
- Nine `Pieza 3m` rows retain Piece as Purchase Presentation and `3` as a distinct fixed piece length.

The workbook contains a 2026 price-verification flag but no auditable Price Date. The fixture therefore leaves Price Date empty instead of inventing a day. At the current source-data state, all 156 `Textil` rows are correctly excluded and reported; two rows also need a valid Textile Family. This is an operational workbook-cleanup result, not a hidden implementation success.

Now open [apps/api/app/modules/sources/source_catalog_importer.ts](apps/api/app/modules/sources/source_catalog_importer.ts). The Source-owned importer upserts each valid `Textil` row by immutable legacy provenance, so Unlinked Sources are included and stable `S-####` IDs survive reruns. Invalid Source rows never receive partial records. Every exclusion contains the legacy ID, Source record type, invalid fields, and corrective guidance.

[apps/api/app/modules/materials/materials_importer.ts](apps/api/app/modules/materials/materials_importer.ts) composes that Source import result when it builds Material relationships, keeping Source catalog persistence out of the Materials slice.

## Run The Operator Command

The command entry point is [apps/api/commands/import_source_catalog.ts](apps/api/commands/import_source_catalog.ts). It calls the Source-owned importer directly. From `apps/api`, run:

```text
node ace.js source:import-catalog
```

The command prints the complete structured result. Valid rows may persist alongside exclusions, but any exclusion sets exit code 1 so automation cannot describe a partial migration as clean completion. With the current workbook fixture, the result is 124 intentionally ignored non-textile rows, 156 Source exclusions, zero imported catalog Sources, and exit code 1.

Normal development seeding remains separate: [apps/api/database/seeders/materials_seeder.ts](apps/api/database/seeders/materials_seeder.ts) continues loading the small deterministic Materials fixture without running the one-time workbook audit.

## Trace Preferred Source Safety

Return to [apps/api/database/fixtures/materials_import_fixture.ts](apps/api/database/fixtures/materials_import_fixture.ts). Material relationships now declare `isPreferred` explicitly instead of relying on array position. The importer rejects Materials with zero or multiple Preferred Sources and also rejects a missing, Retired, or costless Preferred Source.

Material plus relationship replacement runs in one database transaction. If a link insert fails, the Material fields and its previous Source links roll back together, preserving the exact-one-Preferred invariant.

The existing Materials response stays lean. [apps/api/app/modules/materials/materials_service.ts](apps/api/app/modules/materials/materials_service.ts) maps canonical Vendor and Landed Unit Cost back through the established Materials summary contract, so this issue does not pull Source catalog screens or technical detail into the Materials table.

## Read The Tests As Specifications

[apps/api/tests/functional/materials/materials_importer.spec.ts](apps/api/tests/functional/materials/materials_importer.spec.ts) covers:

- all 280 workbook rows and the explicit textile/supply/workshop/tool boundary;
- complete commercial-core validation and one structured exclusion result;
- valid Unlinked Source persistence and missing-status defaulting;
- explicit Preferred Source rules, including zero and multiple declarations;
- partial-success semantics without partial invalid records;
- transaction rollback after relationship failure;
- stable Source IDs, reruns, identity constraints, and soft-delete reconciliation.

[apps/api/tests/functional/materials/list_materials.spec.ts](apps/api/tests/functional/materials/list_materials.spec.ts) confirms the authenticated Materials endpoint still returns Preferred Source reference, Source-derived cost, and alternate counts after the canonical field changes.

## Review Follow-Up

The required two-axis review found and resolved three material risks. Material/link replacement is now transactional; migration rollback refuses to convert missing Landed Unit Cost into a fabricated zero; and Source vocabulary/validation now lives in the owning Sources slice. A follow-up review also separated the workbook audit command from normal development seeding.

The final Spec review found no remaining implementation defects. It confirmed that nullable transition columns are consistent with the documented pre-catalog boundary because the importer is the only current catalog write path.

## Verification

- The focused importer suite passed with 15 tests.
- The focused Materials API suite passed with 7 tests.
- API lint and API strict typecheck passed during implementation.
- The new migration applied to the development database, and migration status reports all 12 migrations completed.
- Normal `db:seed` completed successfully.
- `source:import-catalog` printed all 156 Source exclusions and returned exit code 1 as required.
- Repository-wide lint and strict typecheck passed across the API, web app, and both shared packages.
- The complete test suites passed with 51 API tests and 37 web tests.
- Production builds passed for the API, web app, and both shared packages.

## What Comes Next

Issue 03 is the next implementation slice: optional Source technical fields, future-cost inputs, Vendor Shades, and attention derivation. Separately, the workbook needs real Price Dates—and valid Textile Family values for the two reported rows—before the commercial catalog command can complete successfully. Those facts should be corrected at the source rather than guessed in application code.
