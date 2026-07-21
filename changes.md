# Materials Route States and Preferred Source Attention

This slice completes issue 03 for the Materials feature. It keeps the lean Materials table from the prior issue, then makes the route resilient around list states and Preferred Source availability.

## Start With The Contract

The Materials shared response shape now marks whether the Preferred Source needs attention:

- [packages/shared-types/src/materials.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/packages/shared-types/src/materials.ts)
- [packages/shared-validation/src/materials.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/packages/shared-validation/src/materials.ts)

`MaterialPreferredSourceSummary` now includes `needsAttention: boolean`. This keeps the Source warning as part of the API contract instead of making the web route infer Source state from hidden details.

## Then Read The API Serializer

The API summary is serialized in [apps/api/app/modules/materials/materials_service.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/app/modules/materials/materials_service.ts).

The list query still includes soft-deleted Material Sources so a Material remains visible when its Preferred Source has been retired. The serializer now sets `preferredSource.needsAttention` from the Source `deletedAt` value. Cost still comes from the Preferred Source, and the endpoint still returns only the lean table summary.

## Then Read The Materials Page

The route page is [apps/web/src/features/materials/materials-page.tsx](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/features/materials/materials-page.tsx).

The route keeps the user-visible states expected by the issue:

- loading while the list request is pending
- error when the list cannot load
- empty state when there are no active Materials
- table state when active Materials exist

When `preferredSource.needsAttention` is true, the Preferred Source cell shows a compact `Source needs attention` badge under the Source name and provider. The row remains read-only: there are no Source delete, restore, edit, or Preferred Source change controls.

The parent PRD still requires every listed Material to have a Preferred Source. This issue handles the read-only unavailable state as a soft-deleted Preferred Source; missing Preferred Source links remain invalid imported data, not a user-facing draft state.

## End At The Tests

The API coverage is in [apps/api/tests/functional/materials/list_materials.spec.ts](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/api/tests/functional/materials/list_materials.spec.ts).

It verifies normal Preferred Sources return `needsAttention: false`, and that a Material remains listed with `needsAttention: true` when its Preferred Source is soft-deleted.

The web route coverage is in [apps/web/src/routes/-materials.test.tsx](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/routes/-materials.test.tsx).

It covers loading, empty, and error states, then checks the Preferred Source attention row from the user's perspective: the Material stays visible, the warning appears, and no management buttons are exposed.

## Still Out Of Scope

This issue does not add Source deletion, Source restore, Preferred Source changes, Source detail, search, filters, pagination, dashboards, or Material mutation workflows.
