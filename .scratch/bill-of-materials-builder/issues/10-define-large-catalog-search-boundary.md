# Define the large-catalog search boundary for the BOM Builder

Type: grilling
Status: open
Blocked by: 05, 06, 08

## Question

How should the BOM Builder search and select Materials and Pattern Sets when their catalogs are too large to assume that every option is already loaded in the browser, while preserving the validated catalog-dialog experience, current references, lifecycle rules, and useful result context?

## Established context

- The resolved Builder prototype uses searchable on-demand catalog dialogs for Material and Pattern Set selection rather than long inline selects.
- A Material result presents Material name as its primary label, a subdued Material ID beside it, and separately identified width, Source name, Vendor, and Vendor Shade or other Source detail. Search currently matches all of those values in the prototype.
- A Pattern Set result presents its name, identifier, and quantity-proposal count. Search currently matches name and identifier.
- Selecting a Material stores only the Material reference, clears Material Quantity, and resets BOM Line Verification according to the existing BOM Line rules. The result metadata does not add Source or cost ownership to the BOM.
- Selecting or removing a Pattern Set changes only its optional reference and does not change Material Quantity or verification.
- Active catalog records are available for new selection. Existing Retired or otherwise unavailable references remain visible and removable on retained BOM Lines but are not ordinary new selections.
- The prototype uses small in-memory fixtures only. It does not decide the production query, API, caching, pagination, virtualization, stale-reference, or failure behavior.

## Decisions to resolve

### Query ownership and trigger

- Whether each catalog is searched remotely, loaded locally, or uses a measured hybrid strategy.
- When a query begins, including empty-query behavior, minimum input length, debounce, cancellation, and replacement of older responses.
- Whether Material and Pattern Set require different query policies because their expected scale or searchable attributes differ.

### Matching and relevance

- Which fields are searchable for each catalog and which are display-only context.
- Case, accent, whitespace, identifier, exact-match, prefix-match, and partial-match behavior.
- Relevance ordering, deterministic tie-breaking, maximum returned results, and whether recent or frequently selected records influence ranking.
- Whether additional filters are needed without turning the Builder into a second catalog-management screen.

### Result contract

- The minimum Material result projection needed to render Material name, Material ID, width, Source name, Vendor, Vendor Shade or Source detail, availability, attention, and any cost context chosen for the Builder.
- The minimum Pattern Set result projection needed to render identity, name, lifecycle availability, proposal count, and enough context to distinguish similarly named records.
- Whether proposal contents load with search results or only after a Pattern Set is selected or its proposal dialog is opened.
- How the response distinguishes selectable results from retained unavailable references without treating Source metadata as BOM-owned evidence.

### Loading and scale

- Pagination, cursor or offset semantics, incremental loading, and whether result virtualization is required for the first delivery.
- Loading indicators for the initial query and subsequent pages without replacing a usable current selection.
- Cache scope, freshness, invalidation, and reuse between BOM Lines and between Builder sessions.
- A practical performance target and the catalog-size assumptions that justify the selected approach.

### Current, retired, and stale references

- How the Builder resolves and displays an already selected Material or Pattern Set that is absent from ordinary Active search results.
- What happens when a record becomes Retired, unavailable, changed, or deleted while the Builder is open.
- How replacing or clearing a retained unavailable reference differs from attempting a new selection.
- Which conditions require refreshing result metadata and which are validated canonically during atomic BOM save.

### Empty, failure, and recovery behavior

- Distinct UI behavior for no query yet, no matches, initial loading, incremental loading, recoverable failure, authorization failure, and catalog unavailability.
- Retry behavior and whether a previously selected value remains usable when search temporarily fails.
- What the Builder may save when catalog lookup is unavailable versus when the API proves that a newly chosen reference is invalid.

### Interaction and accessibility

- Keyboard navigation, focus return, selection announcement, dialog closure, and screen-reader result context.
- Responsive behavior for narrow screens and whether large-result browsing needs a different presentation without reopening the validated field and dialog placement.

## Expected resolution

- A distinct production search contract for Material and Pattern Set with explicit request, response, ordering, pagination, and lifecycle semantics.
- A complete state table for idle, loading, results, empty, additional loading, failure, retained unavailable selection, and stale selection.
- Clear ownership between the BOM Builder and the Material, Source, and Pattern Set catalogs.
- Decisions specific enough for the later BOM specification and implementation tickets to define focused API and web slices without copying assumptions from the prototype.

## Out of scope

- Reopening the validated Construction Board layout or catalog-dialog placement.
- Implementing the production endpoints, indexes, caches, or UI in this decision ticket.
- Creating or editing Materials, Sources, Vendor Shades, or Pattern Sets inline from the BOM Builder.
- Persisting Source, Vendor Shade, width, proposal, ranking, query, or cost snapshots on a BOM Line.
- Automatic meter calculation, proposal history, construction groups, Inventory, purchasing, or production execution.
