---
type: Architecture Overview
title: Guardiola Foundry Architecture
description: Explains the Guardiola Foundry monorepo architecture, including the AdonisJS API, React authenticated shell, shared contract packages, authentication boundary, Product data flow, and web API transport refactor.
tags: [architecture, api, web, contracts, auth]
---

# Guardiola Foundry Architecture

The system uses a simple layered monorepo architecture. The root workspace coordinates `apps/api`, `apps/web`, `packages/shared-types`, and `packages/shared-validation`; this structure is governed by `AGENTS.md` and `docs/adr/architecture-policy.md`, which prefer direct layered implementations for CRUD/MVP flows and reserve hexagonal or DDD seams for richer business-rule or integration complexity.

## Runtime shape

- `apps/api` is an AdonisJS 7 API with Lucid ORM and PostgreSQL. Routes are registered in `apps/api/start/routes.ts` and dispatch to modules under `apps/api/app/modules`.
- `apps/web` is a React 19/Vite client using TanStack Router and Query. File routes under `apps/web/src/routes` compose feature components under `apps/web/src/features`.
- `packages/shared-types` defines cross-boundary TypeScript contracts such as auth session responses and Product DTOs.
- `packages/shared-validation` defines Zod schemas used by both the API and web client to parse or validate those contracts.

[Product workflows](workflows.md#product-management-workflows) are the best current example of this architecture: API routes call `ProductsController`, the controller validates request payloads with shared Zod schemas, the service uses Lucid models, and the web feature consumes typed endpoint helpers.

## API modules and routes

`apps/api/start/routes.ts` exposes:

- `GET /health`
- `POST /auth/login`, `POST /auth/logout`, `POST /auth/change-password`, `GET /auth/me`
- `GET /products`, `POST /products`, `GET /products/:productId`, `PUT /products/:productId`, `DELETE /products/:productId`, `POST /products/:productId/restore`

The API currently uses per-controller authentication checks rather than global middleware for Product routes. `ProductsController` extracts bearer tokens, calls `getCurrentSession`, loads the `User`, and returns `401` when no valid session exists. Restore is additionally role-gated to admins in `ProductsController.restore`.

## Authentication boundary

Authentication is implemented in `apps/api/app/modules/auth`. `auth_service.ts` normalizes email addresses, tracks failed login attempts, locks out after five failures for 15 minutes, hashes access tokens with SHA-256 before persistence, uses 30-day bearer tokens, and revokes all active tokens after password change. `AuthController` maps service outcomes to HTTP responses.

The web route `/app` depends on [domain role concepts](domain.md#identity-and-access-concepts): `apps/web/src/routes/app.tsx` loads a current auth session before rendering `AuthenticatedAppShell`, and the shell exposes session, sign-out, and password-change handlers through `useAppShell`.

## Product data flow

Product persistence centers on `Product` and `Collection` Lucid models. `Product` composes the reusable `SoftDelete` mixin, stores a generated `publicId`, lifecycle/product status, optional category, optional collection, immutable creator metadata, optional image file metadata, and timestamps. `products_service.ts` generates `P-` IDs, loads relations, serializes shared DTOs, writes image files under `tmp/product-images`, and uses `queryWithDeleted()` only where deleted records are intentionally included.

This flow depends on [Domain Concepts](domain.md#product-concepts) for business meaning: Product ID is stable and read-only, Product Name may duplicate, Product Status is separate from Lifecycle Status, and soft-deleted products leave normal views but can be recovered by admins.

## Web feature boundaries and API transport

A recent refactor moved Product HTTP helpers from `apps/web/src/lib/api/products.ts` into `apps/web/src/features/products/api/endpoints.ts` and extracted shared transport helpers into `apps/web/src/lib/api/transport.ts`. The feature-level endpoint module owns Product-specific routes, request construction, schema parsing, and cache-facing return types; `transport.ts` owns cross-cutting URL resolution and response error-message extraction.

That split supports the repository DRY guidance in `AGENTS.md`: isolate systemic concerns such as API URL construction and error extraction at an architectural boundary, while keeping Product-specific API knowledge in the Product feature. Future feature endpoints should reuse `resolveApiUrl` and `getResponseErrorMessage` rather than reimplementing them.

## Shared contracts

`packages/shared-types/src/index.ts` and `packages/shared-validation/src/index.ts` currently hold all shared contracts in single files. `docs/architecture/shared-types-and-validation.md` says future shared code should be organized by business domain, keep common concepts small, and prefer schemas as the source of truth when practical. Because [Product workflows](workflows.md#product-management-workflows) parse API responses with shared schemas on the web and validate request payloads in the API, contract changes should be coordinated with tests on both sides.
