# Non-Destructive Future Source Imports

This slice completes Sources issue 13. Later catalog imports can still add genuinely new Sources and refresh untouched imported facts, while application-managed commercial decisions and Material relationships remain authoritative.

## Start With the Issue

Read [.scratch/sources/issues/13-protect-user-managed-data-from-imports.md](.scratch/sources/issues/13-protect-user-managed-data-from-imports.md). The implementation is limited to future-import protection. It does not add conflict-resolution UI, overwrite controls, new Source fields, or new relationship mutations.

## Remember the Last Imported State

[apps/api/database/migrations/1788470000000_protect_user_managed_import_data.ts](apps/api/database/migrations/1788470000000_protect_user_managed_import_data.ts) adds two private JSON snapshots:

- each Source remembers its last successfully imported field values and Vendor Shades;
- each Material remembers its last successfully imported ordered Source relationships, Preferred choice, and Vendor Shade selections.

[apps/api/app/models/material_source.ts](apps/api/app/models/material_source.ts) and [apps/api/app/models/material.ts](apps/api/app/models/material.ts) persist those snapshots without exposing them through API serialization. The snapshots are importer bookkeeping, not user-facing domain fields.

## Protect Source Decisions Per Record

[apps/api/app/modules/sources/source_catalog_importer.ts](apps/api/app/modules/sources/source_catalog_importer.ts) now locks and processes each valid Source inside one managed transaction.

For a new legacy Source, the importer creates the Source, records its import snapshot, imports unique Vendor Shades, and keeps database-owned `S-####` allocation unchanged. For an existing imported Source, the importer compares the live record to its last imported snapshot:

- fields still equal to their prior imported values may accept refreshed workbook values;
- any field changed through application management is reported as protected, and the entire Source update is skipped;
- Source Status is never changed by an import, so a Retired Source cannot be restored;
- Vendor Shade imports remain additive, while application-edited Vendor Shades make the record conflict instead of being overwritten;
- protected conflicts still return the current Source and shade lookup to downstream validation without counting the Source as imported.

Invalid commercial fields and protected-field conflicts use the existing structured exclusion report. Their corrective guidance tells the migration operator to keep the application-managed values or make the workbook agree before rerunning. Any exclusion keeps the overall result non-successful, while independent safe Source records still commit.

## Preserve Material–Source Relationships

[apps/api/app/modules/materials/materials_importer.ts](apps/api/app/modules/materials/materials_importer.ts) compares each existing Material's live Source relationships with its last imported relationship snapshot before writing anything.

If application work changed linked Sources, order, the Preferred Source, or a relationship Vendor Shade, the Material is skipped atomically and the changed relationship dimensions appear in the migration report. The importer does not replace, remove, or recreate those links. Identical reruns also avoid deleting and recreating unchanged links.

When relationships are still untouched, a valid imported relationship refresh remains allowed inside the existing Material transaction. Existing Material public IDs are no longer recomputed from the current success counter, so an earlier protected exclusion cannot reassign or collide with a later Material's ID.

## Read the Focused Test as the Scenario

[apps/api/tests/functional/materials/materials_importer.spec.ts](apps/api/tests/functional/materials/materials_importer.spec.ts) first imports realistic Sources and Materials, then uses the application services to:

- edit Source commercial data, Landed Unit Cost, comments, and Vendor Shades;
- add a Material–Source relationship;
- replace the Preferred Source;
- retire an imported Source.

A later import attempts to reverse those decisions while also refreshing an untouched Source and adding a new Source. The test proves the managed decisions remain unchanged, protected records are reported, safe records persist, the result remains non-successful, the new Source receives the next stable public ID, and reruns do not duplicate Sources, Vendor Shades, or relationships.

## Verification

Passed with Node 24:

- focused database-backed importer suite: 20 tests;
- adjacent Source-edit and Material relationship suites: 14 tests;
- API ESLint;
- API strict TypeScript typecheck;
- whitespace validation with `git diff --check`.

The complete API and web test suites and repository quality gate were not run, per the review boundary. The implementation remains uncommitted.

## Scope Boundaries

Issue 13 does not add interactive import conflict review, explicit overwrite controls, Material field edit tracking, Source comparison UI, new lifecycle states, new relationship endpoints, or a broader authentication refactor.
