# Decide Material, Source, and cost behavior in Bills of Materials

Type: grilling
Status: resolved
Blocked by: 03

## Question

Should a BOM Line reference only Material while Source and cost remain current projections, or must a BOM Implementation preserve any Source, Vendor Shade, cost, or effective-date evidence; and how should unavailable Materials or Preferred Sources affect use of a Bill of Materials?

## Answer

- A BOM Line references only its selected Material and does not persist a Source, Vendor Shade, Source width, unit cost, calculated cost, currency, Price Date, effective date, or other sourcing evidence. BOM Templates and BOM Implementations use this same model.
- Material remains the primary subject presented by the Builder. The current Preferred Source's name and Vendor, applicable Vendor Shade, width in centimeters, and Landed Unit Cost may appear as compact or expandable read-only context without introducing Source selection into the BOM.
- Source, Vendor Shade, width, and cost are live projections from the Material's current sourcing information rather than historical facts owned by the Bill of Materials. Reopening or refreshing a BOM shows their current values.
- A BOM Line exposes a derived Projected material cost calculated as Material Quantity multiplied by the available Landed Unit Cost. The result is visible to callers and the Builder but is not persisted as line data.
- Projected material cost uses only Landed Unit Cost in MXN per meter. It never falls back to Purchase Price, Vendor Currency, Currency Conversion Rate, or another costing input.
- Each line projection is rounded to the nearest MXN cent. The Bill of Materials projection sums the already rounded line projections so the aggregate agrees with the visible lines.
- A recorded Landed Unit Cost of MXN $0.00 is a calculable explicit value. An absent Landed Unit Cost, rather than zero, means cost is unavailable.
- Every independently identified BOM Line contributes separately, including repeated occurrences of the same Material. The projection represents material consumption cost only and excludes Supplies, labor, inventory availability, waste not expressed by Material Quantity, purchasing, and other production costs.
- A line may contribute to the projection whenever it has a Material Quantity and a usable Landed Unit Cost, even when its Construction Piece is missing, it is Incomplete, or it is Unverified. Cost projection, BOM Line Completeness, and BOM Line Verification remain independent.
- The Bill of Materials exposes a derived BOM Cost Projection and BOM Cost Projection Availability. Availability is `Complete` when every line is calculable, `Partial` when at least one line is calculable and at least one is excluded, and `Unavailable` when no line is calculable, including when the Bill of Materials has no lines.
- A Partial projection shows the sum of its calculable lines and the number of excluded lines. An Unavailable projection is not displayed as MXN $0.00, and an excluded line is never treated as having zero cost.
- Each excluded line exposes derived reasons for its exclusion, including missing Material, missing Material Quantity, or no usable Landed Unit Cost. The reasons and aggregate availability are not persisted as Bill of Materials state.
- Both BOM Templates and BOM Implementations expose projections. A Template projects the current cost of its configured suggestions, while an Implementation projects the current cost of its concrete construction decisions; neither is a quotation or historical cost record.
- During Builder editing, changing Material Quantity recalculates the preview immediately from already loaded sourcing information. Replacing or removing Material follows the existing rule that clears Material Quantity and therefore removes the former projection.
- The API recalculates and returns the canonical projection when a BOM is loaded or saved. Its response replaces any local preview; the first delivery does not require subscriptions or continuous synchronization when sourcing information changes elsewhere while the Builder remains open.
- The calculation and availability rules should remain behind one small module interface so every caller receives consistent results. The first delivery derives them on demand; a future filter, notification workflow, or measured scale problem may introduce an indexed materialized projection as a rebuildable optimization, never as the source of truth.
- Changing Preferred Source, Vendor Shade, Source width, or Landed Unit Cost does not modify stored BOM data or reset BOM Line Verification. A derived projection may change without creating a BOM conflict or history entry.
- Deriving a Bill of Materials copies Material and Material Quantity into independently identified destination lines but copies no Source or cost evidence. Destination lines project from the sourcing information available when they are consulted.
- A Material unavailable for new catalog selection remains referenced by existing lines, may be replaced or removed, and is copied during BOM Derivation. It may also retain an editable Material Quantity, be Complete or Verified, and continue contributing to cost when its retained Preferred Source relationship supplies a usable Landed Unit Cost.
- An unavailable Material derives the non-blocking line-level `Material needs attention` condition. The condition clears automatically when the Material is restored, removed, or replaced and does not itself prevent saving, verification, derivation, or use of the Bill of Materials.
- A line derives the non-blocking `Source needs attention` condition when its selected Material has no usable current or retained Preferred Source relationship, that Source is Retired or deleted, or Landed Unit Cost is absent. Its cost is excluded until sourcing is corrected in Materials or Sources.
- Changes to alternate Sources never affect the BOM projection or create BOM attention. The BOM uses only the current or retained Preferred Source relationship.
- `Material needs attention`, `Source needs attention`, and `Pattern needs attention` may coexist on one line. The Builder may show at BOM level that one or more lines need attention, but this is a derived UI summary rather than a stored aggregate BOM status; the specific conditions remain visible on their lines.
- Source and Material corrections occur in their owning catalog workflows, while the Builder may provide navigation to that context and may replace the line's Material. The Builder does not restore Materials, change Preferred Sources, or edit Source cost data inline.
- Pattern Set proposals remain independent of Source width. A mismatch or later width change neither validates nor changes Material Quantity, verification, or attention; current width is only context for human review.
- All users authorized to read a Bill of Materials may see its cost projection in the first delivery. No separate financial permission is introduced.
- The current Source mutation gap that can remove Landed Unit Cost from a Preferred Source contradicts the established Preferred Source invariant. The BOM handles that condition defensively through `Source needs attention`, while enforcement must be corrected in the Sources workflow rather than duplicated in the BOM model.
- Material lifecycle design, Inventory, dresses in production, price and cost history, audit reconstruction, automatic Landed Unit Cost calculation, and automatic meter calculation remain outside this decision.
