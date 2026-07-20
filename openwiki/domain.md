---
type: Domain Reference
title: Guardiola Foundry Domain Concepts
description: Canonical business and product-domain reference for Guardiola Foundry, including identity roles, Product records, Product statuses, collections, images, soft deletion, and unimplemented ERP concepts.
tags: [domain, products, auth, erp]
---

# Guardiola Foundry Domain Concepts

The canonical vocabulary lives in `CONTEXT.md`; this page summarizes the concepts that are implemented or already visible in code. Keep changes aligned with [Product workflows](workflows.md#product-management-workflows) and shared contracts in `packages/shared-types` / `packages/shared-validation`.

## Identity and access concepts

A **User** signs in with an Email Address and has a role. Email Address matching is case-insensitive because `User.normalizeEmailAddress` trims and lowercases values before persistence and lookup.

Roles are currently `admin` and `operator`. Admin is an authorization role, not a separate identity type; it is required for restoring deleted Products and can include deleted Products in list responses. Operator is a normal authenticated user role and can create, list, edit, and soft-delete Products but cannot restore deleted Products.

An **Active User** is allowed to authenticate. Inactive users remain as records but cannot sign in. Password Change is an authenticated flow that requires the current password and revokes active tokens after success; do not confuse it with future Password Recovery.

## Product concepts

A **Product** is a bridal design record moving through development from concept to manufacturing readiness. It is distinct from Materials, Inventory, and sellable SKUs. In source, the `Product` model persists the record and `ProductSummary`, `ProductDetail`, and `DeletedProductDetail` describe API shapes.

A **Product ID** is a short generated public identifier such as `P-AB12CD`. It is stable, read-only to users, used in routes, and distinct from the editable Product Name.

A **Product Name** is required and human-readable. Names are trimmed but not unique: duplicate names are allowed, and the UI warns case-insensitively for active Product matches instead of blocking creation or editing. Duplicate warnings intentionally ignore soft-deleted Products.

A **Lifecycle Status** describes product-development stage. The current allowed values are `concept`, `fabric-trim-selection`, `design-and-prototyping`, `testing`, `approved`, `on-documentation`, and `finished`; new Products default to `concept`.

A **Product Status** is operational availability, currently `active` or `inactive`. It is separate from Lifecycle Status, defaults to `active`, becomes `inactive` on soft-delete, and remains `inactive` when an admin restores the Product.

A **Product Category** is optional and can be `dress`, `accessory`, or `other`. `other` is an intentional category; `null` means no category has been assigned yet.

A **Collection** is an annual design grouping such as `2025`, `2026`, or `2027`. Products may have no Collection in the current scope. Collections are listed with Product responses but are not casually created during normal Product editing.

A **Product Image** is a single optional primary reference image. The current implementation stores file metadata on the Product and stores uploaded files under API `tmp/product-images`; there is not yet provider-backed storage or galleries.

**Created By** and **Created At** are immutable registration metadata shown on the edit page. They identify who initially registered a Product and when, not future change history.

## Soft deletion and recovery

Soft-deleted Products are preserved with `deletedAt` rather than physically removed. The `SoftDelete` Lucid mixin excludes deleted rows from normal queries and provides `queryWithDeleted()` for explicit recovery/listing flows. This lifecycle is surfaced by [Product workflows](workflows.md#soft-delete-and-restore-products): deleted Products are read-only in the web UI until an admin restores them.

## Adjacent ERP concepts not yet implemented

`CONTEXT.md` also defines Material, Inventory, Warehouse Position, and Bill of Materials. The authenticated shell has placeholder navigation for Materials, Inventory, and Bills of Materials, but the API and domain workflows for those areas are not implemented yet. Keep them in the [Quickstart backlog](quickstart.md#backlog) until source code establishes real behavior.
