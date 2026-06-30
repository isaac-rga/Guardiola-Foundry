# Add authenticated work-area routes and navigation

Status: ready-for-agent

## Parent

- [PRD](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/authenticated-app-shell/PRD.md)

## What to build

Deliver the first end-to-end authenticated navigation structure by adding real child routes for `Products`, `Materials`, `Inventory`, and `Bills of Materials`, wiring them into the shared sidebar navigation, and giving each route its own placeholder page. This slice should make the authenticated information architecture real: every work area gets a real URL, the main navigation stays persistent, and page identity comes from each route while the page body uses the shared neutral empty-state treatment.

## Acceptance criteria

- [ ] Authenticated users can navigate between `/app/products`, `/app/materials`, `/app/inventory`, and `/app/bills-of-materials` through persistent main navigation, and each route renders its own visible page identity within the authenticated page body.
- [ ] `Home`, `Products`, `Materials`, `Inventory`, and `Bills of Materials` each have a real authenticated route with the shared centered neutral empty-state surface showing `Work in progress…` and no duplicate page-title surface inside the page body.
- [ ] The main navigation order is `Home`, `Products`, `Materials`, `Inventory`, `Bills of Materials`, with active highlighting for the current non-Home route and no active highlight for `Home` on `/app`.

## Blocked by

- [01-establish-shared-authenticated-app-shell](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/authenticated-app-shell/issues/01-establish-shared-authenticated-app-shell.md)
