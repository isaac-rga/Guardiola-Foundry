# Compose Template BOM Lines with Materials

Issue 05 turns Template creation into a persisted Construction Board workflow for Admins and Operators. Users can progressively compose independently identified BOM Lines, select Materials without loading the full catalog, and save ordered complete or incomplete construction work atomically. Verification, Pattern Sets, cost projection, Product association, and editing an existing Bill of Materials remain outside this slice.

## Persisted Ordered Construction Lines

The [shared Bills of Materials contract](packages/shared-types/src/bills-of-materials.ts) now carries ordered create-line inputs and canonical persisted line details. Each line receives a stable `BML-` identity, belongs to exactly one Bill of Materials, and stores only its required Construction Piece, optional Material reference, optional positive quantity in meters, optional Line Note, and logical display order.

The [BOM Line migration](apps/api/database/migrations/1789092800000_create_bill_of_materials_lines_table.ts) enforces ownership, unique order within a Bill of Materials, Material-reference integrity, positive quantities, the three-decimal precision boundary, and the rule that quantity cannot exist without Material. The [Bills of Materials service](apps/api/app/modules/bills_of_materials/services/bills_of_materials_service.ts) validates newly selected Materials as active and creates the Template plus every line in one transaction. Repeated and otherwise identical-looking lines remain separate records, while completeness is derived from Construction Piece, Material, and a valid quantity rather than persisted as mutable status.

## Bounded Material Selection

The Materials domain exposes an authenticated selection search through the [Material search projection](apps/api/app/modules/materials/materials_service.ts). Non-empty, normalized multi-word searches match Material identity, color, Material Use, and visible Preferred Source context; deleted Materials are excluded. Results are deterministically ordered, capped at 25, and report `hasMore` after reading at most one additional match.

The selection response includes Material identity plus color, use, Preferred Source name and ID, Vendor, Vendor Shade or detail, width, and sourcing-attention context. It deliberately omits cost and stores none of that Source information on a BOM Line.

## Construction Board Builder

The [Template Builder](apps/web/src/features/bills-of-materials/create-bom-template-page.tsx) follows the approved prototype direction: BOM Name is the quiet editable page heading, and an ordered line navigator stays visible beside one focused line editor. Users can add, focus, duplicate, remove, drag, or use Arrow Up and Arrow Down on a drag handle to reorder lines. Repetition is unrestricted and order is treated as display logic rather than identity or manufacturing sequence.

Material selection opens an on-demand dialog that remains idle until text is entered, debounces for 250 milliseconds, cancels superseded requests, caches identical queries for 30 seconds, and presents loading, empty, bounded-more-results, and recoverable-error states. Changing or removing Material clears Final meters. Final meters remains disabled without Material and accepts only a positive value with at most three decimals. The optional Line Note and derived Complete or Incomplete state stay visible in the focused editor, and explicit Save sends the whole ordered draft once.

## Focused Coverage

The [API functional coverage](apps/api/tests/functional/bills_of_materials/bills_of_materials.spec.ts) proves repeated identities, incomplete lines, normalized notes and Construction Pieces, Material selection, quantity invariants, three-decimal validation, explicit ordering, atomic rejection, authentication, and reload by stable BOM ID. The [Material API coverage](apps/api/tests/functional/materials/list_materials.spec.ts) proves identity and Preferred Source matching, projection context, deleted-Material exclusion, authentication, the 25-item cap, and `hasMore`.

The [Builder route coverage](apps/web/src/routes/-bills-of-materials.test.tsx) proves idle remote search, Material selection, quantity clearing, precision feedback, notes, duplication, keyboard reorder, removal, ordered save payloads, and the existing abandoned-draft and save-error behavior.

## Focused Verification

- `CI=true node ace.js test functional --files tests/functional/bills_of_materials/bills_of_materials.spec.ts --files tests/functional/materials/list_materials.spec.ts` — 17 focused API checks passed; all 19 migrations executed and rolled back in the isolated test database.
- `vitest run src/routes/-bills-of-materials.test.tsx` — 7 focused Builder-route checks passed.
- `tsc --noEmit` for the API and both shared packages, plus `tsr generate` and `tsc -b --pretty false` for the web app — passed.
- Scoped ESLint/Oxlint for every changed API, web, and shared source and test file — passed.
- `node ace.js migration:run` and `node ace.js migration:status` — passed; the BOM Line migration is completed in the configured development database.

## Scope Boundaries

This issue does not add BOM Line Verification, Pattern Set selection or proposals, live cost projection, Product or Product Variant relationships, derivation, editing or concurrent-save protection, lifecycle actions, or the completed operational catalog. Retained unavailable Material hardening remains in its later tracker slice. Complete test suites and `pnpm quality` were not run under the requested review boundary, and the implementation remains uncommitted.
