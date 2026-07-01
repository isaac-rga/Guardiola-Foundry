# Add the Product edit page with explicit save workflow

Status: ready-for-agent

## Parent

- [PRD](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/product-management/PRD.md)

## What to build

Add the dedicated Product page as the primary editing surface for a Product record, excluding image handling for now. The page should load directly by short `Product ID`, show low-emphasis immutable metadata, expose editable core fields and product state, and use explicit save behavior with inline validation, cancel/back behavior, and an unsaved-changes warning so users can enrich Product records safely over time.

## Acceptance criteria

- [ ] A user can open a Product directly by `Product ID`, edit `Product name`, `Product category`, `Short product description`, `Collection`, `Lifecycle Status`, and `Product Status`, and save those changes explicitly from the Product page.
- [ ] The Product page shows low-emphasis immutable metadata for `Product ID`, `Created by`, and `Created at`, survives direct navigation and browser refresh, and warns before losing unsaved changes when the user leaves with pending edits.
- [ ] Focused API and web tests verify direct Product-page loading, explicit save behavior, inline validation, optional fields remaining optional, metadata visibility, and unsaved-changes protection.

## Blocked by

- [01 - Establish the Product domain and create workflow](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/product-management/issues/01-establish-the-product-domain-and-create-workflow.md)
