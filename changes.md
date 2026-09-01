# Source Details, Vendor Shades, and Attention States

This slice completes Sources issue 03. It extends the commercial Source catalog with optional technical knowledge and future-cost inputs, adds Source-owned Vendor Shades, and makes relationship shade ownership a database invariant. It does not add Source screens or calculate Landed Unit Cost.

## Start With The Issue

Read [.scratch/sources/issues/03-import-source-details-and-vendor-shades.md](.scratch/sources/issues/03-import-source-details-and-vendor-shades.md). The slice is persistence and import work only. Source browsing remains issue 04, and user-managed Source editing remains issue 07.

## Follow The Persistence Change

Open [apps/api/database/migrations/1788199200000_add_source_details_and_vendor_shades.ts](apps/api/database/migrations/1788199200000_add_source_details_and_vendor_shades.ts), then [apps/api/app/models/material_source.ts](apps/api/app/models/material_source.ts) and [apps/api/app/modules/sources/models/vendor_shade.ts](apps/api/app/modules/sources/models/vendor_shade.ts).

The migration adds the optional Source fields named by the PRD:

- Vendor SKU, URL, description, manufacturer, fiber, composition, finish, weave, presentation notes, country of origin, and comments;
- GSM in grams per square meter and width in centimeters;
- estimated shipping in USD-per-kilogram cents and IGI as percentage points.

Positive database checks protect GSM and width, while IGI is constrained to 0–100 percent. IVA is deliberately absent from Source persistence: [apps/api/app/modules/sources/source_catalog.ts](apps/api/app/modules/sources/source_catalog.ts) exposes the fixed `16` percent business rule instead of creating a per-Source editable value.

Future-cost inputs remain context only. The importer stores them but never derives, replaces, or updates the manual Landed Unit Cost.

## Trace Vendor Shade Ownership

The migration creates `material_source_vendor_shades`, where each Vendor Shade belongs to exactly one Source and stores the Vendor's name or code. A Material–Source link may hold a nullable Vendor Shade selection.

The important protection is a composite foreign key over both Vendor Shade and Source. A link can therefore omit a Vendor Shade, or choose one owned by its linked Source, but PostgreSQL rejects a shade belonging to another Source even if code writes around the importer.

[apps/api/app/models/material_source_link.ts](apps/api/app/models/material_source_link.ts) exposes the optional relationship, while [apps/api/app/modules/materials/materials_importer.ts](apps/api/app/modules/materials/materials_importer.ts) resolves explicit imported shade names through the Source-owned import result.

## Compare The Import With Workbook Evidence

The checked-in [apps/api/database/fixtures/source_catalog_import_fixture.ts](apps/api/database/fixtures/source_catalog_import_fixture.ts) still represents all 280 populated `Sourcing` rows. The optional mapping now preserves 1,089 populated workbook values overall, including 802 values on the 156 `Textil` candidates.

The mapping keeps the workbook's facts in explicit fields and units:

- `Description`, `URL`, `Manufacturer`, `Fibra`, `Composición`, `Acabado`, `Tejido`, `Presentación`, `Pais de origen`, and `Comentarios` remain text;
- positive `GSM` and `Ancho` values become grams per square meter and centimeters;
- `Precio de envio por KG` becomes integer USD cents per kilogram;
- `% de IGI` becomes percentage points.

Zero or formula-error GSM/width cells are treated as absent technical data because zero is not a physically valid measurement. No replacement value is invented.

The workbook has no dedicated Vendor Shade column, but 66 textile rows contain explicit `Color:` or `Colors:` labels in Description. Those labels contribute 85 preserved Vendor Shade names/codes. Other free-form color prose is left in Description rather than guessed into structured data. The deterministic import fixture in [apps/api/database/fixtures/materials_import_fixture.ts](apps/api/database/fixtures/materials_import_fixture.ts) also supplies an explicit Vendor Shade selection so the persisted Material relationship remains fully exercised.

One workbook row describes a one-inch trim but records width as `5`. Because that conflicts with the declared centimeter unit and the two-inch row also records `5`, the one-inch width remains absent and derives `Data needs attention` rather than importing a contradictory canonical value.

The workbook still has no auditable Price Date. `source:import-catalog` therefore continues to report 124 ignored non-textile rows, 156 Source exclusions, zero imported catalog Sources, and exit code 1. Issue 03 preserves optional facts for those rows without weakening issue 02's commercial-core gate.

## Inspect Source-Owned Import And Attention Rules

[apps/api/app/modules/sources/source_catalog_importer.ts](apps/api/app/modules/sources/source_catalog_importer.ts) writes a Source and its supplied Vendor Shades in one transaction. Vendor Shade reruns are stable and additive: an existing Source-owned name/code is reused rather than duplicated.

[apps/api/app/modules/sources/source_catalog.ts](apps/api/app/modules/sources/source_catalog.ts) derives two independent conditions:

- `Cost needs attention` applies only to an Active Source without manual Landed Unit Cost.
- `Data needs attention` applies when optional Source detail is missing.

Both remain non-blocking catalog information. A Source with missing optional details or no Vendor Shades remains valid and can be linked to a Material. Preferred Source eligibility still depends on Active status and Landed Unit Cost, not optional enrichment.

## Read The Tests As Specifications

[apps/api/tests/functional/materials/materials_importer.spec.ts](apps/api/tests/functional/materials/materials_importer.spec.ts) now proves that:

- every optional field and canonical unit persists;
- future-cost inputs do not recalculate manual Landed Unit Cost;
- IVA remains the fixed 16 percent rule;
- missing optional data derives non-blocking `Data needs attention`;
- missing manual cost on an Active Source derives `Cost needs attention`;
- Vendor Shades belong to Sources and import without duplication;
- a relationship may select an owned Vendor Shade or omit it;
- the database rejects a relationship that selects another Source's Vendor Shade;
- the full workbook fixture retains the known structured exclusion behavior.

## Review Follow-Up

The first two-axis review identified a Source model placed outside its vertical slice, a duplicated optional-field list, missing structured shade extraction from explicit workbook labels, and the contradictory one-inch width. The implementation now keeps the new model under `modules/sources`, derives the attention input type from one authoritative field list, preserves all high-confidence shade labels, and leaves the contradictory width absent.

The follow-up Standards review and Spec review both report no remaining findings.

## Verification

- The focused database-backed importer suite passes with 19 tests.
- API lint and strict typecheck pass.
- The development migration is applied; migration status reports all 13 migrations completed.
- Normal `db:seed` succeeds with the deterministic Source, Vendor Shade, and relationship data.
- `source:import-catalog` returns the expected non-success audit: 124 ignored non-textile rows and 156 Source exclusions caused by existing workbook cleanup needs.
- Repository-wide lint and strict typecheck pass across the API, web app, and shared packages.
- The complete test suites pass with 55 API tests and 37 web tests.
- Production builds pass for the API, web app, and shared packages.

## What Comes Next

Issue 04 is the next implementation slice: an authenticated, table-shaped Source catalog with search, approved filters, URL state, attention indicators, and sibling Materials/Sources navigation. Workbook Price Dates—and the two invalid Textile Family values already reported by the audit—remain source-data cleanup, not application defaults.
