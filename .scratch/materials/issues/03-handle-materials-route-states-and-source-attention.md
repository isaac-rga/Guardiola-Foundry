# Handle Materials route states and Preferred Source attention

Status: done

## Parent

.scratch/materials/PRD.md

## What to build

Make the Materials route operationally resilient around the lean table. The route should handle loading, error, and empty states from the user's perspective, and it should have a read-only attention state for a Material whose Preferred Source is unavailable or soft-deleted. The Material should remain visible when its Preferred Source needs attention; the warning should not become a Source management workflow.

This issue should not add Source deletion, Source restore, Preferred Source changes, Source detail, search, filters, pagination, dashboards, or Material mutation workflows.

## Acceptance criteria

- [x] The Materials route shows a clear loading state while the Materials list is being fetched.
- [x] The Materials route shows a clear error state if the Materials list cannot be loaded.
- [x] The Materials route shows a clear empty state if there are no active Materials to display.
- [x] A Material remains visible if its Preferred Source is unavailable or soft-deleted.
- [x] A Material whose Preferred Source needs attention shows a compact warning or status that does not convert the row into a Source management UI.
- [x] The Preferred Source attention state does not expose delete, restore, edit, or Preferred Source change controls.
- [x] Focused API or web tests cover active-only list behavior and the user-visible loading, error, empty, and Preferred Source attention states.

## Blocked by

- .scratch/materials/issues/02-replace-materials-placeholder-with-lean-table.md

## Comments

Completed the Materials route resilience slice by preserving the existing loading, error, and empty states, adding an explicit `needsAttention` flag to the Preferred Source summary contract, deriving that flag from a soft-deleted Preferred Source in the API serializer, and rendering a compact read-only warning inside the Materials table row. The warning keeps the Material visible and does not expose Source delete, restore, edit, or Preferred Source change controls.

Per the parent PRD's first-list invariant, every listed Material still requires a Preferred Source. In this slice, the user-facing unavailable Source state is the soft-deleted Preferred Source case; missing Preferred Source links remain invalid imported data rather than a draft Materials UI state.
