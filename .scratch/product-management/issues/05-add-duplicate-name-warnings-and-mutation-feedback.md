# Add duplicate-name warnings and mutation feedback

Status: ready-for-agent

## Parent

- [PRD](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/product-management/PRD.md)

## What to build

Make Product mutations feel safe and informative without adding friction. This slice should add live duplicate-name warnings to both create and edit, while keeping them non-blocking, and standardize request feedback so mutating controls disable while requests are in flight and show visible pending feedback plus lightweight success confirmation when the action completes.

## Acceptance criteria

- [ ] The create modal and Product page both show a live duplicate-name warning for matching active Products while the user types, using the agreed semantics: case-insensitive matching, trimmed-edge normalization, and ignoring soft-deleted records.
- [ ] Duplicate-name warnings never block create or save, and mutating controls disable with visible pending feedback while create, save, and other Product state mutations are in flight.
- [ ] Focused API and web tests verify duplicate-warning semantics, non-blocking behavior, disabled pending states, and lightweight success feedback for Product mutations introduced by this slice.

## Blocked by

- [01 - Establish the Product domain and create workflow](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/product-management/issues/01-establish-the-product-domain-and-create-workflow.md)
- [03 - Add the Product edit page with explicit save workflow](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/product-management/issues/03-add-the-product-edit-page-with-explicit-save-workflow.md)
