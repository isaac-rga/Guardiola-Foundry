# Add deleted Product page states and nonexistent Product handling

Status: ready-for-agent

## Parent

- [PRD](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/product-management/PRD.md)

## What to build

Make direct Product routes distinguish clearly between deleted records and nonexistent records. This slice should add the deleted-Product page state, keep deleted Product pages read-only until recovery, show a removed-record message to non-admin users who reach a deleted Product, and preserve a separate normal not-found path for Product IDs that do not exist at all.

## Acceptance criteria

- [ ] A deleted Product route renders a deleted-record page state instead of behaving like a normal editable Product page, and that deleted state is read-only until recovery behavior is added.
- [ ] A non-admin user who reaches a deleted Product by URL sees a removed-record message explaining that an admin is required for recovery.
- [ ] Focused API and web tests verify the distinct deleted-record and nonexistent-record behaviors, including read-only deleted Product pages and normal not-found handling for Product IDs that do not exist.

## Blocked by

- [07 - Add Product soft delete and hidden-by-default behavior](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/product-management/issues/07-add-product-soft-delete-and-hidden-by-default-behavior.md)
