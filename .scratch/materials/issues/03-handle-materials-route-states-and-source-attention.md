# Handle Materials route states and Preferred Source attention

Status: ready-for-agent

## Parent

.scratch/materials/PRD.md

## What to build

Make the Materials route operationally resilient around the lean table. The route should handle loading, error, and empty states from the user's perspective, and it should have a read-only attention state for a Material whose Preferred Source is unavailable or soft-deleted. The Material should remain visible when its Preferred Source needs attention; the warning should not become a Source management workflow.

This issue should not add Source deletion, Source restore, Preferred Source changes, Source detail, search, filters, pagination, dashboards, or Material mutation workflows.

## Acceptance criteria

- [ ] The Materials route shows a clear loading state while the Materials list is being fetched.
- [ ] The Materials route shows a clear error state if the Materials list cannot be loaded.
- [ ] The Materials route shows a clear empty state if there are no active Materials to display.
- [ ] A Material remains visible if its Preferred Source is unavailable or soft-deleted.
- [ ] A Material whose Preferred Source needs attention shows a compact warning or status that does not convert the row into a Source management UI.
- [ ] The Preferred Source attention state does not expose delete, restore, edit, or Preferred Source change controls.
- [ ] Focused API or web tests cover active-only list behavior and the user-visible loading, error, empty, and Preferred Source attention states.

## Blocked by

- .scratch/materials/issues/02-replace-materials-placeholder-with-lean-table.md
