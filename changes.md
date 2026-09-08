# Manage Reusable Pattern Sets and Quantity Proposals

Issue 03 gives authenticated Admins and Operators an independent Pattern Set catalog with reusable width-based Quantity Proposals, stable identity, and recoverable retirement. Proposals remain advisory evidence: this slice does not calculate or persist final Bill of Materials quantities.

## Stable Catalog Records and Proposal Evidence

The [Pattern Set contract](packages/shared-types/src/pattern-sets.ts) and [runtime schemas](packages/shared-validation/src/pattern-sets.ts) define a required trimmed name, optional description, Active or Retired status, immutable creation metadata, and zero or more Quantity Proposals. Each proposal requires a positive assumed width and positive meter quantity, limits quantity to three decimal places, accepts an optional evidence note, rejects duplicate widths, and is returned in ascending width order.

The [database migration](apps/api/database/migrations/1788920000000_create_pattern_sets_tables.ts) gives every Pattern Set a permanent internal key and stable `PS-` public identity. Database constraints keep normalized names unique across both Active and Retired records, protect positive proposal values and meter precision, and prevent duplicate widths within one Pattern Set.

## Atomic Management and Recoverable Retirement

The [Pattern Set service](apps/api/app/modules/pattern_sets/services/pattern_sets_service.ts) creates and updates each Pattern Set and its complete proposal collection transactionally. Updates replace the exclusively owned proposals as one unit, while row locks coordinate edits, retirement, and restoration so lifecycle changes cannot silently cross.

The [bearer-protected controller](apps/api/app/modules/pattern_sets/controllers/pattern_sets_controller.ts) lets Admins and Operators browse Active records, create, edit, and retire unused Pattern Sets. Retired records preserve identity, description, proposals, and creation metadata; they cannot be edited or returned by the ordinary list. Only Admins may include Retired records and restore them.

## Independent Pattern Set Workspace

The [Pattern Set catalog](apps/web/src/features/pattern-sets/pattern-sets-page.tsx) is available at `/app/pattern-sets` from the authenticated workspace navigation. Rows expose stable identity, status, description, ordered proposal evidence, and creation metadata. Active records offer focused Edit and Retire actions; Admins additionally receive `Include retired` and Restore controls, while Operators never receive recovery history.

The shared create/edit dialog supports zero or more proposal rows and explains that proposals do not calculate final quantity. Client and server validation failures leave the dialog and entered draft intact. Retirement uses a focused confirmation naming the Pattern Set and the information that remains preserved.

## Focused Coverage

The [API acceptance tests](apps/api/tests/functional/pattern_sets/pattern_sets.spec.ts) prove creation metadata, normalized uniqueness across Active and Retired records, positive values, quantity precision, duplicate-width rejection, ascending ordering, atomic editing, retirement, restoration, authentication, and role boundaries.

The [catalog route tests](apps/web/src/routes/-pattern-sets.test.tsx) prove Operator browsing and management, Admin-only recovery, proposal rendering, retirement confirmation, and duplicate-width validation without losing the form. The authenticated-shell route tests cover the new navigation entry.

## Focused Verification

- `CI=true node ace.js test functional --files tests/functional/pattern_sets/pattern_sets.spec.ts` — 7 focused API tests passed; the migration executed and rolled back in the isolated test database.
- `vitest run src/routes/-pattern-sets.test.tsx src/routes/-app.test.tsx` — 13 focused web tests passed across 2 files.
- `eslint .` and `tsc --noEmit --pretty false` in `apps/api` — passed.
- `tsr generate`, `tsc -b --pretty false`, and `oxlint` in `apps/web` — passed.
- `tsc --noEmit --pretty false` and `oxlint src` in both shared contract packages — passed; both packages were also rebuilt with `tsc -p tsconfig.json --pretty false`.
- `node ace.js migration:status` — passed and reports the new migration as pending in the configured development database.
- `git diff --check` — passed.

## Scope Boundaries

This slice does not add Pattern files, geometry, grading, sizes, Product ownership, Material or Source compatibility, BOM Line references, retained-reference search, usage-impact confirmations, or automatic meter calculation. Those later BOM integration and large-catalog behaviors remain in their tracker-defined issues.

The configured development database was inspected but not mutated; only the isolated test database ran the migration. Complete test suites and `pnpm quality` were not run under the requested review boundary, and the implementation remains uncommitted.
