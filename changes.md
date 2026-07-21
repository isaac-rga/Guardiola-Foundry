# Materials Table Route

This slice replaces the authenticated Materials placeholder with the first real Materials table. It consumes the persisted backend API from the prior issue and keeps the screen intentionally Material-first: one row per `Material`, with only a compact Preferred Source reference beside it.

## Start at the route

The route file is [apps/web/src/routes/app.materials.tsx](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/routes/app.materials.tsx).

It stays thin. The route still owns only the TanStack Router file-route registration for `/app/materials`, then renders the feature page from the Materials module.

## Then read the Materials API adapter

The web endpoint adapter is [apps/web/src/features/materials/api/endpoints.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/features/materials/api/endpoints.ts).

`listMaterials()` calls `GET /materials` with the current bearer token, parses the response through the shared `listMaterialsResponseSchema`, and turns API error payloads into the same kind of user-facing error messages used by the Product endpoint adapters.

The query key lives in [apps/web/src/features/materials/query-keys.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/features/materials/query-keys.ts). There is only one first-slice list query because search, filters, pagination, and deleted-record views are out of scope.

## Then read the page

The page is [apps/web/src/features/materials/materials-page.tsx](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/features/materials/materials-page.tsx).

It reads the authenticated app session, loads the persisted Materials list with TanStack Query, and renders the user-visible states:

- loading while the API request is pending
- an API error message when the request fails
- an empty state when there are no active Materials
- the Materials table when active Materials are returned

The table columns are the lean issue contract:

- Material ID
- name
- Material Color
- Material Use
- Material Unit
- Preferred Source reference
- derived cost
- alternate Source count
- compact comments

The Preferred Source cell shows only the Source name and provider. It does not expose Source technical fields, Source IDs, textile family, purchase unit, GSM, width, fiber, composition, finish, weave, or country of origin.

Comments use a two-line clamp so imported migration context can remain visible without turning the page back into a spreadsheet-like layout.

## End at the tests

The focused route spec is [apps/web/src/routes/-materials.test.tsx](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/routes/-materials.test.tsx).

It covers the route from the user perspective:

- `/app/materials` calls the persisted `/materials` API with the stored session token
- the table renders one row per Material, not one row per Source
- the visible column set matches the lean Material summary
- Preferred Source context stays shallow
- Source technical columns are absent
- out-of-scope controls are absent
- loading, empty, and error states render clearly

The completed issue is [.scratch/materials/issues/02-replace-materials-placeholder-with-lean-table.md](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/materials/issues/02-replace-materials-placeholder-with-lean-table.md).

## Scope note

This slice does not add Materials create, edit, delete, restore, Source management, search, filters, pagination, summary stats, charts, dashboards, bulk actions, or URL-synced table state.
