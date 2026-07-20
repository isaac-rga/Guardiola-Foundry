---
type: Source Map
title: Guardiola Foundry Source Map
description: Compact source navigation map for Guardiola Foundry, linking major repository areas to architecture, workflows, domain concepts, operations, and tests.
tags: [source-map, navigation, repository]
---

# Guardiola Foundry Source Map

Use this map to move from the generated wiki to source files. It complements [Architecture](architecture.md), [Workflows](workflows.md), [Domain Concepts](domain.md), and [Operations and Testing](operations-testing.md).

## Root and repository policy

- `package.json` — workspace engine requirements and root scripts for dev, build, lint, typecheck, test, and database operations.
- `pnpm-workspace.yaml` — workspace package discovery.
- `AGENTS.md` — repository coding, architecture, verification, issue tracker, and OpenWiki guidance.
- `docs/adr/architecture-policy.md` — layered-vs-hexagonal decision policy.
- `docs/architecture/shared-types-and-validation.md` — shared contract organization rules.
- `.scratch/` — local PRDs and issues; see [workflow notes](workflows.md#local-issue-workflow).
- `.github/workflows/openwiki-update.yml` — scheduled/manual OpenWiki PR generation.

## API app

- `apps/api/start/routes.ts` — HTTP route table for health, auth, and Products.
- `apps/api/app/modules/auth/auth_service.ts` and `controllers/auth_controller.ts` — sign-in, token, logout, password-change, and session behavior.
- `apps/api/app/modules/products/products_service.ts` and `controllers/products_controller.ts` — Product list/create/show/update/delete/restore behavior.
- `apps/api/app/models/product.ts`, `collection.ts`, `user.ts`, `access_token.ts`, `login_attempt.ts` — Lucid models behind the implemented domain.
- `apps/api/app/mixins/soft_delete.ts` — reusable soft-delete query filter and restore behavior.
- `apps/api/database/migrations/` and `apps/api/database/schema.ts` — database schema history/generated schema.
- `apps/api/tests/functional/products/create_products.spec.ts` — main Product API regression suite.

## Web app

- `apps/web/src/routes/app.tsx` — authenticated app route loader and shell wiring.
- `apps/web/src/features/app-shell/authenticated-app-shell.tsx` — sidebar navigation, account menu, session context, sign-out, and settings entry.
- `apps/web/src/routes/app.products.tsx`, `app.products.index.tsx`, `app.products.$productId.tsx` — Product route composition and search-param feedback.
- `apps/web/src/features/products/product-management-page.tsx` — Product list, create dialog, filters, duplicate warning, and include-deleted toggle.
- `apps/web/src/features/products/product-edit-page.tsx` — Product edit, image state, unsaved-change guard, delete, deleted-read-only view, and restore actions.
- `apps/web/src/features/products/api/endpoints.ts` — Product-specific HTTP helpers and shared-schema parsing.
- `apps/web/src/lib/api/transport.ts` — cross-feature API URL and error-message helpers.
- `apps/web/src/routes/-products.test.tsx` — Product route/UI regression tests.

## Shared packages and domain language

- `packages/shared-types/src/index.ts` — API/web TypeScript contracts for health, auth sessions, Products, and request/response DTOs.
- `packages/shared-validation/src/index.ts` — Zod schemas for those contracts.
- `CONTEXT.md` — canonical business terms for Users, roles, Product, Collection, Product Category, Product Image, Product Name, Product ID, lifecycle/status, Materials, Inventory, Warehouse Position, and Bills of Materials.

## Operational files

- `compose.yaml` and `docker/` — local Postgres setup.
- `apps/api/.env.example` and `apps/web/.env.example` — non-secret configuration templates.
- `apps/api/package.json` and `apps/web/package.json` — app-specific build/test/lint/typecheck commands.
