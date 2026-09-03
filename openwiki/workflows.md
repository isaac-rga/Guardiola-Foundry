---
type: Workflow Guide
title: Guardiola Foundry Workflows
description: Documents implemented Guardiola Foundry workflows for authentication, Product management, Materials import/listing, endpoint adapters, soft deletion, and local issue handoff practices.
tags: [workflows, auth, products, materials, soft-delete]
---

# Guardiola Foundry Workflows

This page describes behavior that spans multiple source areas. Use [Architecture](./architecture.md) for component boundaries, [Domain Concepts](./domain.md) for vocabulary, [Source Map](./source-map.md) for file lookup, and [Operations and Testing](./operations-testing.md) for verification.

## Authentication and session workflow

Users sign in through `POST /auth/login`, implemented by `AuthController.login` and `signIn` in `apps/api/app/modules/auth/auth_service.ts`. Email addresses are normalized before lookup, inactive users cannot sign in, failed attempts are stored in `login_attempts`, and five failed attempts lock the email for 15 minutes.

Successful sign-in creates a raw bearer token for the client and stores only its SHA-256 hash in `access_tokens`. `GET /auth/me` validates a bearer token and returns the current session contract; `POST /auth/logout` revokes the current token; `POST /auth/change-password` requires the current password, updates the password, and revokes all active tokens for the user.

The web `/app` route depends on this workflow. `requireCurrentAuthSession()` loads the stored session, calls `GET /auth/me`, refreshes localStorage if valid, or redirects to `/sign-in` if invalid. `AuthenticatedAppShell` then exposes the session through `useAppShell()`, so Product and Materials pages can call feature endpoint adapters with the bearer token.

## Product management workflows

Product API behavior lives in `apps/api/app/modules/products/products_service.ts` behind `ProductsController` and routes in `apps/api/start/routes.ts`. The Product web feature lives in `apps/web/src/features/products`.

Current Product capabilities include list, create, active/deleted detail, update with optional image upload/removal, soft delete, and admin-only restore. The web Product list owns search and filters for name, lifecycle, status, category, collection, and admin include-deleted state. The create dialog validates with shared Zod schemas and shows duplicate-name warnings, but duplicate names remain allowed. The Product detail page handles active edit state, deleted read-only state, true not-found state, image changes, delete confirmation, and admin restore.

Recent branch history matters here: Product commits added duplicate-name warnings, soft delete, deleted-record page states, admin restore, denser list layout, and a refactor that moved Product endpoint calls into `apps/web/src/features/products/api/endpoints.ts`. That endpoint locality is an integration point with [Architecture](./architecture.md#web-structure): Product-specific schema parsing, bearer headers, multipart payloads, and query strings belong to the feature adapter, while `apps/web/src/lib/api/transport.ts` only owns shared URL and error-message helpers.

## Materials import and list workflow

Materials were planned in `.scratch/materials/PRD.md` and `docs/adr/0002-separate-materials-and-supplies.md`, then implemented across recent `feature/materials` commits. The workflow is intentionally read-only in the app.

The backend persistence model is MaterialSource for vendor/source data, Material for textile identity, and MaterialSourceLink for Material-to-Source links with one preferred link. `importMaterialsFromRows()` imports Sources first, imports Materials only when all linked legacy Source IDs resolve, preserves legacy spreadsheet IDs internally, generates app-owned public IDs, rebuilds links on re-import, and marks the first linked Source as Preferred Source. In the current fixture, `MAT-999` is deliberately skipped because it references unresolved `SRC-MISSING`.

`GET /materials` is authenticated for admins and operators. `listMaterials()` loads active Materials, preloads Source links ordered by sort order, includes soft-deleted Sources in the preload, and serializes a lean table summary. The response does not expose legacy IDs, textile family, purchase unit, or other Source technical fields. `derivedUnitCostCents` comes from the Preferred Source. If the Preferred Source is soft-deleted, the Material remains listed and `preferredSource.needsAttention` is true.

The web Materials route (`/app/materials`) renders loading, error, empty, or table states. The table columns are Material ID, name, Material Color, Material Use, Material Unit, Preferred Source, derived cost, alternate Source count, and compact comments. It intentionally omits create/edit/delete/restore controls, Source detail fields, search, filters, pagination, dashboards, and bulk actions.

## Soft-delete workflow pattern

The reusable soft-delete behavior in `apps/api/app/mixins/soft_delete.ts` underpins both Product recovery and future Material/Source lifecycle safety. Default Lucid find/fetch queries hide rows with `deleted_at`. Use `queryWithDeleted()` only when a workflow explicitly needs deleted rows, such as Product detail state detection, Product ID collision checks, admin include-deleted lists, restore, Materials import reconciliation, or Preferred Source attention serialization.

Because [Domain Concepts](./domain.md#product-deletion-semantics) distinguish Product Status from deletion, do not replace soft delete with status filtering or hard deletion. For Materials, soft deletion exists now mostly to protect future Bills of Materials and Inventory references.

## Local issue and handoff workflow

Local PRDs and issues live under `.scratch/<feature>/`. `docs/agents/issue-tracker.md` defines the convention: a `PRD.md` plus numbered issue files under `issues/`, with `Status:` tracking and optional comments.

`changes.md` is the current slice handoff. It has been updated by recent commits to explain why Product endpoint locality changed and how Materials evolved from persisted API to table route, attention states, and cleanup boundaries. When starting a change, read `changes.md` plus the relevant `.scratch` PRD/issue before editing code. When completing a change, update `changes.md` with source anchors, behavior notes, tests run, and out-of-scope boundaries.
