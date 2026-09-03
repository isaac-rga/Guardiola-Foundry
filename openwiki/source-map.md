---
type: Source Map
title: Guardiola Foundry Source Map
description: Practical source navigation map for Guardiola Foundry, connecting repository areas, domains, routes, tests, and operational files to the code wiki concepts.
tags: [source-map, navigation, repository]
---

# Guardiola Foundry Source Map

Use this map to move from the wiki to source files. It complements [Architecture](./architecture.md), [Domain Concepts](./domain.md), [Workflows](./workflows.md), and [Operations and Testing](./operations-testing.md).

## Root and repository policy

- `README.md` — setup and run instructions; prefer current source and tests for detailed module status.
- `package.json` — root scripts for dev, build, lint, typecheck, tests, and database commands.
- `pnpm-workspace.yaml` — workspace package discovery.
- `changes.md` — latest slice handoff note; recent branch commits contain earlier snapshots that explain Product and Materials progression.
- `CONTEXT.md` — canonical business vocabulary summarized in [Domain Concepts](./domain.md).
- `docs/adr/0001-token-based-auth.md` — auth/session design.
- `docs/adr/0002-separate-materials-and-supplies.md` — Materials vs Supplies and Preferred Source decisions.
- `docs/adr/architecture-policy.md` — layered-vs-hexagonal policy used by [Architecture](./architecture.md).
- `docs/architecture/shared-types-and-validation.md` — shared package organization rules.
- `.scratch/` — local PRDs and issues; see the local issue workflow in [Workflows](./workflows.md).

## API application

- `apps/api/start/routes.ts` — route table for health, auth, Materials, and Products.
- `apps/api/app/modules/auth/` — auth controller, bearer-token parsing, sign-in/session/password-change service.
- `apps/api/app/modules/products/` — Product controller and service for list/create/show/update/delete/restore workflows.
- `apps/api/app/modules/materials/` — Materials controller, list service, and spreadsheet-row importer.
- `apps/api/app/models/` — Lucid models for User, AccessToken, LoginAttempt, Collection, Product, Material, MaterialSource, and MaterialSourceLink.
- `apps/api/app/mixins/soft_delete.ts` — reusable soft-delete behavior described by [Architecture](./architecture.md) and used in Product/Materials [Workflows](./workflows.md).
- `apps/api/database/migrations/` — database migrations for users, tokens, login attempts, collections, products, product image/soft-delete fields, and materials tables.
- `apps/api/database/fixtures/materials_import_fixture.ts` — spreadsheet-shaped Materials/Source fixture used by importer, seeder, and tests.
- `apps/api/tests/functional/` — API tests for auth, Products, Materials list, and Materials importer.

## Web application

- `apps/web/src/router.tsx` and `apps/web/src/routeTree.gen.ts` — TanStack Router setup and generated route tree.
- `apps/web/src/routes/app.tsx` — authenticated `/app` boundary and app-shell session bootstrap.
- `apps/web/src/routes/sign-in.tsx` and `apps/web/src/features/auth/sign-in-page.tsx` — sign-in route and UI.
- `apps/web/src/features/app-shell/authenticated-app-shell.tsx` — shared authenticated shell, navigation, account menu, shell context.
- `apps/web/src/features/products/product-management-page.tsx` — Product list, filters, include-deleted toggle for admins, create dialog, duplicate-name warning, create feedback.
- `apps/web/src/features/products/product-edit-page.tsx` — Product detail/edit, deleted-record page state, image handling, delete/restore flows.
- `apps/web/src/features/products/api/endpoints.ts` — feature-local Product endpoint adapter.
- `apps/web/src/features/materials/materials-page.tsx` — lean read-only Materials table and route states.
- `apps/web/src/features/materials/api/endpoints.ts` and `query-keys.ts` — Materials endpoint adapter and query key.
- `apps/web/src/features/app-shell/workspace-pages.tsx` — placeholder pages for Home, Inventory, and Bills of Materials.
- `apps/web/src/lib/api/transport.ts` — shared URL/error helper reused by auth and feature endpoint adapters.
- `apps/web/src/lib/auth/` — localStorage session persistence and current-session bootstrap.
- `apps/web/src/routes/-*.test.tsx` — route-level Vitest coverage for app shell, sign-in, Products, and Materials.

## Shared packages

- `packages/shared-types/src/index.ts` — health, auth, Product contracts plus Materials re-export.
- `packages/shared-types/src/materials.ts` — Materials table-summary contracts and controlled Material values.
- `packages/shared-validation/src/index.ts` — Zod schemas for health, auth, Product contracts plus Materials re-export.
- `packages/shared-validation/src/materials.ts` — Materials Zod schemas.

When changing shared contracts, update both packages and then follow the [Operations and Testing](./operations-testing.md) guidance for API, web, typecheck, and route/functional tests.

## Test map

API tests live under `apps/api/tests/functional` for auth, Products, Materials list, and Materials importer. Web route tests live in `apps/web/src/routes/-app.test.tsx`, `-sign-in.test.tsx`, `-products.test.tsx`, and `-materials.test.tsx`.
