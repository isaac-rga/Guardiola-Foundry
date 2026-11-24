# Table Filter Standard

This document defines the required filter experience for data tables in the web app. Use it when adding a filtered table or changing an existing table's filters. A justified product requirement may override the standard, but the exception must be explicit in the feature specification.

The visual language is informed by ReUI Filters, but the app does not adopt a general query builder or a new UI dependency. The shared seam is a controlled app-level presentation component. Each feature continues to own its filter definitions, business semantics, authorization, URL mapping, and local or remote execution.

## Scope

Apply this standard to tables that expose filtering controls. Do not treat search inside pickers or selection dialogs as table filtering. Adding filters to a table that has none is separate product scope.

The current adoption matrix is:

| Table | Criteria | State |
| --- | --- | --- |
| Products | Lifecycle status, Product status, Product category, Collection, Include deleted | Top-level URL |
| Sources | Textile family, Material link, Attention, Include retired | Top-level URL |
| Bills of Materials | Kind, Include deleted | Top-level URL |
| Pattern Sets | Include retired | Top-level URL |
| Product Variants | Include deleted | Local to the embedded table |

## Toolbar composition

- Keep text search visible whenever the table supports it.
- Put the remaining criteria behind a `Filter` button.
- Do not show an active-filter count on the button.
- Render applied criteria as removable chips after the search field.
- Use `Field: Value` for ordinary criteria and `Include deleted` or `Include retired` for additive lifecycle criteria.
- Order chips by the table's filter-definition order, not by selection time.
- Let the toolbar and chips wrap inline on narrow screens; do not move filters into a separate mobile drawer.

## Filter popover

The popover uses two levels for ordinary criteria:

1. A criterion list that shows every allowed field, including active fields and their current values.
2. A value list for the selected criterion.

Selecting a value applies it immediately, returns to the criterion list, and keeps the popover open. Clicking an active chip opens that criterion for editing. The value list does not contain an `Any` option; remove an optional criterion with its chip or `Clear all`.

Additive boolean criteria such as `Include deleted` and `Include retired` activate immediately from the criterion list without opening a value level. Remove them with their chip or `Clear all`.

Provide an explicit close button in the popover header. The close button, Escape, and clicking outside close the popover without changing applied values. Do not show transient “applied” confirmation messages.

## Clearing and empty results

- Show the toolbar-level `Clear all` when either search or a criterion is active.
- Show `Clear all` inside the popover only when at least one criterion is active.
- Both controls clear search and all optional criteria and restore feature defaults. Clearing from inside the popover leaves it open.
- Removing one chip clears only that criterion.
- When no rows match, show concise text explaining that there are no results and that the user can clear search or filters. Do not add a second clear button to the empty state.

## URL and history

Top-level catalogs persist search and filter state in validated URL search parameters. Embedded tables keep their state local unless their feature specification explicitly promotes it to the parent route.

- Omit default values from the URL.
- Update text-search parameters with history replacement so typing does not create one history entry per letter.
- Add, edit, and remove criteria, including `Clear all`, as navigable history entries.
- Discard invalid or unsupported parameters, replace the URL with its canonical valid form, and load feature defaults. Apply documented legacy mappings before discarding a parameter.
- Restore the complete filter state when navigating backward or forward.

Sources previously used an exclusive `status` parameter. Canonicalize legacy URLs as follows:

- `status=active` becomes the default URL without a lifecycle parameter.
- `status=retired` becomes `includeRetired=true`.

## Search execution

Each feature owns whether its search is local or remote. Remote search updates the input immediately, debounces requests by 250 ms, retains the previous rows while refreshing, and exposes a subtle accessible updating status. Only the effective debounced value is written to the URL.

Products search is remote, matches Product name only, and is partial and case-insensitive. Send `search` and `includeDeleted` to the Products endpoint; lifecycle status, product status, category, and collection remain local projections over the returned result.

## Lifecycle visibility

Lifecycle inclusion is additive:

- `Include deleted` returns current and deleted records.
- `Include retired` returns active and retired records.

When historical records are included, identify each historical row with a `Deleted` or `Retired` badge. Do not add an equivalent badge to current rows. Sources display the `Retired` badge beside the Source name.

The relevant lifecycle controls are:

- Products, Product Variants, and Bills of Materials: `Include deleted`.
- Sources and Pattern Sets: `Include retired`.

Only Admins receive these lifecycle inclusion criteria.

## Authorization and errors

The API is the authorization authority. A feature page derives its allowed filter definitions from the authenticated session and passes only those definitions to the shared presentation component. The shared component has no knowledge of roles or permissions.

Sanitize unauthorized URL parameters before issuing the request. This is a user-experience measure, not a security boundary. An API request that explicitly asks for privileged historical records without authorization returns `403`.

When a table receives `403`:

- Keep the session active.
- Replace the table with a permission message and a `Clear all` action.
- `Clear all` restores defaults, updates the URL, and retries the safe query.

Treat `401` separately as an authentication failure.

## Accessibility

- Give search, Filter, chip removal, and close controls accessible names.
- Preserve keyboard navigation and focus behavior supplied by the underlying shadcn/Radix primitives.
- Announce remote refresh state without replacing the current rows.
- Keep applied values visible in text; color alone must not communicate filter or lifecycle state.

## Implementation boundaries

- Build the shared toolbar and popover as controlled composition under `apps/web/src/components/app`.
- Keep query construction, URL schemas, authorization rules, server state, and local projections in their owning features.
- Reuse existing shadcn primitives and semantic design tokens; do not add a filter library for this standard.
- Fold the approved Products prototype behavior into the production component, then remove `filterPrototype`, its route handling, and all prototype-only code.

## Verification

Use the smallest set of focused tests that proves the changed behavior. Cover shared interactions once and add page-level tests only for feature-specific contracts such as URL persistence, remote search, authorization, lifecycle inclusion, historical badges, or `403` recovery. Run focused lint and type checking, and visually review the five tables before release.

Develop the migration in small verified slices, but release it as one functional change so users do not encounter competing filter patterns.
