# Define the large-catalog search boundary for BOM workflows

Type: grilling
Status: resolved
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

## Answer

### Ownership and request contracts

- Material, Pattern Set, and Product Variant selection use separate remote-search contracts and never require the browser to load an entire catalog. Materials owns Material identity and search, Pattern Sets owns its catalog and proposals, Products/Product Variants owns Variant identity and availability, and BOM owns Implementation occupancy and final eligibility composition.
- The dialogs remain idle until the User enters non-empty text. Input is normalized and debounced for approximately 250 milliseconds without a minimum character count. A newer query cancels the previous request where possible, late responses for superseded text are ignored, and clearing the input returns to idle.
- Material and Pattern Set requests contain only normalized search text. Product Variant requests also carry explicit workflow context: manual creation is global, Product-context creation carries Product ID, and derivation carries Template ID so the server derives and enforces the associated Product.
- The server fixes the limit at 25; clients cannot request a larger limit. Responses use catalog-specific `items` plus `hasMore`, evaluated by reading at most 26 ordered matches and returning the first 25. There is no pagination, total count, incremental loading, or virtualization in the first delivery.
- BOM Builder access grants read access to these minimum selection projections. Catalog management permissions still govern creation, editing, retirement, deletion, and restoration.

### Matching and ordering

- Matching is case-insensitive and accent-insensitive, trims surrounding whitespace, and collapses consecutive internal whitespace without changing stored or displayed values.
- Multi-word queries use order-independent AND semantics across searchable fields: every word must match at least one field.
- Material matches Material ID, name, color, Material Use, and visible Preferred Source context: Source name, Vendor, Vendor Shade or other detail, and width. Material identity matches outrank Source-context-only matches.
- Pattern Set matches only Pattern Set ID and name. Proposal count is display-only context.
- Product Variant matches Variant ID and commercial name plus Product ID and name. Availability, occupancy, and ineligibility reasons are display-only context.
- Results rank by exact ID, exact primary name, ID prefix, primary-name prefix, word match, and partial secondary-context match. Primary name and then stable ID break ties. Product Variant relevance remains primary, with eligible candidates winning only otherwise equivalent ties. Ranking is not personalized by recency or frequency.

### Result projections and eligibility

| Catalog | Minimum search item |
| --- | --- |
| Material | Material ID, name, color, Material Use, Preferred Source ID and name, Vendor, Vendor Shade or detail, width, and attention signals. Search omits cost; BOM Cost Projection appears after selection. |
| Pattern Set | Pattern Set ID, name, and proposal count. Search omits description and proposal contents. |
| Product Variant candidate | Variant ID and name, Product ID and name, relevant availability, `selectable`, one canonical outcome, and existing BOM Implementation ID when occupied. |

- The BOM UI makes one Product Variant candidate request. The server composes Product-owned availability with BOM-owned occupancy and returns `eligible`, `implementation-exists`, `product-unavailable`, or `variant-inactive`. When multiple reasons apply, precedence is `implementation-exists`, then `product-unavailable`, then `variant-inactive`.
- Ineligible in-scope Variant matches remain visible and non-selectable with their reason. Derivation excludes Variants outside the Template's Product entirely. Soft-deleted Materials, Products, and Product Variants and Retired Pattern Sets are absent from ordinary new-selection results.
- An Active Material remains selectable when sourcing needs attention; its line follows existing partial or unavailable cost-projection rules.
- Pattern Set search returns only proposal count. Proposal contents load when the selected Pattern Set or its proposals dialog needs them.

### Cache, freshness, and canonical validation

- Identical searches reuse the existing session-local in-memory query cache for 30 seconds; cache is not persisted across reloads. Material/Source, Pattern Set, and BOM Implementation mutations in the same client invalidate only their affected search families. There is no polling or real-time cross-user synchronization.
- Persisted Material and Pattern Set references resolve by stable ID when the Builder loads and again when their cached resolution is stale on selector open. Retained unavailable references stay visible and removable; if details cannot load, the Builder shows the stable ID with `Details unavailable` and still permits saving the unchanged reference.
- A newly chosen Material deleted before save or Pattern Set retired before save is rejected by atomic save with a field-level reason while preserving the draft. Unchanged retained references remain saveable.
- Product Variant search provides the first eligibility validation; there is no extra preflight when opening the Builder. Atomic Implementation creation validates again. If another User occupies the Variant first, save preserves the draft and reports the conflict without reassignment or special recovery actions.
- An existing Implementation remains editable when its fixed Product Variant becomes Inactive or soft-deleted or its Product becomes unavailable. The Builder resolves the fixed context by ID and labels its unavailability without breaking or reassigning the relationship.
- Preferred Source name, Vendor, Vendor Shade, width, Landed Unit Cost, and BOM Cost Projection remain live projections. Their changes do not block save, and a successful save refreshes current context and projected cost.

### UI state table

| State | Dialog behavior | Current selection and saving |
| --- | --- | --- |
| Idle | Prompts the User to type; no request or results. | Existing selection remains visible outside the dialog. |
| Debouncing | Waits approximately 250 ms after the latest input. | Existing selection is unchanged. |
| Loading | Removes prior-query results and shows one simple loader. | Existing selection is unchanged. |
| Results | Shows up to 25 deterministically ordered matches. | Selecting an eligible item closes the dialog. |
| More matches | Shows the first 25 and asks the User to refine the search when `hasMore` is true. | No Load more action exists. |
| Empty | Shows `No matches for "{query}"` and suggests checking name or ID. | No inline catalog creation or editing is offered. |
| Recoverable failure | Keeps the dialog open with a concise error and `Try again`. | Does not clear the current selection. |
| Authentication failure | Delegates to the global session flow. | Does not silently clear the selection. |
| Authorization failure | Shows a non-retryable dialog message. | Does not silently clear the selection. |
| Retained unavailable | Shows the resolved record as unavailable and outside ordinary new selection. | May be kept, removed, or replaced; keeping it does not block save. |
| Retained details unavailable | Shows stable ID and `Details unavailable`. | May be kept or removed; replacement requires validated search. |
| Newly selected reference becomes unavailable | Atomic save preserves the draft and reports a field-level error. | Must be removed or replaced before save can succeed. |
| Product Variant becomes occupied | Atomic creation preserves the draft and reports the conflict. | No automatic reassignment or special recovery action. |
| Pattern proposals fail | Keeps the Pattern Set and shows `Try again` in the proposals dialog. | Final meters remains manually editable and saving is allowed. |

### Interaction, accessibility, and performance

- Successful selection closes the dialog, returns focus to its trigger, and announces the selected item. Activating an ineligible Variant keeps the dialog open and announces its reason.
- Results remain native interactive controls supporting Tab, Enter or Space, and the dialog's Escape behavior. The first delivery adds no Arrow Up/Down, Home/End, active-descendant, or other advanced listbox navigation.
- A discreet live region announces loading, result count, no matches, and failures. Narrow screens use the same flow in a near-full-screen dialog with vertically stacked result context.
- Catalog search targets server-response p95 at or below 500 milliseconds against at least 10,000 active records per catalog, measured separately from the 250-millisecond debounce.

## Out of scope

- Reopening the validated Construction Board layout or catalog-dialog placement.
- Implementing the production endpoints, indexes, caches, or UI in this decision ticket.
- Creating or editing Products, Product Variants, Materials, Sources, Vendor Shades, or Pattern Sets inline from a BOM selection dialog.
- Persisting Source, Vendor Shade, width, proposal, ranking, query, or cost snapshots on a BOM Line.
- Automatic meter calculation, proposal history, construction groups, Inventory, purchasing, or production execution.
