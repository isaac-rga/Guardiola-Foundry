# Add list-level Product status toggles and preserved return context

Status: ready-for-agent

## Parent

- [PRD](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/product-management/PRD.md)

## What to build

Support lightweight Product state management from the working list and keep the list practical for repeated editing passes. This slice should add `Active`/`Inactive` row actions directly on the list and preserve the user’s current working-list context when they navigate into a Product and return, so they can continue from the same practical place.

## Acceptance criteria

- [ ] A user can change `Product Status` between `Active` and `Inactive` directly from row actions in the Product list without opening the Product page, and inactive Products remain editable later.
- [ ] When a user opens a Product from the list and returns, the list preserves its practical working context, including the current search/filter state.
- [ ] Focused API and web tests verify row-level active/inactive mutations, preserved list context across navigation to and from the Product page, and continued editability of inactive Products.

## Blocked by

- [02 - Ship the Product working list with search and filters](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/product-management/issues/02-ship-the-product-working-list-with-search-and-filters.md)
- [03 - Add the Product edit page with explicit save workflow](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/product-management/issues/03-add-the-product-edit-page-with-explicit-save-workflow.md)
