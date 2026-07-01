# Add admin deleted filter and restore workflow

Status: ready-for-agent

## Parent

- [PRD](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/product-management/PRD.md)

## What to build

Complete the recoverable-delete workflow for admins. This slice should let admins opt into viewing deleted Products from the Product list, see deleted records only when explicitly requested, and restore a deleted Product from its deleted Product page so the record returns to normal editable mode with its previous lifecycle status preserved and `Product Status = Inactive`.

## Acceptance criteria

- [ ] Admin users have an admin-only list control to include deleted Products, while non-admin users still cannot access deleted-record visibility through normal list usage.
- [ ] A deleted Product page for an admin exposes `Restore` instead of `Delete`, and restoring the Product returns it to normal editable mode with the previous `Lifecycle Status` preserved and `Product Status = Inactive`.
- [ ] Focused API and web tests verify admin-only deleted-record visibility, restore behavior, and the role-based access rules that keep deleted Product recovery unavailable to non-admin users.

## Blocked by

- [07 - Add Product soft delete and hidden-by-default behavior](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/product-management/issues/07-add-product-soft-delete-and-hidden-by-default-behavior.md)
- [08 - Add deleted Product page states and nonexistent Product handling](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/product-management/issues/08-add-deleted-product-page-states-and-nonexistent-product-handling.md)
