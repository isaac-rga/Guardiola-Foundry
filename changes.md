# Stable Source Identity Foundation

This slice completes Sources issue 01. It changes Source identity from provisional importer-position IDs such as `MS-0001` to stable application IDs such as `S-0001`, while preserving the existing Materials list and its Preferred Source summaries.

## Start With The Issue

Read the completed tracker item at [.scratch/sources/issues/01-adopt-stable-source-identity.md](.scratch/sources/issues/01-adopt-stable-source-identity.md). The issue is intentionally an identity and persistence foundation: Source catalog fields, catalog routes, and management screens begin in later Sources issues.

## Follow Existing Records Through The Migration

Open [apps/api/database/migrations/1786680000000_adopt_stable_source_identity.ts](apps/api/database/migrations/1786680000000_adopt_stable_source_identity.ts).

The migration expands the existing `material_sources` table in place. Existing rows are assigned sequential `S-####` public IDs in database identity order. A PostgreSQL sequence then continues after the migrated maximum, so future inserts receive the next ID without deriving identity from spreadsheet position.

The same migration makes `legacy_source_id` nullable for app-created Sources. Source ID cannot change after insertion. An app-created Source may receive Legacy Source ID once while the value is empty; after the value is present, the trigger prevents replacement or removal.

## Inspect The Relationship Guardrails

Stay in the same migration and find `material_source_links_one_preferred_per_material`. The existing composite unique constraint still prevents duplicate Material–Source relationships; the new partial unique index also prevents two links for one Material from both being Preferred.

These are database rules rather than importer-only assumptions, so later Source and relationship mutation issues inherit the same safety boundary.

## See How The Importer Became Stable

Next, read [apps/api/app/modules/materials/materials_importer.ts](apps/api/app/modules/materials/materials_importer.ts).

The importer still finds imported Sources by immutable legacy provenance and refreshes the currently imported business fields. It no longer calculates a Source public ID from the row index and no longer merges identity fields on reruns. New rows let the database allocate an `S-####` ID; existing rows retain the ID they already own even when spreadsheet rows are reordered.

The nullable model and generated schema contract are visible in [apps/api/app/models/material_source.ts](apps/api/app/models/material_source.ts) and [apps/api/database/schema.ts](apps/api/database/schema.ts).

## Confirm The Materials Experience

The response projection in [apps/api/app/modules/materials/materials_service.ts](apps/api/app/modules/materials/materials_service.ts) did not need structural changes. `GET /materials` still returns the Preferred Source reference, derived unit cost, alternate Source count, comments, and attention state; the Source reference now uses `S-####`.

The existing Materials presentation also remains unchanged. Its route regression fixture in [apps/web/src/routes/-materials.test.tsx](apps/web/src/routes/-materials.test.tsx) now exercises the new Source IDs and confirms the lean table continues rendering without exposing the ID as an extra column.

## Read The Verification As Specifications

[apps/api/tests/functional/materials/materials_importer.spec.ts](apps/api/tests/functional/materials/materials_importer.spec.ts) covers the legacy migration, continued allocation, rerun stability after row reordering, nullable legacy provenance, immutable identity, duplicate-link protection, one-Preferred protection, and soft-delete reconciliation.

[apps/api/tests/functional/materials/list_materials.spec.ts](apps/api/tests/functional/materials/list_materials.spec.ts) confirms authenticated Materials responses keep their existing business shape with `S-####` Preferred Source references, including alternate counts and Source-attention behavior.

The API testing guidance in [apps/api/AGENTS.md](apps/api/AGENTS.md) now defines a functional test by its public application boundary rather than requiring every behavior to have an HTTP endpoint. HTTP features remain endpoint-tested; importers, migrations, and persistence constraints use their real database-backed boundaries.

## Review Follow-Up

The first implementation treated an empty Legacy Source ID as permanently immutable. Review identified that this was stricter than the PRD phrase “immutable when present.” A focused red test first proved that the original trigger rejected `NULL` to Legacy Source ID assignment. The trigger was then narrowed and the test passed: an app-created Source may receive provenance once, but a present value cannot be replaced or removed.

Review also found that Source ID immutability was implemented without direct regression coverage. A separate test now attempts to change `S-0001` and confirms that the database rejects the update.

The review questioned database-backed tests in the functional suite because the previous API guide required every functional test to call HTTP. The agreed correction was to fix the guide rather than create an artificial endpoint or an unnecessary test suite. Functional tests now use the public boundary that the behavior actually provides.

## Verification

- `pnpm lint` passed across all workspace packages.
- `pnpm typecheck` passed across all workspace packages.
- `pnpm test` passed: 46 API tests and 37 web tests.
- `pnpm build` passed across all workspace packages.
- The migration was applied to the local development database, and `migration:status` reports all 11 migrations completed.
- All actionable findings from the two-axis review were addressed in the implementation, tests, or repository guidance described above.

## What Remains Separate

This issue does not import the full commercial Source catalog or add Source browsing, detail, creation, editing, linking, retirement, or restoration workflows. Those capabilities remain sequenced in Sources issues 02 through 13; issue 02 is the next implementation slice.
