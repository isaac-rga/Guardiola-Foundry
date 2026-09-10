# Separate Bills of Materials Responsibilities

The Bills of Materials application module keeps its existing controller-facing interface and behavior while separating creation, Product association, and read projection into focused implementations. This refactor prepares the module for the next BOM slices without adding new domain behavior, transport contracts, persistence abstractions, or dependencies.

## Stable Public Interface

The [Bills of Materials module interface](apps/api/app/modules/bills_of_materials/services/bills_of_materials_service.ts) continues to expose the same list, detail, Template creation, Product association, result type, and domain errors consumed by the controller. Callers do not need to know how those operations are organized internally.

Template creation now owns its transaction, Material resolution, line persistence, verification evidence, and identity generation in one implementation. Product association owns its separate transaction and immutable assignment behavior. Read operations own Lucid hydration and response projection, including current Material, Source, Product availability, verification, attention, and cost context.

## One Product Slot Rule

The [Template Product slot module](apps/api/app/modules/bills_of_materials/services/template_product_slot.ts) centralizes the exact rule shared by create-time and later association: lock the Product row, reject unavailable Products, and identify an occupying Template before mutation. Both commands use this internal seam while retaining their existing error interfaces and transaction boundaries.

The implementation remains concrete and Lucid-backed. No repository interface or port was introduced because there is only one persistence adapter, and the existing database-backed functional tests already exercise the public module through HTTP.

## Focused Coverage

The existing Bills of Materials functional coverage proves that the refactor preserves Template creation and reload, line validation and verification, live cost projection, Product eligibility and permanent association, conflict reporting, and database-enforced concurrent winners without partial changes.

## Focused Verification

- `CI=true node ace.js test functional --files tests/functional/bills_of_materials/bills_of_materials.spec.ts` — 17 focused API tests passed; all 21 migrations executed and rolled back in the isolated test database.
- API TypeScript check — passed.
- Scoped API ESLint and Prettier checks for the five refactored module files — passed.
- `git diff --check` — passed.

## Scope Boundaries

This change does not alter HTTP responses, validation messages, transaction ordering, locking, Product or Material eligibility, persistence schema, controller behavior, or Builder behavior. It does not add speculative repository interfaces or pre-implement Pattern Set, Implementation, update, derivation, lifecycle, or complete-catalog work.
