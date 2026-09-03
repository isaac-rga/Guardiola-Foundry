---
type: Domain Reference
title: Guardiola Foundry Domain Concepts
description: Canonical business-domain reference for Guardiola Foundry, including identity roles, Products, Materials, Sources, soft deletion, controlled values, and deferred ERP concepts.
tags: [domain, products, materials, auth, erp]
---

# Guardiola Foundry Domain Concepts

The canonical vocabulary lives in `CONTEXT.md`. This page summarizes the concepts that are implemented, planned, or important for current code. Keep changes aligned with [Workflows](./workflows.md), [Architecture](./architecture.md), and shared contracts in `packages/shared-types` / `packages/shared-validation`.

## Identity and access

A **User** signs in with an Email Address. Email matching is case-insensitive because the `User` model normalizes email addresses before persistence and lookup. An **Active User** can authenticate; inactive users remain as records but cannot sign in.

Roles are `admin` and `operator`. Admin can include deleted Products in list responses and is required for Product restore. Operator is a normal authenticated user role that can use implemented app workflows except admin-only restore. The [authentication workflow](./workflows.md#authentication-and-session-workflow) carries role and active state in the session contract.

A **Password Change** is authenticated and requires the current password. It is distinct from future **Password Recovery**, which is not implemented.

## Product model

A **Product** is a bridal design record moving from concept toward manufacturing readiness. Products are distinct from Materials consumed to produce them and from any later sellable SKU.

Important Product fields and rules:

- **Product ID** is an app-generated public ID with a `P-` prefix and six-character token.
- **Product Name** is required, may repeat, and uses warning-only duplicate matching in the web app.
- **Collection** is an optional annual grouping seeded in the database and returned with Product list/detail responses.
- **Product Category** is `dress`, `accessory`, `other`, or null. Null means no category assigned; `other` is intentional.
- **Lifecycle Status** tracks product-development stage; **Product Status** tracks active/inactive availability.
- **Product Image** is optional and currently limited to one stored image reference on Product detail.
- **Created By** and **Created At** are immutable registration metadata surfaced in Product summaries/details.

Product [workflows](./workflows.md#product-management-workflows) are backed by shared contracts, Lucid models, feature-local web endpoint adapters, and route-level tests.

## Product deletion semantics

Product deletion is soft deletion, not hard deletion. The `SoftDelete` mixin hides deleted rows from ordinary queries while retaining recoverability and history. Deleting a Product sets `deletedAt` and forces Product Status to inactive. Deleted Products are hidden from default Product lists, but admins can request `includeDeleted=true` and restore deleted Products.

`GET /products/:productId` returns a discriminated response: `state: 'active'` with editable detail and collections, or `state: 'deleted'` with read-only deleted detail. Unknown IDs still return not found. This distinction is central to the Product page states described in [Workflows](./workflows.md#product-management-workflows).

## Materials and Sources

The Materials domain is grounded in `docs/adr/0002-separate-materials-and-supplies.md`, `.scratch/materials/PRD.md`, current `changes.md`, and the implemented Materials source files.

A **Material** is a stable textile input that can later be referenced by Bills of Materials. It is not a Product, Supply, Tool, Source, or generic item. Material identity includes app-owned public Material ID (`M-` prefix), legacy spreadsheet Material ID, name, controlled Material Color, controlled Material Use, normalized Meter unit, compact comments, and soft deletion.

A **Source** is a vendor-specific purchasing offering. For Materials, persisted Source data includes app-owned public Source ID (`MS-`), legacy spreadsheet Source ID, name, provider, textile family, purchase unit, normalized unit cost, normalized unit, and soft deletion. Source technical fields and Source detail screens are intentionally not exposed in the first Materials table.

A **Preferred Source** is the default purchasing and cost basis for a Material. The first imported linked Source becomes Preferred Source; remaining links become alternate Sources. Material cost is derived from the Preferred Source normalized cost, not copied onto Material. If a Preferred Source is soft-deleted, the Material remains visible and `preferredSource.needsAttention` becomes true.

The read-only Materials list is Material-first: one row per Material, not one row per Source. This domain rule is enforced by the Materials [workflow](./workflows.md#materials-import-and-list-workflow), shared Materials contracts, API tests, and web route tests.

## Deferred ERP concepts

**Supply** is a separate future concept for non-textile production inputs such as boning, thread, zippers, buttons, cups, trims, and similar consumables. Supplies are intentionally separate from Materials because units, purchasing process, and inventory handling differ.

**Inventory** is the future on-hand stock position for Material, tracked by warehouse positions and movements. **Bill of Materials** is a future Product-structure concept for defining inputs needed to build a Product. Both are present in vocabulary and app-shell navigation, but current source only has placeholder pages. See the [Quickstart backlog](./quickstart.md#backlog) before folding these concepts into Materials.
