---
type: Repository Guide
title: Guardiola Foundry OpenWiki Quickstart
description: Entry point for the Guardiola Foundry ERP code wiki, covering setup, current module status, documentation map, and practical next steps for engineers and future agents.
tags: [quickstart, monorepo, erp]
---

# Guardiola Foundry OpenWiki Quickstart

Guardiola Foundry is a pnpm workspace for a bridal ERP application. The repository currently contains a React/Vite web app, an AdonisJS API, shared TypeScript contracts, shared Zod validation, PostgreSQL migrations/seeders, local PRD and issue-tracker notes, and this generated code wiki.

The current implemented business surface is no longer just a foundation: authentication, the authenticated workspace shell, Product management, and a first read-only Materials list exist in source. Prefer current source, tests, and `changes.md` history for module status.

## Where to start

- Read [Architecture](./architecture.md) to understand API/web/shared-package boundaries, auth, persistence, and the layered architecture policy.
- Use [Source Map](./source-map.md) when you need to jump from a feature or test failure to the relevant files.
- Use [Domain Concepts](./domain.md) for business language: User/Admin/Operator, Product, Collection, Product Status vs Lifecycle Status, Material, Source, Preferred Source, Supply, Inventory, and Bill of Materials.
- Use [Workflows](./workflows.md) for sign-in/session bootstrap, Product list/create/edit/delete/restore, Materials import/list, and feature-local endpoint adapters.
- Use [Operations and Testing](./operations-testing.md) for local setup, database commands, quality gates, and change-specific test guidance.

## Local setup

Requirements are Node.js 24+, pnpm 11+ from `package.json`, and Docker Compose for PostgreSQL. `.nvmrc` and `README.md` point developers toward the expected Node version. Do not read or copy live `.env` files; use example files as templates.

```bash
nvm use
pnpm install
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
pnpm --filter @guardiola-foundry/api exec node ace generate:key
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Useful URLs from `README.md` and app defaults:

- Web app: `http://localhost:5173`
- API: `http://localhost:3333`
- Health check: `GET http://localhost:3333/health`

The Docker service in `compose.yaml` starts PostgreSQL 16 on port 5432 and mounts `docker/postgres/init` so the test database can be initialized for API tests.

## Current repository shape

The [Architecture](./architecture.md) page explains how these pieces interact, while the [Source Map](./source-map.md) page gives file-by-file navigation.

```text
apps/
  api/        AdonisJS 7 API, Lucid models, migrations, seeders, functional tests
  web/        React 19 + Vite + TanStack Router/Query/Table frontend
packages/
  shared-types       cross-boundary TypeScript contracts
  shared-validation  Zod schemas for API/web request and response validation
docs/
  adr/ and architecture notes
.scratch/
  local PRDs and issue files used as the implementation tracker
openwiki/
  generated documentation for humans and future agents
```

## Recent branch context

The current branch is `feature/materials` at `eb1112a`. Recent commits show a deliberate progression:

1. Product work added duplicate-name warnings, soft delete, deleted-record route states, admin restore, denser list presentation, and endpoint locality cleanup.
2. Materials planning split textile Materials from Supplies and defined a Material-first, Source-backed first slice.
3. Materials implementation persisted Material/Source/Link tables, added a seeded importer, exposed authenticated `GET /materials`, replaced the placeholder route with a lean table, added Preferred Source attention state, and documented cleanup boundaries.

`changes.md` is intentionally overwritten per slice and acts as the latest handoff note. This wiki synthesizes the current `changes.md`, earlier commit snapshots of `changes.md`, current source files, tests, and local PRD/ADR evidence.

## Development rules of thumb

- Shared contracts live in `packages/shared-types` and `packages/shared-validation`; feature code should consume workspace package names, not relative cross-app imports.
- Web routes should stay thin and hand off to feature pages under `apps/web/src/features`.
- API modules are vertical slices under `apps/api/app/modules/<domain>` with controllers and services backed by Lucid models.
- Simple MVP and CRUD flows should stay layered unless `docs/adr/architecture-policy.md` says the business rules justify hexagonal/DDD structure.
- Preserve domain vocabulary from `CONTEXT.md` and [Domain Concepts](./domain.md); avoid renaming Product/Material/Source/Supply concepts casually.
- Before changing a feature, read the relevant `.scratch/<feature>/PRD.md`, issue file, `changes.md`, source files, and tests.

## Backlog

- Inventory — source anchors: `CONTEXT.md`, `apps/web/src/routes/app.inventory.tsx`, `apps/web/src/features/app-shell/workspace-pages.tsx`; deferred because it is currently an authenticated placeholder with glossary language but no persisted workflow.
- Bills of Materials — source anchors: `CONTEXT.md`, `apps/web/src/routes/app.bills-of-materials.tsx`, `.scratch/materials/PRD.md`; deferred because Materials are being prepared for future BOM usage, but BOM creation/display is out of scope.
- Supplies and Tools — source anchors: `docs/adr/0002-separate-materials-and-supplies.md`, `.scratch/materials/PRD.md`; deferred because textile Materials are intentionally separate from non-textile production inputs.
- Source management — source anchors: `.scratch/materials/PRD.md`, `changes.md`, `apps/api/app/models/material_source.ts`; deferred because Sources are persisted only to support the first Materials list.
- Materials mutations and import UI — source anchors: `.scratch/materials/PRD.md`, `apps/api/app/modules/materials/materials_importer.ts`; deferred because the first Materials slice is read-only listing from seeded/imported data.
- Product data hooks/cache refactor follow-up — source anchor: `changes.md` for commit `8743477`; deferred because endpoint locality landed but dedicated Product data hooks were explicitly left for a later issue.
