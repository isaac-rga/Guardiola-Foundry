# Ship the Product working list with search and filters

Status: ready-for-agent

## Parent

- [PRD](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/product-management/PRD.md)

## What to build

Turn `/app/products` into a real operational Product list that loads the visible Product set in full and supports simple client-side retrieval. The list should present one row per Product with a compact table structure: Product name with optional collection badge, combined lifecycle/product-status badges, combined creation context, prominent name search, single-select filters, newest-first ordering, and a clear empty state when nothing matches.

## Acceptance criteria

- [ ] `/app/products` renders a full Product list ordered newest first with one row per Product and the agreed compact columns for Product name plus collection, state badges, creation context, and row actions.
- [ ] Users can search by `Product name` and use single-select filters for `Lifecycle Status`, `Product Status`, `Product Category`, and `Collection`, including explicit `No collection` and `No category` options, with filtering performed client-side on the loaded visible Product set.
- [ ] Focused API and web tests verify list rendering, newest-first ordering, prominent name search behavior, single-select filters, empty-state behavior, and the compact display of collection and state badges.

## Blocked by

- [01 - Establish the Product domain and create workflow](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/product-management/issues/01-establish-the-product-domain-and-create-workflow.md)
