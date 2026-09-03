# Sources and Preferred Source Management

Status: ready-for-agent

## Problem Statement

Guardiola Foundry now has a persisted, read-only Materials list backed by a minimal set of imported Source records, but users cannot inspect or maintain the vendor offerings behind those Materials. The current application can warn that a Preferred Source needs attention, yet it provides no operational path to correct Source data, link an alternative, change the Preferred Source, or safely retire an unavailable offering. The spreadsheet contains substantially more textile Source knowledge than the application currently persists, including unlinked offerings, mixed USD and MXN pricing, purchase presentations, technical attributes, and vendor shade information. Users need a trustworthy Source catalog and a safe Material–Source relationship workflow before Material creation, Inventory, Bills of Materials, or broader purchasing features can rely on this data.

## Solution

Add a `Sources` sibling view within the Materials area. The view provides an independent, searchable Source catalog with Source detail, creation, editing, retirement, restoration, commercial data, optional technical data, manual Landed Unit Cost, Vendor Shades, and linked-Material context. Add a read-only Material detail/relationship Dialog to the Materials view so users can link existing Sources, unlink alternates, and change Preferred Source without expanding into Material-field editing.

Populate the catalog from every spreadsheet row categorized as `Textil`, including Unlinked Sources, while excluding Supply, Tool, workshop, and invalid records through a structured migration report. Preserve the invariant that every Active Material has exactly one linked, Active Preferred Source with a recorded Landed Unit Cost. Keep the first workflow operationally honest: Landed Unit Cost is entered by users, future calculation inputs are stored without calculating, the global `USD:MXN` rate is read-only and informational, and deferred automation is named explicitly rather than implied.

## User Stories

1. As a User, I want `Materials` and `Sources` to appear as sibling views, so that textile identities and vendor offerings remain distinct but easy to navigate.
2. As a User, I want a Source table independent from the Materials table, so that one Source row represents one vendor offering rather than one Material.
3. As a User, I want the Sources table to show all Active Sources by default, so that ordinary work focuses on currently available offerings.
4. As a User, I want Unlinked Sources included in the default catalog, so that useful textile offerings remain visible before they are assigned to a Material.
5. As an Admin, I want to include Retired Sources through a status filter in the same table, so that recovery work does not require a separate retired-record screen.
6. As an Operator, I want Retired Sources excluded from my results, so that ordinary purchasing work does not expose unavailable records or recovery actions.
7. As a User, I want to search Sources by Source Name or Vendor, so that I can locate an offering using the business information I normally know.
8. As a User, I want to filter Sources by Textile Family, so that I can focus on a particular kind of textile offering.
9. As an authorized User, I want to filter Sources by Source Status, so that I can distinguish Active and Retired offerings when my role permits it.
10. As a User, I want to filter Sources by linked or Unlinked relationship state, so that I can find offerings that still need Material assignment.
11. As a User, I want to filter Sources by attention state, so that I can focus on incomplete catalog or costing information.
12. As a User, I want Source search and filters preserved in the URL, so that my working view survives refresh and can be shared.
13. As a User, I want Sources ordered by Source Name and then Vendor by default, so that the catalog is predictable to scan.
14. As a User, I want the full known Source list available without pagination controls, so that search and filtering feel immediate at the current data volume.
15. As a User, I want the Source table to remain usable through efficient filtering and rendering, so that loading the full list does not make the interface sluggish.
16. As a User, I want horizontal scrolling when the commercial columns do not fit, so that useful catalog data is not hidden or compressed into unreadable rows.
17. As a User, I want each Source row to show Source ID, Source Name, Vendor, Textile Family, purchase presentation and unit, Vendor Currency and Purchase Price, Landed Unit Cost, linked Material count, and attention indicators, so that I can assess the record before opening it.
18. As a User, I want technical details kept out of the default table, so that the catalog remains an operational list rather than a spreadsheet-width technical report.
19. As a User, I want to open a Source detail view, so that I can inspect its complete commercial, technical, costing-input, shade, and Material-link context.
20. As a User, I want a stable public Source ID using the `S-0001` convention, so that Source routes and operations do not depend on spreadsheet identifiers.
21. As a User, I want Source IDs allocated independently of spreadsheet order, so that reordering an import cannot reassign application identity.
22. As a future implementer, I want imported legacy Source IDs preserved as optional immutable provenance, so that spreadsheet reconciliation remains possible without making legacy IDs the application identity.
23. As a User, I want Source Name required, so that every catalog entry has a usable offering identity.
24. As a User, I want Vendor required as a name on the Source, so that I know which organization sells the offering without waiting for a separate Vendor catalog.
25. As a User, I want Textile Family selected from the seeded controlled list, so that classification does not drift through free-text variants.
26. As a User, I want the initial Textile Family list to preserve the workbook values exactly, so that migration does not silently rename or merge business categories.
27. As a User, I want Purchase Presentation stored separately from Purchase Unit, so that physical packaging and pricing measurement remain distinct.
28. As a User, I want Purchase Presentation controlled as Roll or Piece, so that values such as `Pieza 3m` are represented structurally rather than embedded in a label.
29. As a User, I want a fixed piece length stored separately when applicable, so that a three-meter piece is not confused with minimum order quantity.
30. As a User, I want Purchase Unit controlled as Meter or Yard, so that Vendor pricing can be interpreted consistently.
31. As a User, I want Minimum Purchase Quantity stored in the Source's Purchase Unit, so that Vendor order constraints remain explicit.
32. As a User, I want Purchase Price stored per Purchase Unit, so that the quoted amount has an auditable basis.
33. As a User, I want Price Date required and visible, so that I can tell when the current Vendor price was recorded.
34. As a User, I want Vendor Currency limited to USD or MXN, so that the first catalog uses currencies the selected conversion model understands.
35. As a User, I want the original Vendor Currency preserved, so that a USD quote does not become indistinguishable from an MXN quote.
36. As a User, I want Landed Unit Cost recorded in MXN per meter, so that Preferred Sources provide one comparable Material cost basis.
37. As a User, I want to enter Landed Unit Cost manually, so that Source management can proceed before calculation rules are designed.
38. As a User, I want an Active Source without Landed Unit Cost marked `Cost needs attention`, so that missing cost is visible without discarding an otherwise valid offering.
39. As a User, I want a Source without Landed Unit Cost prevented from becoming Preferred, so that an Active Material never loses its authoritative cost basis.
40. As a User, I want missing optional Source information marked `Data needs attention`, so that enrichment work is visible without making the Source invalid.
41. As a User, I want `Data needs attention` to remain non-blocking, so that optional technical gaps do not prevent Material relationships.
42. As a User, I want the global `USD:MXN` Currency Conversion Rate and Effective Date visible above the Sources table, so that I know the application's current conversion assumption.
43. As a User, I want the reciprocal `MXN:USD` rate displayed from the same global value, so that the two directions cannot contradict each other.
44. As a User, I want a clear message when the global Currency Conversion Rate is not configured, so that its absence is not mistaken for a valid setting.
45. As a User, I want USD Sources to remain editable when the global rate is missing, so that an informational setting does not block catalog maintenance while Landed Unit Cost remains manual.
46. As a User, I want optional structured fields for Vendor SKU, URL, description, manufacturer, fiber, composition, GSM, width, finish, weave, presentation notes, country of origin, and comments, so that technical knowledge can be added when available.
47. As a User, I want GSM recorded in grams per square meter and width recorded in centimeters, so that technical measurements have explicit canonical units.
48. As a User, I want estimated shipping recorded in USD per kilogram, so that the future costing input has an unambiguous currency and unit.
49. As a User, I want IGI recorded as a Source-specific percentage, so that future landed-cost logic can use the applicable import-duty assumption.
50. As a User, I want IVA represented as the fixed 16 percent business rule, so that the first model does not imply Source-specific IVA rates.
51. As a User, I want future Landed Unit Cost inputs grouped and labeled clearly, so that I understand that editing them does not recalculate the manual Landed Unit Cost.
52. As a User, I want a Source to own multiple optional Vendor Shades, so that one commercial and technical offering can cover multiple Material Colors.
53. As a User, I want a Vendor Shade to contain the Vendor's color name or code, so that Vendor terminology does not replace canonical Material Color.
54. As a User, I want a Material–Source relationship to identify the applicable Vendor Shade when known, so that each single-color Material maps to the correct offered shade.
55. As a User, I want a Source allowed to have no Vendor Shade data, so that missing Vendor shade information does not require invented placeholder values.
56. As an Admin or Operator, I want to create Sources from the Sources catalog, so that new offerings have one authoritative creation workflow.
57. As an Admin or Operator, I want new Sources to satisfy the required commercial core before saving, so that app-created catalog records are operationally usable.
58. As an Admin or Operator, I want to edit Source commercial, technical, shade, and manual Landed Unit Cost data, so that the catalog can be corrected and enriched over time.
59. As an Admin or Operator, I want Source ID and legacy provenance immutable during editing, so that application identity and import reconciliation remain stable.
60. As an Admin or Operator, I want to retire an Unlinked Source directly, so that an unavailable offering with no Material impact can leave the active catalog.
61. As an Admin or Operator, I want to see affected Active Materials before retiring an alternate Source, so that I understand current relationship impact.
62. As an Admin or Operator, I want retiring an alternate Source to preserve its Material links for history, so that earlier sourcing context is not erased.
63. As a User, I want Retired Sources excluded from active alternate counts, so that the Materials table does not overstate purchasing backup.
64. As a User, I want Retired Sources unavailable for new Material links or Preferred selection, so that unavailable offerings cannot drive purchasing decisions.
65. As an Admin or Operator, I want retirement blocked when the Source is Preferred for an Active Material, so that retirement cannot invalidate Material cost authority.
66. As an Admin or Operator, I want every affected Material identified when Preferred Source retirement is blocked, so that I know which replacements are required.
67. As an Admin, I want to restore a Retired Source while preserving its historical Material links, so that a renewed offering can return to use without reconstructing context.
68. As an Admin, I want restoration never to reinstate Preferred status automatically, so that earlier sourcing choices are not silently reversed.
69. As an Admin, I want a restored Source eligible for Preferred selection only when it has Landed Unit Cost, so that restoration respects the same cost rule as every Active Source.
70. As a User, I want Source detail to show linked Materials read-only, so that I can understand usage without creating a second relationship-editing surface.
71. As a User, I want a linked Material on Source detail to open that Material's relationship Dialog in the Materials view, so that I can act in the authoritative Material context.
72. As a User, I want a Source reference in the Materials view to open Source detail, so that navigation works in both directions.
73. As a User, I want a read-only Material detail/relationship Dialog, so that I can inspect Material identity and sourcing relationships without expanding into Material-field editing.
74. As an Admin or Operator, I want to link an existing Source from the Material relationship Dialog, so that an Unlinked catalog offering can become a Material option.
75. As an Admin or Operator, I want Source creation unavailable inside the Material Dialog, so that creation remains a deliberate catalog workflow.
76. As an Admin or Operator, I want to unlink an alternate Source after confirmation, so that obsolete relationships can be corrected without deleting the Source record.
77. As an Admin or Operator, I want a Preferred Source protected from direct unlinking, so that an Active Material cannot be left without cost authority.
78. As an Admin or Operator, I want to replace Preferred Source atomically, so that the selected eligible Source is promoted while the former Preferred Source becomes an alternate in one operation.
79. As a User, I want every Active Material to have exactly one linked, Active Preferred Source with Landed Unit Cost, so that Material cost is never absent or ambiguous.
80. As a User, I want Vendor Shade selection available on a Material–Source relationship when the Source defines shades, so that the Material maps to the correct vendor color reference.
81. As a future implementer, I want Material–Source relationship changes to preserve historical Source links through retirement and restoration, so that lifecycle changes do not destroy sourcing context.
82. As a migration operator, I want every workbook row categorized as `Textil` considered for Source migration, so that linked and Unlinked textile offerings enter the catalog.
83. As a migration operator, I want Supply, Tool, and workshop rows excluded, so that non-textile concepts do not enter the Source catalog defined by this PRD.
84. As a migration operator, I want invalid Source rows excluded rather than partially persisted, so that incomplete commercial records remain anchored to cleanup in the original workbook.
85. As a migration operator, I want Materials with zero or multiple Preferred Sources excluded rather than guessed, so that migration does not make unauthorized purchasing decisions.
86. As a migration operator, I want one structured report containing every exclusion, so that I can clean all known invalid rows in one pass.
87. As a migration operator, I want each exclusion to identify legacy ID, record type, invalid or missing fields, and corrective guidance, so that the report is actionable.
88. As a migration operator, I want exclusions to make the overall migration result non-successful even when valid rows persist, so that automation cannot report partial migration as clean completion.
89. As a User, I want future imports prevented from overwriting user-edited Source fields, so that application maintenance remains authoritative after migration.
90. As a User, I want future imports prevented from overwriting Material links, Source Status, Landed Unit Cost, or Preferred Source choices, so that import cannot erase operational decisions.
91. As a migration operator, I want future imports allowed to add new valid records and populate untouched imported data, so that additive refresh remains possible without destructive reconciliation.
92. As a User, I want clear loading, empty, error, and permission states across the Sources table, Source detail, and Material Dialog, so that failures are understandable and recoverable.
93. As a User, I want validation messages attached to the relevant Source fields while preserving my entered values, so that I can correct a rejected create or edit submission.
94. As a User, I want retirement, restoration, link, unlink, and Preferred Source failures explained in business language, so that lifecycle safeguards do not appear as generic technical errors.
95. As an unauthenticated visitor, I want Source and Material relationship endpoints protected, so that business sourcing data remains private.

## Implementation Decisions

- This PRD is limited to Sources eligible to supply textile Materials. `Source` remains the canonical domain term; Supply and Tool sourcing are not modeled here.
- The feature extends the existing Materials domain boundary rather than creating a speculative generic procurement architecture.
- Use the existing authenticated application shell and vertical-slice API style. Keep HTTP controllers thin, business rules in concrete domain services, web routes thin, and server state in feature-local query and mutation modules.
- Shared types and validation schemas remain the source of truth for API request and response contracts that cross the API/web boundary.
- The Materials area gains sibling `Materials` and `Sources` views. Sources have an independent table and detail route.
- The default Source list contains Active Sources, including Unlinked Sources. Admins may include Retired Sources through the same status filter; Operators cannot access Retired Source data.
- Admins and Operators may read, create, edit, retire, link, unlink, and change Preferred Source. Only Admins may include Retired Sources, open Retired Source detail, and restore a Source.
- Source list search is limited to case-insensitive Source Name and Vendor matching.
- Source list filters are Textile Family, authorized Source Status, Material link state, and attention state.
- Search and filter state is URL-synchronized. Default sorting is Source Name ascending, then Vendor ascending.
- Load the full Source list without pagination at the known data volume. Use efficient table projection, filtering, and rendering techniques, and permit horizontal scroll when needed.
- Default Source columns are Source ID, Source Name, Vendor, Textile Family, Purchase Presentation and Purchase Unit, Vendor Currency and Purchase Price, Landed Unit Cost, linked Material count, and attention indicators.
- Source detail contains full commercial data, optional technical data, optional future costing inputs, Vendor Shades, Source Status, attention conditions, and read-only linked Materials.
- Source public IDs are stable sequential app-owned identifiers using the `S-0001` convention. Allocation is independent of spreadsheet order and remains stable across reruns.
- Existing `MS-` identifiers are migrated to the new `S-` convention before Source IDs become a user-facing routing contract.
- Legacy spreadsheet Source ID is nullable for app-created Sources and immutable when present.
- Source Name and free-text Vendor are required. Vendor remains a name value on Source; no Vendor entity is introduced.
- Textile Family is required controlled reference data seeded exactly from the workbook values: `Chiffon`, `Crepe`, `Crin`, `Encaje`, `Entretela`, `Georgette`, `Malla`, `Organza`, `Satin`, `Silk Organza`, `Taffeta`, and `Tul`.
- Purchase Presentation is required and controlled as Roll or Piece. Fixed piece length is stored separately when applicable.
- Purchase Unit is required and controlled as Meter or Yard.
- Minimum Purchase Quantity is required, positive, and measured in Purchase Unit.
- Purchase Price is required, nonnegative, and expressed per Purchase Unit.
- Price Date is required. This PRD stores only the current Purchase Price, Price Date, and Landed Unit Cost.
- Vendor Currency is required and limited to USD or MXN.
- Landed Unit Cost is an optional user-specified, nonnegative MXN-per-meter value. It is not calculated in this PRD.
- `Cost needs attention` is derived when an Active Source has no Landed Unit Cost. Such a Source remains valid but cannot become Preferred.
- `Data needs attention` is a non-blocking condition derived from missing optional Source information. Missing optional data does not make the Source invalid and does not prevent Material links.
- The application reads one global database-managed `USD:MXN` rate and Effective Date, derives the displayed reciprocal `MXN:USD`, and shows both above the Sources table.
- The global rate has no editing UI. If it is missing or invalid, the table shows a clear configuration message, but USD Source creation and editing remain available because this PRD performs no currency conversion.
- Optional structured Source fields include Vendor SKU, URL, description, manufacturer, fiber, composition, GSM, width, finish, weave, presentation notes, country of origin, comments, estimated shipping, and IGI.
- GSM uses grams per square meter, width uses centimeters, estimated shipping uses USD per kilogram, IGI is a Source-specific percentage, and IVA is the fixed 16 percent business rule rather than a Source-specific value.
- Future Landed Unit Cost inputs are grouped and labeled to state that editing them does not recalculate Landed Unit Cost.
- A Source owns zero or more Vendor Shades. A Vendor Shade stores the Vendor's shade name or code and has no availability lifecycle in this PRD.
- A Material–Source relationship may reference one Vendor Shade owned by that Source. The relationship may omit shade when the Vendor does not provide one.
- Source Status is Active or Retired. New Sources default to Active.
- Source ID and legacy provenance are immutable. All other Source commercial, technical, shade, and manual cost fields are editable by Admins and Operators.
- One Source may link to multiple Materials and one Material may link to multiple Sources. A Source may remain Unlinked.
- Every Active Material must have exactly one Preferred Source. It must be linked, Active, and have Landed Unit Cost.
- Preferred Source changes execute atomically: the selected eligible Source becomes Preferred and the former Preferred Source becomes an alternate.
- Relationship mutation is owned by the Material detail/relationship Dialog. Source detail shows linked Materials read-only.
- The Material Dialog shows read-only Material identity plus active and historical Source relationships. It does not permit Material-field editing.
- The Material Dialog can link an existing Source, unlink an alternate after confirmation, select an eligible Preferred Source, and select an applicable Vendor Shade. It cannot create a Source.
- A Preferred Source cannot be unlinked until an eligible replacement is promoted atomically.
- Material-to-Source navigation opens Source detail. Source-to-Material navigation opens the Materials view with the relevant Material Dialog.
- Retiring an alternate or Unlinked Source is allowed after showing affected Active Materials when applicable. Retirement preserves historical links, excludes the Source from active alternate counts, and removes it from linking and Preferred eligibility.
- Retiring a Source that is Preferred for any Active Material is blocked until an eligible replacement is assigned for every affected Material.
- Restoring a Source preserves historical links and returns it to Active status. It never restores Preferred status automatically and becomes Preferred-eligible only when Landed Unit Cost exists.
- The initial catalog migration considers every workbook row categorized as `Textil`, including Unlinked rows, and excludes Supply, Tool, and workshop rows.
- An imported Source missing required commercial-core data is excluded rather than persisted. Cleanup remains in the original workbook.
- A Material with zero or multiple Preferred Sources is excluded rather than migrated invalidly or repaired through an inferred choice.
- Migration returns one structured report containing legacy ID, record type, missing or invalid fields, and corrective guidance for every exclusion.
- Valid rows may persist when exclusions occur, but any exclusion makes the overall migration outcome non-successful.
- Future imports are additive and non-destructive after user management exists. They may add new valid records and populate untouched imported data, but cannot overwrite user-edited Source fields, Material links, Source Status, Landed Unit Cost, or Preferred Source choices.
- Source create and update validation returns field-level errors. Lifecycle and relationship conflicts return business-language errors that the web UI can display without discarding user input.
- The API exposes authenticated Source list, Source detail, Source create, Source update, Source retirement, Source restoration, global Currency Conversion Rate, Material relationship detail, link, unlink, and Preferred Source mutation contracts.
- The list contract is table-shaped and excludes full technical payloads. The detail contract exposes the full Source record and read-only linked-Material summaries.
- Material list summaries continue deriving Material cost from Preferred Source Landed Unit Cost and count only Active alternate Sources.
- Database rules and transactional services must prevent duplicate Material–Source links and protect exactly-one-Preferred behavior during user mutations.

## Testing Decisions

- Good tests assert external behavior, authorization, persisted outcomes, API contracts, and user-visible states rather than controller structure, ORM calls, query keys, component internals, or table-library configuration.
- Use three high-value seams: authenticated API functional tests, route-level web behavior tests, and a focused database-backed importer test. Do not introduce a new end-to-end framework for this PRD.
- API functional tests should cover authentication for every Source and Material relationship endpoint.
- API functional tests should verify Admin and Operator access to active Source reads and mutations.
- API functional tests should verify that only Admins can include Retired Sources, open Retired Source detail, and restore a Source.
- API functional tests should verify the Source list contract, default Active-only behavior, Unlinked inclusion, filters, search, default ordering, attention states, and absence of pagination.
- API functional tests should verify stable sequential `S-` allocation independent of spreadsheet order, immutable IDs, nullable legacy provenance for app-created Sources, and stable IDs across reruns.
- API functional tests should verify required commercial-core validation, controlled Textile Family values, controlled Purchase Presentation and Purchase Unit, supported Vendor Currencies, numeric bounds, and Price Date requirements.
- API functional tests should verify that a missing global Currency Conversion Rate does not block USD Source creation or editing.
- API functional tests should verify `Cost needs attention`, non-blocking `Data needs attention`, and Preferred ineligibility when Landed Unit Cost is absent.
- API functional tests should verify Source creation, full editable-field updates, and immutability of Source ID and legacy provenance.
- API functional tests should verify optional Vendor Shades and that a Material relationship can reference only a shade owned by the linked Source.
- API functional tests should verify alternate and Unlinked Source retirement, preservation of historical links, exclusion from active alternate counts, and selection ineligibility.
- API functional tests should verify retirement is blocked for Preferred Sources and identifies all affected Active Materials.
- API functional tests should verify Admin-only restoration, preserved historical links, no automatic Preferred reinstatement, and cost-based Preferred eligibility.
- API functional tests should verify linking existing Sources, duplicate-link rejection, alternate unlinking, Preferred unlink protection, and atomic Preferred replacement.
- API functional tests should verify every successful Active Material mutation leaves exactly one eligible Preferred Source.
- API functional tests should verify Material cost derives from the Preferred Source's manual Landed Unit Cost and active alternate counts exclude Retired Sources.
- Web route tests should cover the sibling Materials/Sources navigation, default Source list, Admin-only Retired filter capability, allowed search/filter controls, URL synchronization, default ordering, horizontal overflow behavior, and loading/empty/error states.
- Web route tests should cover the read-only global `USD:MXN` and reciprocal display, Effective Date, and missing-configuration message.
- Web route tests should cover Source create/edit validation, preserved form values after errors, attention indicators, future-input non-calculation message, retirement warnings, blocked Preferred retirement, and Admin restoration.
- Web route tests should cover Source detail, read-only linked Materials, Material-to-Source navigation, and Source-to-Material navigation.
- Web route tests should cover the Material relationship Dialog, read-only Material identity, linking existing Sources, lack of Source creation, alternate unlink confirmation, Preferred unlink protection, atomic replacement interaction, and optional Vendor Shade selection.
- Importer functional tests should verify inclusion of every valid `Textil` Source row, including Unlinked Sources, and exclusion of Supply, Tool, and workshop rows.
- Importer functional tests should verify invalid Source and invalid Preferred Source exclusions, the complete structured report, and a non-successful overall outcome when exclusions exist.
- Importer functional tests should verify valid rows can persist alongside reported exclusions without partial writes within an individual invalid record.
- Importer functional tests should verify reruns do not duplicate records or reassign Source IDs.
- Importer functional tests should verify future imports cannot overwrite user-edited Source fields, links, Source Status, Landed Unit Cost, or Preferred Source choices.
- Existing Materials API/importer functional tests, Product CRUD/restore functional tests, Materials route tests, and Product route tests are the repository prior art for these seams.
- Focused checks for each implementation slice should be followed by workspace lint and strict typecheck before completion.

## Out of Scope

- A normalized Vendor entity or Vendor-management workflow — Vendor remains required free text on Source for now; creating a controlled Vendor record, migrating names, and managing Vendor details require a later PRD.
- Material Source and Supply Source specialization — this PRD keeps the canonical Source concept while limiting behavior to textile Materials; the `S-` prefix may be revisited if distinct concepts emerge from real Supply workflows.
- Supply, Tool, and workshop sourcing — these records are explicitly excluded from migration because their units, purchasing, and inventory behavior deserve separate modeling.
- Material create, update, retire, or restore workflows — the new Material Dialog exposes read-only Material identity and Source relationship actions only; full Material lifecycle remains a later PRD.
- Source creation from the Material Dialog — users select existing Sources there and create new records through the authoritative Sources catalog.
- Duplicate Source detection or warnings — similar offerings are allowed without automated matching in this PRD; a later workflow can design evidence-based duplicate review without blocking legitimate variations.
- A dedicated Source comparison workspace — filtering, sorting, detail, and Material relationship selection provide enough context for catalog maintenance; formal comparison waits until financial data is more authoritative.
- Automatic Landed Unit Cost calculation — shipping, GSM, width, IGI, IVA, and purchase inputs may be stored, but Landed Unit Cost remains user-specified until the calculation rules are designed and verified.
- Banxico SIE-API currency conversion — a future feature will establish Banco de México as the source of truth for USD/MXN and MXN/USD conversions; this PRD only reads a database-managed global setting.
- Editing Currency Conversion Rate in the UI — the rate and Effective Date are visible but configuration remains database-only in this phase.
- Vendor Currencies other than USD and MXN — additional currencies require an expanded conversion and display model.
- Price history and Source change audit — this PRD keeps current values only; historical costing and authorship need a later purchasing-oriented design.
- Automatic price expiration or stale-price warnings — a future feature may use a global age threshold and mark older prices `Price needs verification`; Price Date is display-only in this PRD.
- Vendor Shade availability or lifecycle — shades may be created, edited, and selected when known, but they do not have Active/Retired status in this PRD.
- Source or Material images — current workbook image links are incomplete and should not shape the first Source management workflow.
- Textile Family management UI — the controlled list is seeded exactly from the workbook; adding, renaming, translating, merging, or retiring values requires a separate administrative workflow.
- Import-management UI or persistent import history — the implementation migration produces a structured report for its operator, but users do not upload files, browse import runs, or retry imports in the app.
- Import conflict review or explicit overwrite controls — future imports are non-destructive here; interactive conflict resolution needs its own workflow.
- Search by Source ID, Vendor SKU, technical fields, or Material — first-slice search is intentionally limited to Source Name and Vendor.
- Pagination or infinite scrolling — the known dataset supports full-list loading; volume and measured performance should justify a later change.
- Summary statistics, dashboards, category charts, and bulk actions — the page goal is operational catalog maintenance, not analytics or mass mutation.
- Bills of Materials, Inventory, Inventory movement, purchasing orders, and receiving — these downstream workflows may consume Source and Material data later but are not part of catalog management.
- Material-to-Material interchangeability — alternatives remain Sources for the same Material; different Materials are not treated as interchangeable.
- User-managed IVA configuration — IVA remains the fixed 16 percent rule for the stored future-costing context in this PRD.

## Further Notes

- This spec follows the existing glossary terms `Material`, `Material Color`, `Material Unit`, `Source`, `Source ID`, `Vendor`, `Source Status`, `Unlinked Source`, `Vendor Shade`, `Purchase Presentation`, `Purchase Unit`, `Minimum Purchase Quantity`, `Vendor Currency`, `Currency Conversion Rate`, `Landed Unit Cost`, `Cost needs attention`, `Data needs attention`, `Textile Family`, and `Preferred Source`.
- The current persisted Source model is only a supporting shell. Implementing this spec requires expanding Source persistence, contracts, import behavior, and UI rather than merely exposing hidden fields.
- The spreadsheet is migration evidence, not the ongoing domain model. `Textil` is an import classification boundary, and the temporary Materials-sheet `En BOMs` value remains outside the domain language.
- The workbook's `Pieza 3m` values demonstrate why Purchase Presentation, fixed piece length, Minimum Purchase Quantity, Purchase Unit, and Purchase Price must remain distinct.
- The current Materials warning for a soft-deleted Preferred Source remains useful defensive behavior for legacy or corrupt data, but new mutations and clean migration must prevent that state.
- The global Currency Conversion Rate is intentionally informational while Landed Unit Cost is manual. Its presence must not imply that Purchase Price is converted or Landed Unit Cost is calculated.
- Images, comparison, duplicate detection, price history, stale-price rules, Vendor normalization, cost calculation, and Banxico integration are named follow-ups because each changes the feature's business purpose or authority boundary.
- The approved verification strategy uses the existing API functional, web route, and importer functional seams rather than introducing a broader end-to-end testing system.
