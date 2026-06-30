# Add collapsible rail persistence and mobile shell behavior

Status: ready-for-agent

## Parent

- [PRD](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/authenticated-app-shell/PRD.md)

## What to build

Deliver the shell interaction model by making the sidebar collapse into an icon rail with browser-local persistence, keeping stable navigation icons and tooltips, and carrying the same shell concepts onto mobile through a dismissible sidebar sheet. This slice should also make route changes reset the authenticated content region to the top so the shell behaves predictably while the placeholder pages are still empty.

## Acceptance criteria

- [ ] On desktop, the sidebar collapses to an icon rail rather than disappearing, keeps stable icons for `Home`, `Products`, `Materials`, `Inventory`, and `Bills of Materials`, and exposes tooltips when labels are hidden.
- [ ] The collapse state persists across authenticated routes and remains restored after the browser is closed and reopened on the same machine.
- [ ] On mobile, the sidebar trigger remains available, and route-changing navigation actions dismiss the transient shell first, then navigate and reset the content region to the top.

## Blocked by

- [02-add-authenticated-work-area-routes-and-navigation](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/authenticated-app-shell/issues/02-add-authenticated-work-area-routes-and-navigation.md)
