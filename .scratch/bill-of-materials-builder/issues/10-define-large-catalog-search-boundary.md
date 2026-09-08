# Define the large-catalog search boundary for BOM workflows

Type: grilling
Status: open
Blocked by: 02, 05, 06, 08, 09

## Question

How should the BOM workflows search and select Materials, Pattern Sets, and Product Variants when their catalogs are too large to assume that every option is already loaded in the browser, while preserving the validated catalog-dialog experiences, eligibility rules, current references, lifecycle rules, and useful result context?

## Established context

- The resolved Builder prototype uses searchable on-demand catalog dialogs for Material and Pattern Set selection rather than long inline selects.
- The resolved catalog prototype requires a searchable Product Variant dialog before a User may create an Implementation manually or derive one from a Template. The chosen Variant becomes fixed context in the Builder.
- A Material result presents Material name as its primary label, a subdued Material ID beside it, and separately identified width, Source name, Vendor, and Vendor Shade or other Source detail. Search currently matches all of those values in the prototype.
- A Pattern Set result presents its name, identifier, and quantity-proposal count. Search currently matches name and identifier.
- A Product Variant result presents its commercial Variant name as the primary label and its Product as distinguishing context. Search currently matches both values in the prototype.
- Selecting a Material stores only the Material reference, clears Material Quantity, and resets BOM Line Verification according to the existing BOM Line rules. The result metadata does not add Source or cost ownership to the BOM.
- Selecting or removing a Pattern Set changes only its optional reference and does not change Material Quantity or verification.
- A Product Variant is eligible for a new Implementation only while its Product and the Variant are available and it has no non-deleted Implementation. Template derivation further restricts candidates to Variants of the Template's associated Product.
- Active catalog records are available for new selection. Existing Retired or otherwise unavailable references remain visible and removable on retained BOM Lines but are not ordinary new selections.
- The prototype uses small in-memory fixtures only. It does not decide the production query, API, caching, pagination, virtualization, stale-reference, or failure behavior.

## Decisions to resolve

### Query ownership and trigger

- Whether each catalog is searched remotely, loaded locally, or uses a measured hybrid strategy.
- When a query begins, including empty-query behavior, minimum input length, debounce, cancellation, and replacement of older responses.
- Whether Material, Pattern Set, and Product Variant require different query policies because their expected scale, searchable attributes, eligibility rules, or entry points differ.
- Whether the Product Variant dialog queries globally and applies a Product constraint or uses a distinct Product-scoped request when deriving from a Template or entering from a Product context.

### Matching and relevance

- Which fields are searchable for each catalog and which are display-only context.
- Case, accent, whitespace, identifier, exact-match, prefix-match, and partial-match behavior.
- Relevance ordering, deterministic tie-breaking, maximum returned results, and whether recent or frequently selected records influence ranking.
- Whether additional filters are needed without turning the Builder into a second catalog-management screen.
- How Product Variant eligibility affects ranking and visibility, including whether ineligible matches are omitted or displayed with a non-selectable reason.

### Result contract

- The minimum Material result projection needed to render Material name, Material ID, width, Source name, Vendor, Vendor Shade or Source detail, availability, attention, and any cost context chosen for the Builder.
- The minimum Pattern Set result projection needed to render identity, name, lifecycle availability, proposal count, and enough context to distinguish similarly named records.
- The minimum Product Variant result projection needed to render Variant identity and commercial name, Product identity and name, Product and Variant availability, existing-Implementation occupancy, and a canonical eligibility outcome or reason.
- Whether proposal contents load with search results or only after a Pattern Set is selected or its proposal dialog is opened.
- How the response distinguishes selectable results from retained unavailable references without treating Source metadata as BOM-owned evidence.
- Whether Product Variant eligibility is projected by the Product catalog or composed by the BOM application without duplicating the one-Implementation-per-Variant invariant.

### Loading and scale

- Pagination, cursor or offset semantics, incremental loading, and whether result virtualization is required for the first delivery.
- Loading indicators for the initial query and subsequent pages without replacing a usable current selection.
- Cache scope, freshness, invalidation, and reuse between BOM Lines, catalog entry dialogs, and Builder sessions.
- A practical performance target and the catalog-size assumptions that justify the selected approach.

### Current, retired, and stale references

- How the Builder resolves and displays an already selected Material or Pattern Set that is absent from ordinary Active search results.
- What happens when a record becomes Retired, unavailable, changed, or deleted while the Builder is open.
- How replacing or clearing a retained unavailable reference differs from attempting a new selection.
- Which conditions require refreshing result metadata and which are validated canonically during atomic BOM save.
- What happens when a selected Product Variant becomes inactive, its Product becomes unavailable, or another Implementation occupies it after selection but before the first save.
- How the catalog and Builder preserve the fixed Product Variant context of an already saved Implementation even when that Variant later becomes unavailable.

### Empty, failure, and recovery behavior

- Distinct UI behavior for no query yet, no matches, initial loading, incremental loading, recoverable failure, authorization failure, and catalog unavailability.
- Retry behavior and whether a previously selected value remains usable when search temporarily fails.
- What the Builder may save when catalog lookup is unavailable versus when the API proves that a newly chosen reference is invalid.
- Whether a Product Variant selection may remain visible after a lookup failure while still requiring canonical eligibility validation before creating the Implementation.

### Interaction and accessibility

- Keyboard navigation, focus return, selection announcement, dialog closure, and screen-reader result context.
- Responsive behavior for narrow screens and whether large-result browsing needs a different presentation without reopening the validated field and dialog placement.

## Expected resolution

- Distinct production search contracts for Material, Pattern Set, and Product Variant with explicit request, response, ordering, pagination, lifecycle, and eligibility semantics.
- A complete state table for idle, loading, results, empty, additional loading, failure, retained unavailable selection, and stale selection.
- Clear ownership between the BOM workflows and the Product, Product Variant, Material, Source, and Pattern Set catalogs.
- Decisions specific enough for the later BOM specification and implementation tickets to define focused API and web slices without copying assumptions from the prototype.

## Out of scope

- Reopening the validated Construction Board layout or catalog-dialog placement.
- Implementing the production endpoints, indexes, caches, or UI in this decision ticket.
- Creating or editing Products, Product Variants, Materials, Sources, Vendor Shades, or Pattern Sets inline from a BOM selection dialog.
- Persisting Source, Vendor Shade, width, proposal, ranking, query, or cost snapshots on a BOM Line.
- Automatic meter calculation, proposal history, construction groups, Inventory, purchasing, or production execution.
