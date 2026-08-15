# Separate Materials and Supplies

Materials and Supplies will be treated as separate product concepts and separate UI areas because their units, purchasing processes, and inventory behavior differ: Materials are textiles measured primarily in meters or yards, while Supplies are non-textile production inputs such as boning, thread, zippers, buttons, cups, and trims. Supplies should appear as a separate tab or section later, but the current planning session and first feature slice will define Materials only.

The Materials table should be Material-first: one row represents one Material, and Source information may be summarized or referenced in columns on that Material row. Source records are not the row identity for the first Materials screen.

Each Active Material must have exactly one Preferred Source. The Preferred Source must be a linked Active Source with a recorded Landed Unit Cost; it provides the cost shown and used for that Material, while alternate Sources remain linked as backup or replacement options. Preferred Source changes must atomically promote the selected Source and demote the former Preferred Source. A Preferred Source cannot be retired until the user assigns an eligible replacement for every affected Active Material.

Material cost should be derived from the Preferred Source's Landed Unit Cost rather than copied onto the Material. Source records remain the financial source of truth. A Source preserves its original purchase price and Vendor Currency, while Landed Unit Cost is recorded in MXN per meter. The first Source-management workflow accepts Landed Unit Cost as a user-specified value and may store inputs such as estimated shipping per kilogram, GSM or dimensions, IGI, and IVA; application calculation of Landed Unit Cost is deferred until those rules are designed. Currency conversion uses one global USD-to-MXN rate, with its reciprocal used for MXN-to-USD, rather than Source-specific rates. This rate and its Effective Date are informational in the first workflow: if they are not configured, the Sources table shows a clear message but USD Source creation and editing remain available.

Optional future Landed Unit Cost inputs use explicit canonical units: GSM in grams per square meter, width in centimeters, estimated shipping in USD per kilogram, IGI as a Source-specific percentage rate, and fixed piece length in the Source's Purchase Unit. IVA is fixed at 16 percent rather than stored as a Source-specific rate. These inputs are editable but do not calculate or update Landed Unit Cost in this workflow.

The first Source-management workflow keeps only the current Purchase Price, Price Date, and Landed Unit Cost. Price history and change audit require a later purchasing-oriented design and are not inferred from ordinary Source edits.

The first Materials table should stay lean and should not show Source technical fields such as GSM, width, fiber, composition, finish, weave, or country of origin. Those details belong to a later Source table or Source detail surface.

The lean Materials table should include Material ID, Name, Color, Material Use, Unit, Preferred Source, cost derived from Preferred Source, alternate Source count, and Comments. Textile Family stays on Source records rather than on the Materials table. A long display name should be generated from Material fields when useful rather than stored separately if it only repeats name and color.

Material Use should be controlled reference data rather than free text, so filtering and reporting do not drift through casing or naming variants.

Textile Family should also be controlled reference data, owned by Source records, so Source filtering and comparison stay consistent.

Material Color belongs to Material identity, and each Material has a single controlled canonical color. A Source may offer multiple Vendor Shades when the financial and technical specifications are otherwise the same. Vendor Shades belong to the Source, while each Material–Source relationship selects the Vendor Shade that supplies that Material; the Vendor Shade does not replace the Material's canonical Material Color.

Material Unit should be normalized to Meter for Materials. Sources can preserve vendor purchase units such as yards, meters, rolls, or other purchase presentations, plus the conversion and normalized cost needed to compare them.

Source purchasing data distinguishes Purchase Presentation, Purchase Unit, Minimum Purchase Quantity, Purchase Price per unit, and any fixed piece length. These values must not be collapsed into one presentation string because they represent different commercial facts.

The first Materials feature should include only a quick reference to the Material's Source information. A full Sources table or Source detail view is deferred to a later feature.

Materials should be persisted API data, not a client-only mock or static spreadsheet import. Create, update, delete, table filtering, and table search can be follow-up issues after the first persisted list slice.

The first persisted Materials list should be populated by seeding or importing data from the current spreadsheet. This gives the API and UI real data without pulling user-facing create or edit workflows into the initial slice. Only Materials with valid linked Source data should be included in the initial import; rows with missing or unresolved Source references are data cleanup outside the initial slice.

When importing a Material with multiple linked Sources, the first listed Source should become the initial Preferred Source. This is an import convention only; later Source management can allow users to change the Preferred Source.

Imported Materials should preserve spreadsheet IDs as legacy import references, but the app should generate its own public Material IDs for routing, display, and future operations.

Sources use app-owned sequential public IDs following the `S-0001` convention, allocated independently of spreadsheet order. Legacy Source IDs remain optional immutable import provenance rather than app identity. The `S-` prefix may be revisited if Source later separates into Material Source and Supply Source concepts.

Vendor Currency is limited to USD and MXN in the first Source-management workflow. Supporting other currencies requires a later expansion of the currency-conversion model.

Material public IDs should use an `M-` prefix for now, matching the existing Product `P-` style. This prefix is a working convention and may be revisited before implementation if the broader identifier scheme changes.

The first Materials API should return a table-shaped Material summary DTO rather than full nested Source records. The summary should include only the fields needed by the lean Materials table: Material ID, name, color, Material Use, unit, Preferred Source reference, derived cost, alternate Source count, and comments.

All authenticated users should be able to read the Materials list. Future create, update, delete, import, and reference-data management workflows can use stricter permissions if needed.

Materials should support soft deletion in the data model from the start because they will later be referenced by Bills of Materials and Inventory. Delete, restore, and deleted-record UI or endpoints remain out of scope for the first Materials list slice.

Sources should also support soft deletion in the data model from the start because vendor offerings can become unavailable, discontinued, or replaced while historical purchasing context and Material links remain useful. Source delete, restore, and management UI remain deferred to the later Sources feature.

Retiring a non-Preferred Source preserves its Material links as historical relationships but makes the Source ineligible for Preferred Source selection and excludes it from active alternate Source counts. An Unlinked Source may be retired directly because no Material relationship is affected.

Restoring a Retired Source returns it to Active status and preserves its historical Material links, but never restores Preferred Source status automatically. A restored Source becomes eligible for later Preferred Source selection only when it has a recorded Landed Unit Cost.

Once users manage Sources in the application, spreadsheet imports must not overwrite user-edited Source fields, Material links, Source Status, Landed Unit Cost, or Preferred Source choices. Imports may add new records and populate imported data without erasing application-owned decisions; conflict review and explicit overwrite controls require a separate import-management workflow.

The first Source catalog migration should import every spreadsheet row categorized as `Textil`, including Sources not linked to a Material, while excluding Supply, Tool, and workshop rows. A Source row that does not satisfy the required commercial core is excluded with an explicit migration error so it can be corrected in the original workbook; newly created Sources must satisfy the same requirements before they can be saved. A Material with zero or multiple Preferred Sources is also excluded with an explicit migration error rather than allowing an invalid state or guessing which Source should be Preferred.

Migration exclusions must be returned in one structured report to the person running the import, with the legacy ID, record type, invalid or missing fields, and corrective guidance for each excluded row. Valid rows may still persist, but any exclusion makes the overall import outcome non-successful so partial migration cannot be reported as clean completion; persistent import-history UI remains outside this workflow.

The first Materials list should show active Materials only. Deleted Materials should remain hidden until future delete and restore workflows define how users review them.

If a Material's Preferred Source is later soft-deleted, the Material should remain visible. The row should eventually warn that its Preferred Source needs attention rather than hiding the Material.

Future Source deletion should warn the user before confirmation when the Source is linked to one or more Materials, especially if it is a Preferred Source. This behavior is deferred with Source management.

Every Material in the first imported and listed dataset should have a Preferred Source. Whether future create or edit workflows may allow draft Materials without Sources is intentionally deferred.

Images are out of scope for the first Materials feature and should not be assumed available. Spreadsheet Source image links should not drive the first Materials UI.

The first Materials table should include comments when present, but comments should stay compact through truncation or an indicator so the dense table layout does not expand row height substantially.

The first Materials table should be lean enough to fit at normal desktop widths, with horizontal scrolling only as a fallback for narrower screens or windows rather than as the primary table design.

Summary stats, dashboards, and category charts are out of scope for the first Materials screen and can be considered later.

Pagination is out of scope for the first Materials API and table. The initial list can load all active Materials because the imported dataset is small enough for a full-list workflow; pagination can be added later if real data volume requires it.
