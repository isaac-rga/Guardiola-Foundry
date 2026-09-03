# Atomic Preferred Source Replacement

This slice completes Sources issue 11. Admins and Operators can replace an Active Material's Preferred Source from the existing relationship Dialog while the prior Preferred Source remains the committed authority unless the complete replacement succeeds.

## Start With the Issue

Read [.scratch/sources/issues/11-replace-preferred-source.md](.scratch/sources/issues/11-replace-preferred-source.md). The implementation is limited to replacing the Preferred Source with an already-linked Active alternate that has manual Landed Unit Cost. Linking and unlinking remain issue 10 behavior; Source lifecycle changes and import protection remain later slices.

## Follow the Shared Relationship Contract

[packages/shared-types/src/materials.ts](packages/shared-types/src/materials.ts) and [packages/shared-validation/src/materials.ts](packages/shared-validation/src/materials.ts) define the replacement request and response. Material relationship detail also carries a compact Preferred eligibility value, allowing the client to explain why a relationship cannot be selected without duplicating Source business rules.

## Keep Replacement Atomic at the Material–Source Boundary

[apps/api/app/modules/materials/materials_service.ts](apps/api/app/modules/materials/materials_service.ts) owns the replacement rules alongside link and unlink behavior. The service requires:

- an Active Material;
- an existing Source that is Active;
- an already-linked alternate relationship;
- a recorded manual Landed Unit Cost.

The old Preferred relationship is demoted and the selected alternate is promoted inside one managed database transaction. A database failure rolls both writes back, and the existing partial unique index still prevents multiple Preferred Sources. Unexpected transaction failures become a stable business-language conflict instead of exposing persistence details.

The Material list continues deriving cost only from the committed Preferred Source's Landed Unit Cost. Its alternate count now includes only Active, non-deleted alternate Sources, so Retired relationships remain historical context without inflating the purchasing count.

## Use the Existing Authenticated HTTP Boundary

[apps/api/app/modules/materials/controllers/materials_controller.ts](apps/api/app/modules/materials/controllers/materials_controller.ts) validates `{ sourceId }` and maps eligibility failures to business responses. [apps/api/start/routes.ts](apps/api/start/routes.ts) exposes `PUT /materials/:materialId/preferred-source` behind the existing bearer middleware and returns refreshed Material detail after a successful replacement.

## Replace From the Existing Dialog

[apps/web/src/features/materials/api/endpoints.ts](apps/web/src/features/materials/api/endpoints.ts) and [apps/web/src/features/materials/api/queries.ts](apps/web/src/features/materials/api/queries.ts) keep transport and server-state synchronization outside the presentation component. A successful mutation immediately updates Material detail, then invalidates the Material list and Source queries so derived cost, active alternate count, and relationship context refetch from committed data.

[apps/web/src/features/materials/components/material-relationship-dialog.tsx](apps/web/src/features/materials/components/material-relationship-dialog.tsx) adds a Preferred action to Active alternate cards. Eligible alternates can be promoted. Missing-cost alternates keep the same visible card but show `Landed Unit Cost required` and a disabled action. Retired and Unlinked Sources never become replacement choices. Server failures remain visible without closing the Dialog or changing its prior Preferred state.

## Read the Focused Tests as Specifications

[apps/api/tests/functional/materials/manage_source_relationships.spec.ts](apps/api/tests/functional/materials/manage_source_relationships.spec.ts) covers unauthenticated rejection, both authorized roles, Active/linked/cost eligibility, historical Material rejection, atomic success, exact-one-Preferred persistence, derived cost, active alternate count, and rollback under an injected database failure.

[apps/api/tests/functional/materials/show_material.spec.ts](apps/api/tests/functional/materials/show_material.spec.ts) verifies the relationship eligibility projection. [apps/api/tests/functional/materials/list_materials.spec.ts](apps/api/tests/functional/materials/list_materials.spec.ts) protects the adjacent Material summary contract. [apps/web/src/routes/-materials.test.tsx](apps/web/src/routes/-materials.test.tsx) covers eligible and disabled actions, committed dialog/list refresh, Source-query refresh, and failure messaging that preserves the open Dialog.

## Verification

Passed with Node 24:

- focused Material relationship API suite: 11 tests;
- focused Material detail API suite: 4 tests;
- focused Materials list API suite: 7 tests;
- focused Materials route web suite: 16 tests;
- lint for API, web, shared types, and shared validation;
- strict typechecking for API, web, shared types, and shared validation;
- shared contract builds required by runtime package resolution;
- whitespace validation with `git diff --check`.

Complete API and web suites and the repository quality gate were deliberately not run, per the review boundary. The implementation remains uncommitted.

## Scope Boundaries

Issue 11 does not add new Source links, Source creation inside the Material Dialog, Source retirement/restoration, Material-field editing, importer behavior changes, or a broader authentication refactor.

## What Comes Next

Issue 12 can build on the committed relationship invariant to retire and restore Sources without leaving an Active Material pointed at an ineligible Preferred Source.
