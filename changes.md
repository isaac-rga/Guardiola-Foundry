# Create and Browse Unassociated BOM Templates

Issue 04 replaces the Bills of Materials fixtures with the first persisted tracer bullet. Authenticated Admins and Operators can enter the approved Construction Board from the operational catalog, save an unassociated Template with its own identity and metadata, and find it again after navigation or reload. Product relationships, origins, BOM Lines, editing, and lifecycle actions remain outside this slice.

## Stable Template Records

The [shared contract](packages/shared-types/src/bills-of-materials.ts) and [runtime schemas](packages/shared-validation/src/bills-of-materials.ts) define the canonical catalog and create payloads: a permanent kind, required trimmed display name, optional normalized description, stable identity, immutable creator and creation time, and latest update time.

The [database migration](apps/api/database/migrations/1789006400000_create_bills_of_materials_table.ts) creates the shared Bills of Materials table without prematurely adding later Product, Variant, origin, line, or lifecycle fields. The [model and service](apps/api/app/modules/bills_of_materials/services/bills_of_materials_service.ts) generate stable `BOM-` identities, create Templates atomically, retain creator metadata, and return the newest-updated records through one persisted catalog contract.

## Authenticated Catalog and Explicit Creation

The [bearer-protected controller](apps/api/app/modules/bills_of_materials/controllers/bills_of_materials_controller.ts) exposes focused list and create operations. The server accepts only Template creation in this issue and returns structured validation errors without creating a partial record.

The [production Bills of Materials route](apps/web/src/routes/app.bills-of-materials.tsx) now opens a database-backed operational catalog instead of the fixture prototype. `Create BOM` offers the in-scope Template action, which enters an empty Construction Board with an editable name, optional description, and one explicit `Save BOM` action. Opening or leaving that Builder performs no mutation; a successful save refreshes the catalog and visibly labels the persisted record as a Template.

## Focused Coverage

The [API functional tests](apps/api/tests/functional/bills_of_materials/bills_of_materials.spec.ts) prove empty catalog behavior, Admin and Operator creation, trimmed and nullable metadata, stable identity, immutable creation metadata, persisted reload, validation without partial creation, and bearer authentication for both endpoints.

The [route tests](apps/web/src/routes/-bills-of-materials.test.tsx) prove empty and error states, Template entry from the Create menu, abandoned-draft behavior, client validation without a mutation, explicit save, distinct Template and Implementation catalog treatments, catalog refresh, and a fresh route reload.

## Focused Verification

- `CI=true node ace.js test functional --files=tests/functional/bills_of_materials/bills_of_materials.spec.ts` — 5 focused API checks passed; the new migration executed and rolled back in the isolated test database.
- `vitest run src/routes/-bills-of-materials.test.tsx` — 5 focused route tests passed.
- `tsc --noEmit` for the API and both shared packages, plus `tsr generate` and `tsc -b --pretty false` for the web app — passed.
- Scoped ESLint/Oxlint for every changed API, web, and shared source — passed.
- `node ace.js migration:run` and `node ace.js migration:status` — passed; the new migration is completed in the configured development database.
- `git diff --check` — passed.

## Scope Boundaries

This issue does not add Product or Product Variant relationships, BOM Origins, BOM Lines, Material selection, Pattern Sets in the Builder, editing, search or kind filters, cost projections, deletion, restoration, or Implementation creation. Those capabilities remain in their dependency-ordered tracker issues. Complete test suites and `pnpm quality` were not run under the requested review boundary, and the implementation remains uncommitted.
