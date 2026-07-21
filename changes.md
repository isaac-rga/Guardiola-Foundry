# Persisted Materials API

This slice establishes the first real Materials backend. It does not replace the Materials page placeholder yet. Instead, it creates the persisted Material/Source data shape and exposes a lean authenticated `GET /materials` API that the next UI issue can consume.

## Start with the shared contract

The cross-boundary response types now live in [packages/shared-types/src/index.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/packages/shared-types/src/index.ts).

The new Materials contract is intentionally table-shaped:

- `MaterialSummary` represents one Material row, not one Source row.
- `MaterialPreferredSourceSummary` exposes only the shallow Source reference needed by the first table.
- `ListMaterialsResponse` wraps the list as `{ materials: [...] }`.

The matching Zod schemas are in [packages/shared-validation/src/index.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/packages/shared-validation/src/index.ts). They keep Material Use, Material Color, and the normalized Meter unit controlled at the API boundary.

## Then read the persistence model

The new Lucid models are:

- [apps/api/app/models/material.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/app/models/material.ts)
- [apps/api/app/models/material_source.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/app/models/material_source.ts)
- [apps/api/app/models/material_source_link.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/app/models/material_source_link.ts)

`Material` owns the textile identity: public `M-` ID, legacy spreadsheet Material ID, name, Material Color, Material Use, normalized Meter unit, comments, and soft deletion.

`MaterialSource` owns vendor-facing purchasing context: public Source ID, legacy spreadsheet Source ID, provider, textile family, purchase unit, normalized unit cost, normalized Meter unit, and soft deletion.

`MaterialSourceLink` connects Materials to one or more Sources. The first imported link is marked as the Preferred Source, and any additional links become alternate Sources.

## Then follow the schema and import fixture

The database tables are created in [apps/api/database/migrations/1783420000000_create_materials_tables.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/database/migrations/1783420000000_create_materials_tables.ts).

The spreadsheet-shaped rows now live in [apps/api/database/fixtures/materials_import_fixture.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/database/fixtures/materials_import_fixture.ts).

That fixture includes three valid Materials and one unresolved spreadsheet Material. The unresolved row is deliberately skipped because it points at a missing Source, which keeps the first API list limited to Materials with valid linked Source data.

The fixture is loaded by [apps/api/database/seeders/materials_seeder.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/database/seeders/materials_seeder.ts). That keeps spreadsheet-derived business data refreshable through the importer/seeder path instead of locking it into migration history.

## Then read the import routine

The reusable importer is [apps/api/app/modules/materials/materials_importer.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/app/modules/materials/materials_importer.ts).

It accepts imported row arrays, preserves legacy IDs internally, generates app-owned public IDs like `M-0001`, imports Sources first, skips Materials with unresolved Source links, and rebuilds each Material's Source links so the first listed Source becomes preferred. The focused tests call this importer directly with the fixture, so they verify the refreshable import path rather than relying on migration side effects.

## Then read the API service and route

The list service is [apps/api/app/modules/materials/materials_service.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/app/modules/materials/materials_service.ts).

It loads active Materials only, resolves Preferred Source data, derives `derivedUnitCostCents` from the Preferred Source normalized cost, and counts alternate Sources from the remaining links. It does not expose legacy IDs, textile family, purchase unit, or other Source technical fields in the API response.

The controller is [apps/api/app/modules/materials/controllers/materials_controller.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/app/modules/materials/controllers/materials_controller.ts), and the route is registered in [apps/api/start/routes.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/start/routes.ts) as `GET /materials`.

The existing soft-delete helper in [apps/api/app/mixins/soft_delete.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/app/mixins/soft_delete.ts) now supports relation preloads that need to include deleted records. Materials still hide soft-deleted Materials by default, but a Material can remain visible if its Preferred Source is later soft-deleted.

## End at tests and tracker

The focused API spec is [apps/api/tests/functional/materials/list_materials.spec.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/tests/functional/materials/list_materials.spec.ts).

It covers authentication, the lean summary contract, source-derived cost, alternate Source counts, skipped unresolved Source links, first-linked Preferred Source behavior, legacy ID preservation, soft-deleted Material exclusion, and soft-deleted Preferred Source visibility.

The importer has its own functional coverage in [apps/api/tests/functional/materials/materials_importer.spec.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/tests/functional/materials/materials_importer.spec.ts).

That spec keeps importer-specific behavior out of the route tests: valid import counts, unresolved Source skipping, legacy ID preservation, preferred Source ordering, idempotent re-imports, refreshed spreadsheet values, and soft-deleted Material/Source reconciliation without duplicate public IDs.

The completed issue is [.scratch/materials/issues/01-persist-imported-materials-and-sources.md](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/materials/issues/01-persist-imported-materials-and-sources.md).

Verification run for this slice:

- `pnpm --dir apps/api typecheck`
- `pnpm --dir apps/api lint`
- `pnpm lint`
- `pnpm typecheck`
- `CI=true NODE_ENV=test node ace.js test functional --files tests/functional/materials/materials_importer.spec.ts`
- `CI=true NODE_ENV=test node ace.js test functional --files tests/functional/materials/list_materials.spec.ts`
- `CI=true pnpm test`

## Scope note

This slice is backend persistence and API read behavior only. It does not add Materials create, update, delete, restore, import management, Source management, search, filtering, pagination, or the user-facing Materials table route.
