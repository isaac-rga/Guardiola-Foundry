---
type: Workflow Guide
title: Guardiola Foundry Workflows
description: Documents the implemented Guardiola Foundry workflows for authentication, Product management, soft-delete/restore, local issue tracking, and scheduled OpenWiki updates.
tags: [workflows, products, auth, issue-tracker, openwiki]
---

# Guardiola Foundry Workflows

This page describes behavior that spans multiple source areas. Use [Architecture](architecture.md) for component boundaries and [Domain Concepts](domain.md) for the vocabulary behind the rules.

## Authentication and session workflow

Users sign in through `POST /auth/login`, implemented by `AuthController.login` and `signIn` in `apps/api/app/modules/auth/auth_service.ts`. Email addresses are normalized by the `User` model before lookup, inactive users cannot sign in, failed attempts are recorded in `login_attempts`, and five failed attempts lock the email for 15 minutes.

Successful sign-in creates a raw bearer token for the client and stores only its SHA-256 hash in `access_tokens`. `GET /auth/me` validates a bearer token and returns the current session contract; `POST /auth/logout` revokes the current token; `POST /auth/change-password` requires the current password, updates the password, and revokes all active tokens for the user.

The web `/app` route uses this workflow before rendering the authenticated shell. `AuthenticatedAppShell` then provides session state to Product pages through `useAppShell`, so [Product management workflows](#product-management-workflows) depend on valid auth state and role data.

## Product management workflows

Product management is implemented across API module `apps/api/app/modules/products`, web feature `apps/web/src/features/products`, Product routes under `apps/web/src/routes/app.products*`, and shared contracts in `packages/shared-*`.

### List and create Products

`GET /products` returns products newest-first plus sorted collections. The API excludes soft-deleted Products by default; admins can request `includeDeleted=true`, and non-admins cannot enable that behavior because `ProductsController.index` combines the query flag with the authenticated user's role.

`POST /products` requires a name and accepts optional lifecycle status, product status, and collection. The service trims names, defaults Lifecycle Status to `concept`, defaults Product Status to `active`, sets Product Category and Short Description to `null`, generates a short `P-XXXXXX` Product ID, and records the creating user. Duplicate Product Names are allowed by the API; the web shows a live case-insensitive warning using `findDuplicateProductName` rather than blocking submission.

### Edit Products

`GET /products/:productId` loads by public Product ID with relations. Active products return `{ state: 'active', product, collections }` so the edit page can populate editable fields and collection choices. Deleted products return `{ state: 'deleted', product }` and are shown through a read-only recovery page.

`PUT /products/:productId` updates Product Name, Short Description, Lifecycle Status, Product Status, Product Category, Collection, and optional image state. The web sends `FormData` through `features/products/api/endpoints.ts`; the API normalizes blank optional fields to `null`, accepts one image (`jpg`, `jpeg`, `png`, or `webp`) up to 5 MB, stores image files under `tmp/product-images`, and deletes the old stored file when replacing or removing an image.

The edit page blocks navigation with `useBlocker` while form or image changes are pending, updates React Query detail/list caches on save, and keeps immutable Created By, Created At, and Product ID metadata visible.

### Soft-delete and restore Products

`DELETE /products/:productId` soft-deletes only active Products by setting `deletedAt` through the `SoftDelete` mixin and also sets Product Status to `inactive`. Normal Lucid find/fetch queries exclude deleted rows unless a model uses `queryWithDeleted()`.

`POST /products/:productId/restore` is admin-only. Restoring clears `deletedAt`, sets Product Status to `inactive`, and returns no content. The web invalidates both default and include-deleted Product list caches after restore. This workflow is tied to [Domain Concepts](domain.md#product-concepts): deletion removes Products from ordinary views without destroying their recovery record.

## Local issue workflow

The repository tracks local issues in `.scratch/` rather than a remote tracker. `docs/agents/issue-tracker.md` defines one feature directory per slice, a `.scratch/<feature>/PRD.md`, and numbered `.scratch/<feature>/issues/<NN>-<slug>.md` files. Recent Product work moved `.scratch/product-management/PRD.md` to `Status: done`; `Status: done` means no next actor is expected and is separate from triage labels.

Use this workflow before changing code: read the relevant PRD/issue, inspect the current source and [Source Map](source-map.md), implement narrowly, then update status/comments only when asked or when the issue process requires it.

## OpenWiki maintenance workflow

`.github/workflows/openwiki-update.yml` runs on `workflow_dispatch` and daily at 08:00 UTC. It installs OpenWiki globally, runs `openwiki code --update --print`, and opens a pull request for changes under `openwiki`, `AGENTS.md`, `CLAUDE.md`, and the workflow file.

Generated wiki pages should not be hand-edited during normal engineering unless explicitly requested. Source changes should be documented by future OpenWiki update runs, and [Operations and Testing](operations-testing.md) should be used to verify behavior before relying on documentation updates.
