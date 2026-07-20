# Separate Materials and Supplies

Materials and Supplies will be treated as separate product concepts and separate UI areas because their units, purchasing processes, and inventory behavior differ: Materials are textiles measured primarily in meters or yards, while Supplies are non-textile production inputs such as boning, thread, zippers, buttons, cups, and trims. Supplies should appear as a separate tab or section later, but the current planning session and first feature slice will define Materials only.

The Materials table should be Material-first: one row represents one Material, and Source information may be summarized or referenced in columns on that Material row. Source records are not the row identity for the first Materials screen.

Each Material should have a Preferred Source. The Preferred Source is the default purchasing option and provides the cost shown and used for that Material, while alternate Sources remain linked as backup or replacement options.

Material cost should be derived from the Preferred Source's normalized cost rather than copied onto the Material. Source records remain the financial source of truth.

The first Materials table should stay lean and should not show Source technical fields such as GSM, width, fiber, composition, finish, weave, or country of origin. Those details belong to a later Source table or Source detail surface.

The lean Materials table should include Material ID, Name, Color, Material Use, Unit, Preferred Source, cost derived from Preferred Source, alternate Source count, and Comments. Textile Family stays on Source records rather than on the Materials table. A long display name should be generated from Material fields when useful rather than stored separately if it only repeats name and color.

Material Use should be controlled reference data rather than free text, so filtering and reporting do not drift through casing or naming variants.

Textile Family should also be controlled reference data, owned by Source records, so Source filtering and comparison stay consistent.

Material Color belongs to Material identity, and each Material has a single controlled canonical color. A Source may provide multiple Material Colors when the financial and technical specifications are otherwise the same. Vendor shade names or color codes can be captured later on Source detail without replacing Material Color.

Material Unit should be normalized to Meter for Materials. Sources can preserve vendor purchase units such as yards, meters, rolls, or other purchase presentations, plus the conversion and normalized cost needed to compare them.

The first Materials feature should include only a quick reference to the Material's Source information. A full Sources table or Source detail view is deferred to a later feature.

Materials should be persisted API data, not a client-only mock or static spreadsheet import. Create, update, delete, table filtering, and table search can be follow-up issues after the first persisted list slice.

The first persisted Materials list should be populated by seeding or importing data from the current spreadsheet. This gives the API and UI real data without pulling user-facing create or edit workflows into the initial slice. Only Materials with valid linked Source data should be included in the initial import; rows with missing or unresolved Source references are data cleanup outside the initial slice.

When importing a Material with multiple linked Sources, the first listed Source should become the initial Preferred Source. This is an import convention only; later Source management can allow users to change the Preferred Source.

Imported Materials should preserve spreadsheet IDs as legacy import references, but the app should generate its own public Material IDs for routing, display, and future operations.

Material public IDs should use an `M-` prefix for now, matching the existing Product `P-` style. This prefix is a working convention and may be revisited before implementation if the broader identifier scheme changes.

The first Materials API should return a table-shaped Material summary DTO rather than full nested Source records. The summary should include only the fields needed by the lean Materials table: Material ID, name, color, Material Use, unit, Preferred Source reference, derived cost, alternate Source count, and comments.

All authenticated users should be able to read the Materials list. Future create, update, delete, import, and reference-data management workflows can use stricter permissions if needed.

Materials should support soft deletion in the data model from the start because they will later be referenced by Bills of Materials and Inventory. Delete, restore, and deleted-record UI or endpoints remain out of scope for the first Materials list slice.

Sources should also support soft deletion in the data model from the start because vendor offerings can become unavailable, discontinued, or replaced while historical purchasing context and Material links remain useful. Source delete, restore, and management UI remain deferred to the later Sources feature.

The first Materials list should show active Materials only. Deleted Materials should remain hidden until future delete and restore workflows define how users review them.

If a Material's Preferred Source is later soft-deleted, the Material should remain visible. The row should eventually warn that its Preferred Source needs attention rather than hiding the Material.

Future Source deletion should warn the user before confirmation when the Source is linked to one or more Materials, especially if it is a Preferred Source. This behavior is deferred with Source management.

Every Material in the first imported and listed dataset should have a Preferred Source. Whether future create or edit workflows may allow draft Materials without Sources is intentionally deferred.

Images are out of scope for the first Materials feature and should not be assumed available. Spreadsheet Source image links should not drive the first Materials UI.

The first Materials table should include comments when present, but comments should stay compact through truncation or an indicator so the dense table layout does not expand row height substantially.

The first Materials table should be lean enough to fit at normal desktop widths, with horizontal scrolling only as a fallback for narrower screens or windows rather than as the primary table design.

Summary stats, dashboards, and category charts are out of scope for the first Materials screen and can be considered later.

Pagination is out of scope for the first Materials API and table. The initial list can load all active Materials because the imported dataset is small enough for a full-list workflow; pagination can be added later if real data volume requires it.
