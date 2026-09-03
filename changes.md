# Open the Material Relationship Dialog

This slice completes Sources issue 09. Users can now open a Material from the Materials table, inspect its read-only identity and Source relationships, and move between Material and Source context without gaining any Material or relationship mutation controls.

## Start With the Issue

Read [.scratch/sources/issues/09-open-material-relationship-dialog.md](.scratch/sources/issues/09-open-material-relationship-dialog.md). The implementation is limited to Material relationship inspection, URL-backed dialog state, and bidirectional navigation. Source linking, unlinking, Preferred Source replacement, Source creation inside the Dialog, and Material lifecycle controls remain outside this slice.

## Read Material Relationships Through a Dedicated Contract

[packages/shared-types/src/materials.ts](packages/shared-types/src/materials.ts) and [packages/shared-validation/src/materials.ts](packages/shared-validation/src/materials.ts) define and validate the Material detail response. It includes the Material's stable identity, comments, and Source relationship summaries with:

- Preferred or alternate relationship role;
- active or historical relationship status;
- Source identity and Vendor;
- the selected Vendor Shade when one is recorded.

[apps/api/app/modules/materials/materials_service.ts](apps/api/app/modules/materials/materials_service.ts) owns the Material-side composition. It loads Source relationships including soft-deleted Sources, classifies Retired or soft-deleted Sources as historical, and orders the response as Preferred Source, active alternates, then historical alternates.

[apps/api/app/modules/materials/controllers/materials_controller.ts](apps/api/app/modules/materials/controllers/materials_controller.ts) and [apps/api/start/routes.ts](apps/api/start/routes.ts) expose `GET /materials/:materialId` behind the existing bearer-authentication middleware. Historical Materials already referenced by Source detail can reopen their read-only relationship context, while an unknown Material returns `Material not found.` The endpoint adds no mutation route.

## Keep the Dialog in the Materials Route

[apps/web/src/routes/app.materials.tsx](apps/web/src/routes/app.materials.tsx) validates the optional `materialId` search parameter and treats it as dialog state. A URL such as `/app/materials?materialId=M-0001` can therefore be refreshed or entered directly and still reopens the intended Material context.

[apps/web/src/features/materials/api/endpoints.ts](apps/web/src/features/materials/api/endpoints.ts), [apps/web/src/features/materials/api/queries.ts](apps/web/src/features/materials/api/queries.ts), and [apps/web/src/features/materials/query-keys.ts](apps/web/src/features/materials/query-keys.ts) keep the relationship request and cache behavior in the Materials data layer.

[apps/web/src/features/materials/components/material-relationship-dialog.tsx](apps/web/src/features/materials/components/material-relationship-dialog.tsx) renders:

- read-only Material ID, name, Material Color, Material Use, Material Unit, and comments;
- a dedicated Preferred Source section;
- active alternate Sources;
- historical Retired Source relationships;
- Vendor Shade context and links to each Source detail page;
- loading, missing-record, permission, service-error, and retry states inside the Dialog.

The Materials table remains mounted behind every dialog state. Closing the Dialog removes only `materialId` from the route state.

## Navigate in Both Directions

[apps/web/src/features/materials/materials-page.tsx](apps/web/src/features/materials/materials-page.tsx) opens the Dialog from the Material name and links the compact Preferred Source reference directly to Source detail. A trailing arrow distinguishes this cross-view navigation from the Material name's in-page Dialog action.

[apps/web/src/features/sources/source-detail-page.tsx](apps/web/src/features/sources/source-detail-page.tsx) turns every linked Material name into a link back to `/app/materials?materialId=…`, so Source detail can reopen the relevant Material Dialog in one step. Source links in the Dialog and Material backlinks use the same trailing-arrow affordance for navigation to another view.

## Read the Tests as Specifications

[apps/api/tests/functional/materials/show_material.spec.ts](apps/api/tests/functional/materials/show_material.spec.ts) covers unauthenticated rejection, Material identity, Preferred and alternate summaries, Vendor Shade context, Retired Source history, reopening a historical Material from Source context, and the missing response for an unknown Material.

[apps/web/src/routes/-materials.test.tsx](apps/web/src/routes/-materials.test.tsx) covers authenticated route access, opening and restoring the Dialog through URL state, read-only identity, relationship grouping, Source navigation, and loading, missing, permission, and service-error states while the Materials page remains mounted.

[apps/web/src/routes/-source-detail.test.tsx](apps/web/src/routes/-source-detail.test.tsx) covers the linked-Material route back to the active Material Dialog.

## Verification

Passed:

- focused Material detail API suite: 4 tests;
- focused Materials and Source-detail web route suites: 12 tests across 2 files;
- repository lint for API, web, shared types, and shared validation;
- repository strict typechecking for API, web, shared types, and shared validation;
- complete API and web test suites through the repository quality gate;
- builds for API, web, shared types, and shared validation;
- whitespace validation with `git diff --check`.

The complete repository quality gate passed after implementation approval and the review refinements.

## Scope Boundaries

Issue 09 does not add Material create/edit/retire/restore, Source creation inside the Dialog, Source link/unlink, Vendor Shade assignment changes, Preferred Source replacement, Source retirement/restoration, or any write endpoint.

## What Comes Next

Issue 10 can build on this read-only Dialog to add controlled alternate Source linking and unlinking with Vendor Shade selection and Preferred Source protection.
