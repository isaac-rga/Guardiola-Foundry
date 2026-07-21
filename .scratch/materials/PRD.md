# Materials

Status: ready-for-agent

## Problem Statement

Guardiola Foundry currently has a `Materials` destination inside the authenticated app shell, but it is still a placeholder. The business maintains textile Material and vendor Source information in a spreadsheet, which makes the data useful but disconnected from the app, future Bills of Materials, and future Inventory workflows. Users need a first persisted Materials list that brings the textile Material model into the app without expanding into create/edit/delete, Supply management, full Source management, Inventory, or Bills of Materials yet.

## Solution

Introduce a persisted Materials module rooted in the existing authenticated `Materials` area. The first slice lists active textile Materials from API-backed database data imported from the current spreadsheet. Each row represents one `Material`, not one `Source`, and the table stays lean: Material identity, controlled Material Use and Material Color, normalized Meter unit, Preferred Source reference, derived cost from the Preferred Source, alternate Source count, and compact comments. Source records exist as supporting persisted data so Materials can reference valid Sources, but full Source browsing, detail, technical fields, images, and management workflows are deferred.

## User Stories

1. As a `User`, I want the `Materials` route to show real Material data, so that the authenticated workspace starts reflecting our textile reference data.
2. As a `User`, I want one row to represent one `Material`, so that the list is organized around the textile identities used by product planning.
3. As a `User`, I want Materials to be persisted API data, so that the list is not a placeholder, mock, or client-only spreadsheet view.
4. As a `User`, I want the first Materials list to be populated from the existing spreadsheet, so that current business data is available without waiting for create/edit workflows.
5. As a `User`, I want only Materials with valid linked Source data imported, so that the first list does not contain incomplete records that cannot show cost or Source context.
6. As a `User`, I want spreadsheet IDs preserved as legacy references, so that imported app records can be reconciled against the original spreadsheet.
7. As a `User`, I want Materials to have app-owned public Material IDs, so that future routes and operations do not depend on spreadsheet IDs.
8. As a `User`, I want Material IDs to use the current `M-` convention, so that Material identifiers are short and recognizable next to Product IDs.
9. As a `User`, I want each Material to have a single canonical Material Color, so that color-sensitive product outcomes are represented accurately.
10. As a `User`, I want Material Color to be controlled reference data, so that color naming stays consistent for future BOM and Inventory work.
11. As a `User`, I want each Material to have a controlled Material Use, so that I can distinguish roles like base fabric, structure, and lace consistently.
12. As a `User`, I want `Material Use` to remain on the Material, so that the table expresses how the textile is used in product construction rather than how a vendor categorizes it.
13. As a `User`, I want Materials to normalize their unit to Meter, so that future BOM quantities and Inventory quantities use one textile measurement unit.
14. As a `User`, I want Sources to preserve their purchase units separately, so that vendor units such as yards, rolls, and purchase presentations are not lost.
15. As a `User`, I want each Material in the first list to have a Preferred Source, so that the table can show a clear cost basis.
16. As a `User`, I want Material cost to be derived from the Preferred Source, so that financial data has one authoritative home.
17. As a `User`, I want alternate Sources to remain linked to a Material, so that vendor replacement options are not lost.
18. As a `User`, I want the table to show an alternate Source count, so that I can see whether a Material has backup purchasing options.
19. As a `User`, I want the table to show a quick Preferred Source reference, so that I can identify the default vendor offering without opening a Source detail view.
20. As a `User`, I want Source technical fields omitted from the Materials table, so that the Material list stays lean.
21. As a `User`, I want comments shown compactly when present, so that migration context is preserved without making rows tall.
22. As a `User`, I want long display names generated only when useful, so that repeated name/color information does not become duplicated stored data.
23. As a `User`, I want the first Materials table to fit normal desktop widths, so that it behaves like an app table rather than a wide spreadsheet clone.
24. As a `User`, I want horizontal scroll only as a fallback, so that narrower windows remain usable without making scroll the primary design.
25. As a `User`, I want the first Materials list to load all active Materials, so that I can scan the imported dataset without pagination controls.
26. As a `User`, I want the first Materials list to hide soft-deleted Materials, so that normal work starts from active data only.
27. As a `User`, I want all authenticated users to read the Materials list, so that Materials are available to normal operational workflows.
28. As an `Admin`, I want create/update/delete deferred, so that the first slice can establish reliable persisted read behavior before mutation workflows.
29. As a future implementer, I want Materials to support soft deletion in the data model, so that later references from Bills of Materials and Inventory are not threatened by hard deletes.
30. As a future implementer, I want Sources to support soft deletion in the data model, so that discontinued vendor offerings can be retired without destroying historical purchasing context.
31. As a future implementer, I want a Material to remain visible if its Preferred Source is later soft-deleted, so that Source problems do not make valid Materials disappear.
32. As a future implementer, I want future Source deletion to warn when a Source is linked to Materials, so that users understand the impact before confirming.
33. As a future implementer, I want Source deletion warnings to be especially clear for Preferred Sources, so that cost-basis changes are not accidental.
34. As a future implementer, I want Materials and Sources separated from the start, so that purchasing details do not become mixed into the textile Material identity.
35. As a future implementer, I want Material Sources and Supply Sources allowed to diverge later, so that different purchasing workflows can grow without forcing one model shape.
36. As a future implementer, I want Supplies kept out of this first feature, so that non-textile production inputs can be modeled separately later.
37. As a future implementer, I want Tools and workshop supplies kept out of Materials, so that non-consumed operational items do not pollute BOM-ready textile data.
38. As a future implementer, I want Textile Family to remain Source-owned controlled reference data, so that Source filtering and comparison can be built later without moving vendor classification onto Material.
39. As a future implementer, I want a Source to be able to provide multiple Material Colors, so that shared financial and technical specs do not require duplicate Source records.
40. As a future implementer, I want Materials not to be modeled as generally interchangeable with each other, so that subtle textile differences are preserved.
41. As a future implementer, I want Source interchangeability captured through multiple Sources for one Material, so that vendor alternatives are modeled without claiming different Materials are equivalent.
42. As a future implementer, I want Source images ignored in the first Materials UI, so that missing or inconsistent spreadsheet image links do not shape the first slice.
43. As a future implementer, I want summary stats and dashboards deferred, so that the first route focuses on the persisted table.
44. As a future implementer, I want table filtering and search deferred, so that the first slice can stay focused on persisted listing and data shape.
45. As a future implementer, I want the first API response shaped for the lean table, so that the web route does not need to understand full Source internals.
46. As a future implementer, I want the same app shell and route-level behavior patterns used by Products, so that Materials feels native inside the authenticated workspace.

## Implementation Decisions

- `Material` means textile-only BOM-ready input. It does not include Supplies, Tools, or workshop supplies.
- `Supply` is a separate future concept for non-textile production inputs such as boning, thread, zippers, buttons, cups, trims, and similar consumables.
- Supplies should eventually appear as a separate tab or section, but this PRD defines Materials only.
- `Source` means a vendor-specific offering used to purchase a Material or Supply.
- Source records own vendor, purchasing, financial, technical, purchase-unit, and future image/shade details.
- Material Source and Supply Source may diverge later if their fields or workflows become meaningfully different.
- The first Materials screen is Material-first: one table row represents one Material.
- The first Materials table should not use Source records as row identity.
- Each Material in the first imported/listed dataset must have a Preferred Source.
- Preferred Source is the default purchasing and cost basis for the Material.
- Material cost is derived from the Preferred Source normalized cost, not copied onto Material.
- Alternate Sources remain linked to Materials as backup or replacement options.
- Source interchangeability is supported by multiple Sources for the same Material.
- Material-to-Material interchangeability is not part of this model because color tonality, flow dynamics, textile weight, and similar properties matter.
- `Material Use` is a controlled Material-owned reference value.
- `Textile Family` is a controlled Source-owned reference value.
- `Material Color` is a single controlled canonical Material-owned value.
- Vendor shade names or color codes may be captured later on Source detail without replacing Material Color.
- `Material Unit` is normalized to Meter for Materials.
- Sources can preserve vendor purchase units such as yards, meters, rolls, and purchase presentations, plus conversion and normalized cost data.
- Material public IDs should use an `M-` prefix for now, matching the existing Product `P-` style.
- The `M-` prefix is a working convention and may be revisited before implementation if the broader identifier scheme changes.
- Imported Materials should preserve spreadsheet IDs as legacy import references.
- Imported Sources should preserve spreadsheet Source IDs as legacy import references.
- Only Materials with valid linked Source data should be included in the initial import.
- Rows with missing or unresolved Source references are data cleanup outside the initial slice.
- When a spreadsheet Material has multiple linked Sources, the first listed Source becomes the initial Preferred Source.
- The first persisted dataset should be seeded or imported from the current spreadsheet.
- The first Materials API returns a table-shaped Material summary DTO.
- The first API should not return full nested Source records.
- The Material summary should include Material ID, name, Material Color, Material Use, Material Unit, Preferred Source reference, derived cost, alternate Source count, and compact comments.
- The Preferred Source reference should be quick and shallow, such as source name or vendor-facing label plus provider context and derived cost.
- The first Materials table should stay lean and omit Source technical fields such as GSM, width, fiber, composition, finish, weave, or country of origin.
- A full Sources table or Source detail view is deferred.
- Images are out of scope and should not be assumed available.
- Spreadsheet Source image links should not drive the first Materials UI.
- Comments should be shown compactly through truncation or an indicator so row height stays dense.
- The first Materials table should be lean enough to fit normal desktop widths.
- Horizontal scrolling is acceptable only as a fallback for narrower screens or windows.
- The first list loads all active Materials; pagination is out of scope.
- Table filtering and search are out of scope.
- Summary stats, dashboards, and category charts are out of scope.
- All authenticated users may read the Materials list.
- Create, update, delete, restore, import UI, table filtering, and table search are follow-up issues.
- Materials should support soft deletion in the data model from the start.
- Sources should support soft deletion in the data model from the start.
- The first Materials list shows active Materials only.
- If a Material's Preferred Source is later soft-deleted, the Material remains visible and should eventually show a warning that the Preferred Source needs attention.
- Future Source deletion should warn the user before confirmation when the Source is linked to one or more Materials, especially if it is a Preferred Source.
- The feature should use the existing authenticated app shell route and replace the Materials placeholder with a real table route.
- The API should follow the existing vertical slice pattern for domain modules.
- Shared API/web contracts and validation should be added for Material summaries and any import/seed data shapes that cross the API/web boundary.
- Source technical/detail data can exist in persistence to support Preferred Source cost and future Source screens, but the first web DTO should expose only what the Materials table needs.

## Testing Decisions

- Good tests for this slice should verify external behavior rather than implementation details.
- The highest-value API seam is the authenticated Materials HTTP list endpoint.
- API tests should verify authentication is required for the Materials list.
- API tests should verify all authenticated roles that can use the app can read the Materials list.
- API tests should verify the list returns active Materials only.
- API tests should verify each returned Material summary has a public Material ID, name, Material Color, Material Use, Meter unit, Preferred Source reference, derived cost, alternate Source count, and comments when present.
- API tests should verify Material cost is derived from the Preferred Source rather than a copied Material field.
- API tests should verify Materials with multiple Sources expose the correct alternate Source count.
- API tests should verify the initial import/seed excludes Materials with missing or unresolved Source references.
- API tests should verify the first listed linked Source becomes Preferred Source during import/seed.
- API tests should verify legacy spreadsheet IDs are preserved internally enough for reconciliation without becoming the public Material ID.
- API tests should verify soft-deleted Materials are excluded from the first list.
- API tests should verify Source soft-delete support does not hard-delete linked Source history.
- The highest-value web seam is the authenticated `/app/materials` route.
- Web route tests should verify the placeholder is replaced by a Materials table.
- Web route tests should verify the table renders one row per Material, not one row per Source.
- Web route tests should verify the visible columns match the lean Material summary instead of Source technical details.
- Web route tests should verify comments remain compact and do not create expanded spreadsheet-like rows.
- Web route tests should verify empty/error/loading states from the route user's perspective.
- Web route tests should avoid asserting component internals, query-key names, or model implementation details.
- Prior art for API behavior tests is the existing functional endpoint coverage around Products.
- Prior art for web behavior tests is the existing route-level Product and app-shell coverage.

## Out of Scope

- User-facing Material create, update, delete, or restore workflows — the first slice should prove persisted listing and imported data shape before adding mutation workflows.
- User-facing Source create, update, delete, restore, table, or detail workflows — Sources are persisted only as supporting data for Materials in this slice; a full Sources experience should be planned separately.
- Supply modeling beyond the glossary and separation decision — Supplies are intentionally separate from textile Materials, but their fields, units, inventory rules, and UI deserve their own future session.
- Tools and workshop supply workflows — tools and non-consumed workshop items do not belong in the Material model and should not be forced into this slice.
- Bills of Materials creation, editing, or display — Materials are being prepared for future BOM usage, but the Product composition workflow is a separate feature.
- Inventory and Inventory movement workflows — Material quantities, warehouse positions, and movement history depend on the Material model but are not part of the first read-only Materials list.
- Table search — search can be added after the baseline table and API contract are stable.
- Table filters — filtering can be planned once the team sees which Material, Source, and reference-data fields are most useful in the real app.
- Pagination — the imported Materials dataset is small enough for a full-list workflow; pagination should wait until real volume requires it.
- Summary stats — counts and at-a-glance metrics can be useful later, but the first screen should focus on the operational table.
- Dashboards — dashboard surfaces would change the page goal from reference-listing to analysis and should be scoped separately.
- Category charts — visual breakdowns by Material Use, Textile Family, Source, or color can wait until reporting needs are clearer.
- Source technical fields in the Materials table — GSM, width, fiber, composition, finish, weave, and country of origin belong to a later Source table or detail surface.
- Source images or Material images — images are not available or reliable enough for the first Materials UI and should not drive this slice.
- Full Source comparison — comparing vendor offerings horizontally is a Source workflow, not part of the lean Materials table.
- Material-to-Material interchangeability — current domain decisions only support Source alternatives for the same Material; different Materials are not generally interchangeable.
- Preferred Source change UI — the initial Preferred Source comes from import order; user-controlled Preferred Source changes should arrive with Source management.
- Source deletion warning UI — the warning behavior is decided for later Source management, but this slice has no Source deletion action.
- Draft Materials without Preferred Sources — every imported/listed Material must have a Preferred Source; draft behavior should be decided when create/edit workflows are designed.
- Import UI or admin-managed import workflows — the first dataset may be seeded/imported by implementation code, but users will not manage imports through the app yet.
- Reference-data management UI for Material Use, Material Color, or Textile Family — these values are controlled reference data, but managing those lists is a separate administrative workflow.
- URL-synced table state — without first-slice search, filters, or pagination, URL state would add complexity without user-facing value.
- Bulk actions — the first slice has no row mutations, so bulk selection/actions should wait for future management workflows.

## Further Notes

- This PRD is grounded in the spreadsheet shape with `Materials for BOMS` and `Sourcing` sheets, but the app language is `Materials` and `Sources`.
- The temporary spreadsheet `En BOMs` column is not a domain concept and should be ignored for feature modeling.
- The spreadsheet has many Source rows that are not linked to Materials; those belong to later Source, Supply, Tool, or cleanup work unless they are needed for valid linked Material imports.
- The first slice should feel like a real operational page while staying intentionally narrow: persisted data, authenticated API, and a lean table.
- The domain language fixed during design should remain stable in implementation: `Material`, `Material ID`, `Material Use`, `Material Color`, `Material Unit`, `Supply`, `Source`, `Textile Family`, and `Preferred Source`.
- The current ADR for separating Materials and Supplies should be treated as the planning source of truth for this slice.
- The first implementation fixture imports only Materials whose listed Source IDs resolve to imported Sources. In the current fixture, `MAT-999` is intentionally skipped because it references unresolved Source ID `SRC-MISSING`; this preserves the rule that listed Materials need a valid Preferred Source.
- Deferred Source work remains separate from the first Materials list: Source table/detail screens, technical fields, Source images, Preferred Source changes, and Source deletion warnings should be planned as their own follow-up slices.
- Deferred non-Material domains remain out of scope for this feature: Supplies, Tools, Inventory, Inventory movement, and Bills of Materials should not be folded into the textile Materials list.
- Deferred table mechanics remain out of scope until there is a user need: search, filters, pagination, summary stats, dashboards, category charts, bulk actions, and URL-synced table state.
