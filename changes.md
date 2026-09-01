# Browse and Filter the Source Catalog

This slice completes Sources issue 04. Authenticated users can now move between Materials and Sources as sibling views, scan the complete operational Source catalog, and narrow it without losing their working view on refresh. The implementation remains list-only: Source detail and mutations begin in later issues.

## Start With the Issue

Read [.scratch/sources/issues/04-browse-and-filter-source-catalog.md](.scratch/sources/issues/04-browse-and-filter-source-catalog.md). It defines two public seams: the authenticated `GET /sources` contract and the `/app/sources` route. Both now have focused behavior tests.

## Follow the Shared Source Contract

Open [packages/shared-types/src/sources.ts](packages/shared-types/src/sources.ts), then [packages/shared-validation/src/sources.ts](packages/shared-validation/src/sources.ts).

These files are now the single cross-boundary home for Textile Family, Purchase Presentation, Purchase Unit, Vendor Currency, Source Status, link state, attention state, list filters, and the table-shaped Source summary. The API importer, persistence model, endpoint, and web route consume those definitions instead of redeclaring controlled values locally.

The list projection deliberately contains only operational columns. Technical details such as GSM, width, composition, finish, weave, and Vendor Shades remain persisted for later Source detail work but are not sent as part of the table response.

## Trace the Authenticated List Endpoint

[apps/api/app/middleware/bearer_auth_middleware.ts](apps/api/app/middleware/bearer_auth_middleware.ts) authenticates the request at the HTTP boundary and exposes the typed current session to downstream handlers. [apps/api/app/modules/sources/controllers/sources_controller.ts](apps/api/app/modules/sources/controllers/sources_controller.ts) then validates the shared query contract and protects Retired Source data. Operators receive an actionable permission response if they manually request the retired view; Admins can select it through the Status filter.

[apps/api/app/modules/sources/services/sources_service.ts](apps/api/app/modules/sources/services/sources_service.ts) loads Source rows and their Material links without per-row follow-up queries. It defaults to Active Sources, includes Unlinked Sources, searches only Source Name and Vendor case-insensitively, applies the approved filters, and orders by Source Name then Vendor.

Each response row includes:

- Source ID, Source Name, Vendor, and Textile Family;
- Purchase Presentation, Purchase Unit, Vendor Currency, and Purchase Price;
- manual Landed Unit Cost in MXN per meter;
- linked Material count;
- `Cost needs attention` and `Data needs attention` indicators.

## Walk Through the Sources View

Open [apps/web/src/routes/app.sources.tsx](apps/web/src/routes/app.sources.tsx). The route validates its search parameters with the shared schema and keeps every filter change in the URL. Refreshing or sharing the URL therefore restores the same search, Textile Family, Status, Material link, and attention view.

[apps/web/src/features/sources/sources-page.tsx](apps/web/src/features/sources/sources-page.tsx) renders the operational table and role-aware controls. Admins see Active and Retired Status choices; Operators stay in the Active catalog. The existing table primitive supplies horizontal scrolling for the nine-column layout, and the full known 156-row result renders without pagination or infinite-scroll controls.

The page distinguishes loading, no-match, service-error, and permission states. Empty and error messages tell the user how to recover. Materials now carries the same local Materials/Sources switcher so either row identity remains one click away.

Server state stays outside the presentation component. [apps/web/src/features/sources/api/endpoints.ts](apps/web/src/features/sources/api/endpoints.ts) owns transport and runtime response validation, while [apps/web/src/features/sources/api/queries.ts](apps/web/src/features/sources/api/queries.ts) owns the filter-sensitive TanStack Query key.

## Read the Tests as Specifications

[apps/api/tests/functional/sources/list_sources.spec.ts](apps/api/tests/functional/sources/list_sources.spec.ts) proves authentication, the lean projection, default Active and Unlinked visibility, ordering, search scope, all filter dimensions, invalid-filter rejection, and Admin-only Retired access.

[apps/web/src/routes/-sources.test.tsx](apps/web/src/routes/-sources.test.tsx) proves sibling navigation, required columns, omitted technical fields and pagination, 156-row rendering, horizontal overflow, URL hydration and updates, role-aware controls, and loading, empty, service-error, and permission states.

The web TypeScript config also drops the deprecated `baseUrl` option. Its existing `@/*` paths continue to resolve relative to the config file, while the repository's declared TypeScript 6 typecheck can run without a deprecation error.

## Review and Verification

The completed tree received separate Standards and Spec reviews against `HEAD`. The follow-up review found no remaining actionable findings after moving bearer authentication to middleware, placing Source query logic under `services/`, separating the page orchestration from its filters and table, and consuming every controlled Source state from the shared contract.

The final local verification passed:

- API functional suite: 60 tests;
- web suite: 41 tests;
- API, web, shared-types, and shared-validation lint and strict typechecks;
- API, web, shared-types, and shared-validation production builds;
- whitespace validation with `git diff --check`.

No database schema changed in this slice, so there is no migration or seed step to apply.

## Scope Boundaries

Issue 04 does not add Source detail, create, edit, retirement, restoration, Material relationship mutations, currency-rate display, or automatic Landed Unit Cost calculation. Those remain assigned to later Sources issues. The current page is an authenticated operational catalog, not a second spreadsheet-width technical report.

## What Comes Next

Issue 05 is the next slice: Source detail for the complete commercial, technical, costing-input, Vendor Shade, and linked-Material context. The list route now provides the stable Source IDs and navigation foundation that detail work will consume.
