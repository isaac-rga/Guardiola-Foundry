# Add Product soft delete and hidden-by-default behavior

Status: ready-for-agent

## Parent

- [PRD](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/product-management/PRD.md)

## What to build

Introduce Product removal beyond ordinary inactivity by adding delete from the Product page and implementing it as soft delete. Deleted Products should leave normal working views by default, while the user-facing workflow remains simple: confirm delete on the Product page, perform a recoverable removal under the hood, and return the user to the working list with confirmation feedback.

## Acceptance criteria

- [ ] The Product page exposes a confirmation-based `Delete` action, and deleting a Product performs a soft delete rather than a hard delete while also making the Product inactive.
- [ ] After delete, the user is redirected back to the Product list with confirmation feedback, and the deleted Product is removed from ordinary working views by default.
- [ ] Focused API and web tests verify soft-delete persistence, Product-page delete behavior, redirect-with-feedback after delete, and hidden-by-default visibility rules for deleted Products in normal list usage.

## Blocked by

- [02 - Ship the Product working list with search and filters](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/product-management/issues/02-ship-the-product-working-list-with-search-and-filters.md)
- [03 - Add the Product edit page with explicit save workflow](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/product-management/issues/03-add-the-product-edit-page-with-explicit-save-workflow.md)
