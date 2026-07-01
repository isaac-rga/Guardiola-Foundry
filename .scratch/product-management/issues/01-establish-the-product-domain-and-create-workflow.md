# Establish the Product domain and create workflow

Status: ready-for-agent

## Parent

- [PRD](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/product-management/PRD.md)

## What to build

Deliver the first complete Product registration path across persistence, API, and web so `/app/products` can create real bridal-design Product records from the lightweight modal. This slice should establish the Product domain seam at the same time: a short stable `Product ID`, immutable creation metadata, separate `Lifecycle Status` and `Product Status`, optional `Collection` from prefilled reference data, and the agreed defaults of `Concept` and `Active` for fast creation.

## Acceptance criteria

- [ ] A user can open the create modal from `/app/products`, create a Product by entering only `Product name`, and get a persisted Product with `Lifecycle Status = Concept` and `Product Status = Active` unless they explicitly choose different allowed values.
- [ ] Created Products receive a short stable `Product ID`, immutable `Created by` and `Created at` metadata, and optional `Collection` linkage to controlled reference data without requiring collection management in this slice.
- [ ] Focused API and web tests verify the create flow end-to-end, including persisted defaults, allowed overrides for lifecycle and product status, and immediate visibility of the new Product in the working list after success.

## Blocked by

None - can start immediately
