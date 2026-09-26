# Standardize Table Filters Across Operational Catalogs

Status: ready-for-agent

## Problem Statement

Guardiola Foundry's operational tables expose filters through several unrelated interaction patterns. Products uses a row of selects and a deleted-record toggle, Sources uses a different group of selects, Bills of Materials mixes kind buttons with a lifecycle toggle, and the smaller Pattern Sets and Product Variants tables use standalone lifecycle controls. Search, filter persistence, clearing behavior, permissions, historical-record visibility, and empty or error recovery therefore change from table to table.

This inconsistency makes routine catalog work slower and leaves no durable pattern for future filtered tables. The team has approved a Products prototype based on the visual language of ReUI Filters, but the approved behavior still needs to replace prototype state with production contracts and be applied consistently across the existing filtered tables.

## Solution

Introduce one controlled table-filter presentation shared by Products, Sources, Bills of Materials, Pattern Sets, and Product Variants. Keep text search visible, place optional criteria in a compact Filter popover, represent applied criteria as editable chips, and provide predictable clearing, URL, permission, historical-record, responsive, and accessibility behavior.

The approved Products Variant A prototype is the mandatory UI implementation reference. Production implementation must begin by reviewing it and must preserve its approved toolbar proportions, chip treatment, popover composition, header close control, criterion-list hierarchy, two-level selection flow, and immediate-apply interaction. The implementation may extract and adapt that work into the shared production component; it must not independently redesign the filter experience. Prototype-only framing, labels, state readouts, fixtures, route gates, and comparison machinery are removed after the production UI replaces them.

The standard shares presentation and interaction only. Each feature continues to own its filter definitions, domain semantics, authorization decisions, validated URL mapping, server queries, and local projections. No general-purpose query builder or new UI library is introduced.

## User Stories

1. As a `User`, I want filtered tables to use the same interaction pattern, so that I do not have to relearn filtering in each catalog.
2. As a `User`, I want search to remain immediately visible on tables that support it, so that the most common retrieval action stays fast.
3. As a `User`, I want optional criteria grouped behind one `Filter` button, so that table toolbars remain compact and predictable.
4. As a `User`, I want the Filter button to avoid a redundant count, so that applied chips remain the single visible summary of filter state.
5. As a `User`, I want applied filters represented as readable chips, so that I can understand the current result set at a glance.
6. As a `User`, I want ordinary chips labeled `Field: Value`, so that each value has clear context.
7. As a `User`, I want additive lifecycle chips labeled `Include deleted` or `Include retired`, so that their inclusive behavior is unambiguous.
8. As a `User`, I want chips ordered consistently according to each table's criterion order, so that they do not jump around while I edit filters.
9. As a `User`, I want to click a chip to edit its value, so that I can refine a filter without removing and recreating it.
10. As a `User`, I want to remove one criterion with the chip's close control, so that unrelated search and filters remain intact.
11. As a `User`, I want the Filter popover to list all criteria I am allowed to use, so that available choices are discoverable.
12. As a `User`, I want active criteria to remain in the popover with their current values, so that I can edit them from either the list or their chips.
13. As a `User`, I want ordinary criteria to open a focused value list, so that choosing one value remains simple.
14. As a `User`, I want selecting a value to apply immediately and return me to the criterion list, so that I can add multiple filters efficiently.
15. As a `User`, I want the popover to remain open after applying a value, so that configuring more than one criterion does not require repeated reopening.
16. As a `User`, I want large loaded option sets such as Collections to be searchable within their value list, so that I can find an option without scanning the full list.
17. As a `User`, I want small enumerations to show their values directly, so that simple filters do not gain unnecessary controls.
18. As a `User`, I want additive boolean criteria to activate directly from the criterion list, so that `Include deleted` and `Include retired` do not require an unnecessary second screen.
19. As a `User`, I want to remove an optional criterion through its chip or `Clear all`, so that the value list does not need an additional `Any` option.
20. As a keyboard user, I want Escape to close the popover without changing applied filters, so that the control follows familiar dialog behavior.
21. As a pointer user, I want clicking outside the popover to close it without changing applied filters, so that dismissal is conventional.
22. As a `User`, I want an explicit close control in the popover header, so that the way to finish configuring filters is always visible.
23. As a `User`, I want applied filters to take effect without transient confirmation messages, so that the interface remains quiet and results provide the feedback.
24. As a `User`, I want a toolbar-level `Clear all` whenever search or filters are active, so that I can restore the default view quickly.
25. As a `User`, I want `Clear all` inside the popover when at least one criterion is active, so that I can reset while configuring filters.
26. As a `User`, I want clearing from inside the popover to leave it open, so that I can immediately configure a new result set.
27. As a `User`, I want both `Clear all` controls to clear search and optional criteria, so that the action has one meaning across tables.
28. As a `User`, I want a concise message when no rows match, so that I understand I should clear search or filters without seeing another duplicate clear button.
29. As a `User`, I want filter controls and chips to wrap naturally on a narrow viewport, so that the same interaction remains usable without a separate mobile drawer.
30. As a `User`, I want top-level catalog filters represented in the URL, so that refresh, bookmarking, sharing, and browser navigation preserve my view.
31. As a `User`, I want Product Variants filters to remain local to their embedded table, so that they do not take over the parent Product route.
32. As a `User`, I want default values omitted from the URL, so that catalog links stay canonical and readable.
33. As a `User`, I want text-search typing to replace browser history rather than create one entry per letter, so that Back navigation remains useful.
34. As a `User`, I want discrete filter changes to create navigable history entries, so that Back and Forward can undo and restore meaningful configurations.
35. As a `User`, I want invalid or stale filter parameters normalized to a valid default view, so that old or malformed links do not break the catalog.
36. As a `User`, I want Products search to match Product name remotely, partially, and without case sensitivity, so that retrieval remains responsive as the catalog grows.
37. As a `User`, I want remote search to wait briefly while I type, so that the app avoids wasteful requests without making the input feel delayed.
38. As a `User`, I want existing rows retained while remote search refreshes, so that the table does not flash empty between requests.
39. As an assistive-technology user, I want remote refresh state announced subtly, so that I know results are updating without losing context.
40. As an `Admin`, I want to include deleted Products, Product Variants, and Bills of Materials, so that recoverable historical records can be inspected alongside current records.
41. As an `Admin`, I want to include retired Sources and Pattern Sets, so that retired catalog records can be inspected alongside active records.
42. As an `Admin`, I want a `Deleted` or `Retired` badge on every included historical row, so that mixed result sets remain unambiguous.
43. As an `Admin`, I want a retired Source identified beside its Source name, so that its lifecycle is visible without adding another wide table column.
44. As an `Operator`, I want historical inclusion criteria omitted, so that the UI offers only actions I am authorized to perform.
45. As a security-conscious maintainer, I want the API to remain the authorization authority, so that hiding a UI control is never treated as access control.
46. As a `User`, I want a permission message and `Clear all` recovery when a table request returns `403`, so that I can return to a safe view without being signed out.
47. As a `User`, I want `401` treated as an authentication failure rather than a filter error, so that expired authentication follows the existing session flow.
48. As a maintainer, I want each feature to own its query and business semantics, so that a shared visual control does not become a universal filtering engine.
49. As a maintainer, I want one durable filter standard for future tables, so that new catalog work follows the approved pattern by default.
50. As a maintainer, I want the production UI to reuse the approved prototype direction and remove prototype-only code afterward, so that validated design work is carried forward without shipping scaffolding.

## Implementation Decisions

- The durable Table Filter Standard is authoritative for behavior shared by filtered data tables. Feature-specific requirements may override it only when the exception is explicit.
- The current scope is Products, Sources, Bills of Materials, Pattern Sets, and the embedded Product Variants table. Search fields inside pickers and selection dialogs are not table filters. Tables with no existing filters do not gain filters in this work.
- The approved Products Variant A prototype is the production UI baseline. Reuse or extract its decision-rich layout and interactions rather than recreating the design independently.
- Preserve from the prototype: the visible search/Filter toolbar relationship, compact dimensions, wrapping behavior, pill-shaped editable chips, right-aligned popover, two-level criterion/value navigation, current-value display, selected-value treatment, back navigation, explicit header close control, and immediate application followed by return to the criterion list.
- Prototype evidence does not override later approved decisions. In production, additive booleans activate directly, toolbar `Clear all` also appears for search-only state, and all finalized URL, permission, error, and lifecycle behaviors apply.
- Remove prototype-only dashed framing, Variant labeling, state readouts, route query gating, fixtures, comparison controls, and any obsolete variant code after the production component replaces them.
- Build one controlled app-level filter composition from existing shadcn/Radix primitives and semantic design tokens. Do not introduce a filter library or a general query-expression model.
- The shared composition receives allowed criterion definitions, applied values, labels, and callbacks. It does not fetch data, construct domain queries, interpret roles, or own route state.
- Each feature owns its search execution, filter semantics, URL schema, authorization-derived allowed criteria, and local or server-side filtering.
- Search remains visible when supported. All other criteria are accessed through `Filter` and summarized as chips.
- Ordinary active criteria use `Field: Value`. Additive lifecycle criteria use `Include deleted` or `Include retired` without a value suffix.
- Chips are rendered in feature definition order. Their main control opens the criterion editor and their close control removes only that criterion.
- The popover criterion list includes inactive and active allowed criteria. Active rows display their current value.
- Ordinary criteria use a second-level single-value list. Applying a value is immediate, returns to the criterion list, and leaves the popover open.
- Small enums render their values directly. Collection filtering searches locally over already loaded Collection options.
- Value lists do not expose `Any`; optional criteria are removed from their chip or `Clear all`.
- `Include deleted` and `Include retired` are additive booleans and activate directly from the criterion list without a value screen.
- The explicit close control, Escape, and outside interaction close the popover without mutating filters. Applying a value does not show an “applied” message.
- The toolbar-level `Clear all` appears when search or any criterion is active. The popover-level `Clear all` appears only when at least one criterion is active. Both clear search and optional criteria and restore feature defaults; the popover remains open when clearing from inside it.
- A no-results table displays concise guidance to clear search or filters and does not add another clear action.
- The Filter button does not display an active count. The toolbar and chips wrap inline on narrow screens; there is no filter drawer.
- Products criteria are Lifecycle status, Product status, Product category, Collection, and admin-only Include deleted.
- Sources criteria are Textile family, Material link, Attention, and admin-only Include retired.
- Bills of Materials criteria are Kind and admin-only Include deleted. Catalog filters affect returned rows while existing global operational summary values retain their current unfiltered meaning.
- Pattern Sets exposes admin-only Include retired.
- Product Variants exposes admin-only Include deleted and keeps that state local to the embedded table.
- Products, Sources, Bills of Materials, and Pattern Sets persist filters in validated route search parameters. Product Variants remains local.
- Default values are omitted from URLs. Invalid or unsupported values are discarded and the URL is replaced with its canonical valid form after applying documented legacy mappings.
- Text search uses history replacement. Add, edit, remove, and `Clear all` criterion actions create navigable history entries. Back and Forward restore complete effective configurations rather than intermediate keystrokes.
- Existing Sources `status=active` links canonicalize to the default URL. Existing `status=retired` links canonicalize to `includeRetired=true`.
- Sources changes from an exclusive Active-or-Retired result set to additive `Include retired`: default results are Active only; inclusion returns Active and Retired Sources together.
- Source list summaries expose Source Status so the table can mark each Retired Source beside its name.
- Products text search moves to the server. It searches Product name only, uses partial case-insensitive matching, and accepts a maximum validated length consistent with existing catalog searches.
- The Products list request sends effective `search` and `includeDeleted` values. Lifecycle status, Product status, Product category, and Collection remain local projections over the server-returned search result.
- Remote text searches update the input immediately, debounce the effective query by 250 ms, retain prior rows while refetching, and expose an accessible updating status. Only the effective debounced value is synchronized to the URL.
- Product list query identity and mutation invalidation must account for the search parameter so current and future search results do not retain stale cache entries.
- Historical inclusion is admin-only. Products, Product Variants, and Bills of Materials use Include deleted; Sources and Pattern Sets use Include retired.
- Historical inclusion mixes current and historical rows. Historical rows display only a `Deleted` or `Retired` badge; current rows do not gain an equivalent lifecycle badge.
- The API is the sole authorization authority. Explicit unauthorized requests for historical inclusion return `403` consistently instead of silently ignoring the flag.
- Each page derives allowed criteria from the authenticated session and sanitizes unauthorized URL parameters before querying. The shared filter presentation remains role-agnostic. URL sanitation improves recovery but is not a security boundary.
- A table-level `403` keeps the current session, replaces the table with a permission message and `Clear all`, and retries the safe default query after the user clears. A `401` continues through the existing authentication failure behavior.
- Search, Filter, chip editing/removal, back, close, and clearing controls have accessible names. Applied values and historical state are communicated with text, not color alone.
- The migration is implemented in small verified slices but released as one functional change so users do not encounter competing filter patterns.
- This specification supersedes earlier feature documentation only where that documentation requires Products search to remain local, excludes URL-synchronized Product filters, or models Sources catalog status as an exclusive Active/Retired filter.

## Testing Decisions

- Good tests assert user-observable behavior and cross-boundary contracts. They do not inspect React state, private helpers, internal function calls, or component implementation structure.
- Use a dedicated filter integration test file, separate from the existing Products route test file, to prevent the general Product suite from absorbing the full shared-filter behavior matrix.
- The dedicated suite uses Products as the representative route-level seam and proves the approved prototype flow: visible search, Filter trigger, criterion/value navigation, active-value display, searchable loaded Collections, immediate application, return to the criterion list, persistent popover, chip editing and removal, both `Clear all` placements, explicit close, Escape, outside dismissal, wrapping-compatible markup, accessible names, and absence of prototype-only messages.
- The dedicated Products filter suite also proves remote-search behavior, URL synchronization and history semantics, prior-row retention, accessible updating feedback, invalid URL normalization, role-based Include deleted visibility, historical badges, and table-level `403` recovery where applicable.
- Existing route suites for Sources, Bills of Materials, Pattern Sets, and Product Variants cover only their feature-specific integration. Do not repeat the complete shared interaction flow in every suite.
- Sources route coverage proves the `Include retired` contract, mixed Active/Retired results, Retired badge placement, legacy URL canonicalization, permissions, and URL state.
- Bills of Materials route coverage proves Kind, Include deleted, URL state, deleted badges, permissions, and preservation of global summary semantics.
- Pattern Sets route coverage proves URL-backed Include retired, Retired badges, and role visibility.
- Product Variants route coverage proves local Include deleted state, Deleted badges, and role visibility.
- API functional tests cover only changed server contracts: Products name search and query validation; Sources additive Include retired and returned Source Status; and consistent `403` responses for explicit unauthorized historical inclusion across affected endpoints.
- Reuse the repository's existing web route tests and API functional catalog tests as prior art. Add the fewest scenarios that prove the new contracts and do not duplicate behavior already established by the representative filter suite.
- Run focused lint and type checking for the affected apps and visually inspect all five tables before release. The repository-wide quality gate remains the human and CI responsibility unless separately requested.

## Out of Scope

- A general-purpose or schema-driven query builder
- Multi-value criteria, compound Boolean expressions, ranges, or user-selected operators
- A new filter component dependency or adoption of the ReUI package
- Adding filters or search to tables that do not currently expose them
- Standardizing search fields inside pickers, dialogs, or catalog-selection workflows
- Moving Product Variants filter state into the parent route URL
- Server-side execution of Products lifecycle, product status, category, or collection filters
- Pagination, sorting, virtualization, or bulk table actions
- A mobile-specific drawer or alternate filtering workflow
- A global role/capability framework
- A separate empty-state clear button
- Preserving rejected prototype variants or retaining prototype switching in production
- Redesigning table columns beyond the historical badges required to keep mixed lifecycle results understandable

## Further Notes

- The durable interaction contract is documented in [Table Filter Standard](../../docs/ui/table-filters.md) and is referenced by the frontend agent guide so future filtered tables load it before implementation.
- The approved executable reference is Products Variant A at `/app/products?filterPrototype=A` in the current working tree. Review it before production UI work. The specification is authoritative where later decisions intentionally differ from the prototype's temporary behavior.
- The prototype is implementation evidence, not a production architecture. Preserve the validated look, proportions, and flow while replacing prototype wiring with the controlled shared component and feature-owned contracts described above.
- Use existing domain terms exactly: `Product`, `Product Variant`, `Source`, `Bill of Materials`, `Pattern Set`, `Lifecycle Status`, `Product Status`, `Active`, `Inactive`, `Deleted`, and `Retired`.
- No domain glossary change or architecture ADR is required. This feature establishes a durable frontend interaction standard while retaining the repository's existing layered architecture.
