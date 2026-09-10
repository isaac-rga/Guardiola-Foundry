# Associate BOM Templates with Products

Issue 08 lets Admins and Operators optionally give a BOM Template one permanent Product scope, either during creation or through the explicit association operation for an existing unassociated Template. Product association is strongly recommended in the Builder but remains optional; this slice does not add Product editing, Template reassignment, or the later whole-BOM update workflow.

## Permanent Product Scope

The [shared Bills of Materials contract](packages/shared-types/src/bills-of-materials.ts) now carries an optional Product reference with stable identity and current availability. Template creation accepts an optional Product ID, and `POST /bills-of-materials/:billOfMaterialsId/product` assigns an existing unassociated Template exactly once. No request exists to change or remove an assigned Product.

The [association migration](apps/api/database/migrations/1789265600000_add_bom_template_product_association.ts) adds a nullable Product foreign key, guarantees that only Templates can hold it, and gives each Product one occupied Template slot. Unassociated Templates reserve nothing. Product row locks and the database uniqueness constraint keep competing creation or association requests atomic.

The [Bills of Materials service](apps/api/app/modules/bills_of_materials/services/bills_of_materials_service.ts) accepts only Active, non-deleted Products regardless of Lifecycle Status. A conflict identifies the current Template without overwriting either record. Later Product inactivation or soft deletion preserves the relationship and returns the Product as unavailable rather than erasing its context.

## Prototype-Faithful Builder Context

The [Construction Board Builder](apps/web/src/features/bills-of-materials/create-bom-template-page.tsx) keeps the approved name, identity card, line navigator, focused editor, and Whole BOM rail intact. Its identity card now recommends Product scope, opens a focused eligible-Product chooser only on demand, and still offers an explicit unassociated path. The selected Product appears as identity context before Save. The operational catalog shows persisted Product identity plus unavailable context when applicable, and exposes the same focused chooser for assigning a previously unassociated Template.

The catalog keeps the approved operational-table hierarchy for this slice: `Product context` is a dedicated column between `Type` and creation metadata, associated Products show identity and availability on two compact lines, and unassociated Templates remain explicit. BOM rows keep only name and monospaced ID in the first column, while the one available association action sits inside the prototype-style row menu. A minimum table width preserves that hierarchy through horizontal overflow on narrower screens without pulling the later summary, search, Origin, Cost, or Lines work into Issue 08.

Candidate loading composes the existing Product catalog with current BOM occupancy without moving Product ownership into the Bills of Materials module. The server revalidates all eligibility and occupancy at Save, so stale client choices cannot bypass the permanent relationship rules.

## Focused Coverage

API functional coverage proves unassociated and Product-scoped creation, one-time association, permanent reassignment rejection, Lifecycle Status independence, inactive and deleted Product rejection, retained unavailable context, conflict identification, and database-enforced concurrent winners for both creation and existing-Template association with no partial losing record. Builder-route coverage proves the visible recommendation, optional unassociated path, eligible Product choice, submitted Product scope, one-time catalog association, and immutable catalog context while retaining all prior Construction Board behavior.

## Focused Verification

- `CI=true node ace.js test functional --files=tests/functional/bills_of_materials/bills_of_materials.spec.ts --reporters=spec` — 17 focused API tests passed; all 21 migrations executed and rolled back in the isolated test database.
- `vitest run src/routes/-bills-of-materials.test.tsx` — 11 focused Builder and catalog route tests passed.
- API, web, shared-types, and shared-validation typechecks — passed.
- Scoped ESLint/Oxlint for every changed API, web, and shared source and test file — passed.
- `node ace.js migration:run` and `node ace.js migration:status` — passed; the Product-association migration is completed in the configured development database.

## Scope Boundaries

This slice does not add Template editing, Product CRUD inside the Builder, Product Variant selection, BOM Implementation creation, BOM soft deletion or restoration, lineage, or the later complete operational catalog. The current database slot applies to available persisted Templates; Issue 14 will make that uniqueness lifecycle-aware when BOM soft deletion is introduced. Complete test suites and `pnpm quality` were not run under the requested review boundary, and the implementation remains uncommitted.
