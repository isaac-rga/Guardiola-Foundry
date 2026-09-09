# Verify Complete BOM Lines

Issue 06 adds informational, line-specific verification to Template creation for Admins and Operators. Complete BOM Lines can be manually verified with server-owned Operator evidence, while incomplete or unverified work remains saveable. Aggregate BOM approval and editing already-persisted Bills of Materials remain outside this slice.

## Line Verification Contract

The [shared Bills of Materials contract](packages/shared-types/src/bills-of-materials.ts) now keeps derived completeness separate from a discriminated verification record. An Unverified line carries no verifier or timestamp; a Verified line carries both. Create requests send only verification intent, never caller-supplied evidence.

The [verification migration](apps/api/database/migrations/1789179200000_add_bill_of_materials_line_verification.ts) stores the current verifier and timestamp as one optional evidence pair and enforces that both values are present or both are absent. The [Bills of Materials service](apps/api/app/modules/bills_of_materials/services/bills_of_materials_service.ts) records the authenticated current Operator and server time for requested Complete lines, rejects verification of Incomplete lines before persistence, and returns the canonical evidence on create and reload. No aggregate verification or approval state is persisted.

## Prototype-Faithful Builder Behavior

The [Template Builder](apps/web/src/features/bills-of-materials/create-bom-template-page.tsx) presents Verification as a primary field beside Final meters. The control remains disabled until the focused line is Complete, supports explicit verification and withdrawal, and never blocks Save.

Changing Construction Piece, Material, or Material Quantity immediately returns the local line to Unverified. Line Note, logical order, BOM Name, and description preserve verification. A duplicated line begins Unverified. The separate Whole BOM summary derives current construction-line, Complete, and Verified counts directly from the draft.

## Focused Coverage

The [focused domain coverage](apps/web/src/features/bills-of-materials/bom-line-verification.test.ts) proves verification eligibility and the reset-versus-preserve transition rule independently. The [API functional coverage](apps/api/tests/functional/bills_of_materials/bills_of_materials.spec.ts) proves atomic rejection, server-owned Operator identity and time, explicit Unverified evidence, and persistence across reload. The [Builder route coverage](apps/web/src/routes/-bills-of-materials.test.tsx) proves manual withdrawal, construction-fact resets, preserved unrelated edits and reorder, duplicate reset, and live Whole BOM counts.

## Focused Verification

- `CI=true node ace.js test functional --files=tests/functional/bills_of_materials/bills_of_materials.spec.ts` — 9 focused API checks passed; all 20 migrations executed and rolled back in the isolated test database.
- `vitest run src/features/bills-of-materials/bom-line-verification.test.ts src/routes/-bills-of-materials.test.tsx` — 2 focused domain and 8 Builder-route checks passed.
- API, web, shared-types, and shared-validation typechecks — passed.
- Scoped ESLint/Oxlint for every changed API, web, and shared source and test file — passed.
- `node ace.js migration:run` and `node ace.js migration:status` — passed; the verification migration is completed in the configured development database.

## Scope Boundaries

This issue does not add aggregate BOM verification or approval, Pattern Sets, cost projection, Product relationships, derivation, or lifecycle behavior. Verification can be authored and persisted through the current create-Template Builder; opening and atomically updating an existing Bill of Materials remains issue 11. Complete test suites and `pnpm quality` were not run under the requested review boundary, and the implementation remains uncommitted.
