# Sources Uses Shared Filters and Includes Retired Records

Sources now uses the shared table-filter control. Admins can include Active and Retired Sources in one result set. Operators keep the Active-only catalog. This change applies to Sources; other catalog migrations remain outside this ticket.

## Source Catalog Contract

The [Source contracts](packages/shared-types/src/sources.ts) and [validation schemas](packages/shared-validation/src/sources.ts) replace the exclusive `status` list filter with optional `includeRetired`. Every Source summary includes `sourceStatus`.

The [Sources controller](apps/api/app/modules/sources/controllers/sources_controller.ts) rejects an explicit unauthorized `includeRetired=true` request with `403`. The [Sources service](apps/api/app/modules/sources/services/sources_service.ts) applies the Active-only condition by default and removes that condition when an Admin includes Retired records. Name and Vendor ordering, search, Textile Family, Material link, and Attention filtering remain in place. No model or database schema changes are required.

Legacy `status` mapping belongs to the web URL boundary. The HTTP API uses the new contract.

## Shared Controls and URL State

[SourceFilters](apps/web/src/features/sources/components/source-filters.tsx) composes the existing shared TableFilters control with Textile family, Material link, Attention, and Admin-only Include retired criteria. It inherits chip editing and removal, immediate apply, popover navigation, keyboard behavior, clearing, and inline wrapping. The shared component and its interaction suite do not change.

The [Sources route](apps/web/src/routes/app.sources.tsx) canonicalizes `status=active` to defaults and `status=retired` to `includeRetired=true`. It discards invalid and unsupported parameters and replaces the current history entry. The [index route](apps/web/src/routes/app.sources.index.tsx) creates history entries for criterion changes and clearing. Text search replaces history. Back and Forward restore the catalog criteria.

The [Sources page](apps/web/src/features/sources/sources-page.tsx) updates the search input immediately, waits 250 ms before updating the effective URL and request, retains previous rows during refresh, and announces Updating Sources. The [Sources query layer](apps/web/src/features/sources/api/queries.ts) keeps each complete filter object in its list query key. Existing create, update, retire, and restore invalidation uses the list prefix, which covers default and Include retired keys.

## Historical Records and Permission Recovery

[SourcesTable](apps/web/src/features/sources/components/sources-table.tsx) shows a Retired badge beside each Retired Source name. Active names receive no lifecycle badge.

The page sanitizes Operator historical URL state before its first Source query. A table-level `403` keeps the session, hides the table, and offers Clear all. Clearing restores safe defaults and invalidates the exact default query with refetchType all. It retries that safe identity even when it already has a fresh inactive cache entry or its parameters already equal defaults. The forbidden identity is not retried. A `401` provides the separate sign-in recovery action. Empty results direct the User to clear search or filters without another empty-state button.

## Focused Coverage

The [Sources route tests](apps/web/src/routes/-sources.test.tsx) cover feature URL projection, canonical replacement without duplicate history entries, Operator sanitization before requests, Retired name badges, Back and Forward restoration, debounce and retained rows, and permission recovery for filtered and default queries. They do not repeat the shared interaction matrix.

The [Sources HTTP tests](apps/api/tests/functional/sources/list_sources.spec.ts) prove default Active summaries, additive ordered results with Source Status, Admin authorization, and invalid-filter rejection. Source-edit and Material route fixtures add the required summary field to stay consistent with the HTTP response.

## Focused Verification

- Sources route suite: 18 passed. A review regression first proved that a fresh default cache suppressed the safe recovery request; it passes after exact default-query invalidation. The shared-control adoption test first failed on missing Include retired; the remote-search test first failed because search updated the URL immediately.
- Sources list HTTP suite: 5 passed. The additive authorization test first failed because an Operator request returned `200` instead of `403`.
- Sources route, Source edit, Material route, and Sources cache suites together: 37 passed. Existing Material Select controlled/uncontrolled warnings remain.
- Web TypeScript project build and API, shared-types, and shared-validation TypeScript checks: passed.
- Focused web/shared Oxlint, API ESLint, and `git diff --check`: passed.
- The sandbox prevented a local HTTP listener with `EPERM`; approved elevated HTTP tests then passed against the local test database. Direct local Node entry points were used because pnpm script invocations stalled.

## Scope Boundaries

No dependencies, migrations, or architecture seams were added. Source detail, editing, lifecycle mutations, and Material relationships keep their existing behavior. No commits or pushes were made. The unrelated `.gitignore` change is preserved.

The full `pnpm quality` gate was not run. Manual browser flow and narrow-viewport visual QA remain pending. Independent Standards and Spec reviews passed with no remaining findings. The first Spec review found a missing safe retry when the default cache was fresh; the correction and regression test closed that finding. Spec independently reran all 18 Sources route tests and confirmed the safe retry.
