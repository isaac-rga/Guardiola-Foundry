# Link and Unlink Material Sources

This slice completes Sources issue 10. Admins and Operators can now maintain alternate Source relationships from the existing Material Dialog without creating Sources there or weakening the Preferred Source invariant.

## Start With the Issue

Read [.scratch/sources/issues/10-link-and-unlink-sources.md](.scratch/sources/issues/10-link-and-unlink-sources.md). The implementation is limited to linking an existing Active Source, optionally selecting one of that Source's Vendor Shades, and unlinking an alternate after confirmation. Preferred Source replacement, Source creation inside the Dialog, and Source lifecycle changes remain outside this slice.

## Use Material-Owned Relationship Contracts

[packages/shared-types/src/materials.ts](packages/shared-types/src/materials.ts) and [packages/shared-validation/src/materials.ts](packages/shared-validation/src/materials.ts) define the link request and both mutation responses. A link names the stable Source ID and may carry one positive Vendor Shade ID or explicitly omit the shade.

[apps/api/app/modules/materials/materials_service.ts](apps/api/app/modules/materials/materials_service.ts) keeps relationship rules at the Material–Source composition boundary. Linking executes transactionally and:

- requires an existing Material and Active Source;
- rejects an already-linked Source before another record can be created;
- accepts no Vendor Shade or verifies that the selected shade belongs to the linked Source;
- appends the Source as an alternate without changing the Preferred Source.

Unlinking removes only the relationship. It never deletes the Source, and it rejects a direct attempt to remove the Preferred Source with guidance to replace it first. The existing database constraints remain the final protection against duplicate Material–Source links and multiple Preferred Sources.

## Keep the HTTP Boundary Authenticated and Explicit

[apps/api/app/modules/materials/controllers/materials_controller.ts](apps/api/app/modules/materials/controllers/materials_controller.ts) validates link requests and translates relationship conflicts into business-language responses. [apps/api/start/routes.ts](apps/api/start/routes.ts) exposes both mutations behind bearer authentication:

- `POST /materials/:materialId/sources` links an alternate and returns refreshed Material detail with `201`;
- `DELETE /materials/:materialId/sources/:sourceId` unlinks an alternate and returns refreshed Material detail with `200`.

Missing records return `404`, invalid Vendor Shade ownership returns `422`, and Active/duplicate/Preferred conflicts return `409`.

## Mutate Through the Existing Material Dialog

[apps/web/src/features/materials/api/endpoints.ts](apps/web/src/features/materials/api/endpoints.ts) and [apps/web/src/features/materials/api/queries.ts](apps/web/src/features/materials/api/queries.ts) own the new requests and cache refresh behavior. Successful mutations refresh Material list/detail and Source list/detail context, so an Unlinked Source immediately gains the correct catalog count and linked-Material context.

[apps/web/src/features/materials/components/material-relationship-dialog.tsx](apps/web/src/features/materials/components/material-relationship-dialog.tsx) adds one deliberate relationship-editing area:

- opening `Link existing Source` loads the Active Source catalog;
- Sources already related to the Material are excluded from the choices;
- selecting a Source loads only its own Vendor Shades, while `Not known` remains valid;
- the copy directs users to the Sources catalog for Source creation instead of adding a second creation surface;
- active alternates expose an Unlink action with explicit confirmation;
- the Preferred Source has no direct unlink action and explains that replacement must happen first;
- link and unlink errors stay inside the open Dialog with the server's business-language message.

## Read the Focused Tests as Specifications

[apps/api/tests/functional/materials/manage_source_relationships.spec.ts](apps/api/tests/functional/materials/manage_source_relationships.spec.ts) covers unauthenticated rejection, Admin and Operator linking, optional and owned Vendor Shades, Retired Source rejection, cross-Source shade rejection, duplicate protection, Unlinked-to-linked catalog/detail updates, alternate unlinking, Source preservation, and Preferred protection.

[apps/web/src/routes/-materials.test.tsx](apps/web/src/routes/-materials.test.tsx) covers the complete Dialog interaction: existing-Source selection, no in-dialog creation, Vendor Shade selection, confirmation, alternate removal, Preferred replacement guidance, cache-driven refreshed context, and link/unlink failures that preserve the Dialog.

## Verification

Passed:

- focused Material relationship and existing detail API suites: 11 tests across 2 files;
- focused Materials route web suite: 13 tests;
- lint for API, web, shared types, and shared validation;
- strict typechecking for API, web, shared types, and shared validation;
- shared contract builds required by runtime package resolution;
- whitespace validation with `git diff --check`.

No complete API suite was run. One initially mis-scoped web test command did invoke all route files before the focused command was corrected; that run reported 57 passing tests and one unrelated Source-edit route failure. The deliberate single-file Materials route invocation passed all 13 tests. Complete suites were not used as the completion gate pending implementation approval.

## Scope Boundaries

Issue 10 does not add Source creation inside the Material Dialog, Preferred Source replacement, Source retirement/restoration, Material-field editing, or import behavior changes.

## What Comes Next

Issue 11 can build on these Material-owned transactional mutations to replace the Preferred Source atomically while demoting the former Preferred Source to an alternate.
