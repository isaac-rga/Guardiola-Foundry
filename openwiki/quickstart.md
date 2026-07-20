---
type: Repository Guide
title: Guardiola Foundry OpenWiki Quickstart
description: Entry point for the Guardiola Foundry code wiki, covering the monorepo shape, current ERP scope, local setup commands, and links to architecture, workflows, domain, operations, and source navigation pages.
tags: [quickstart, monorepo, erp, openwiki]
---

# Guardiola Foundry OpenWiki Quickstart

Guardiola Foundry is a pnpm TypeScript monorepo for a bridal ERP. It combines an AdonisJS API in `apps/api`, a React/Vite application in `apps/web`, and shared TypeScript/Zod contract packages in `packages/shared-types` and `packages/shared-validation` (`package.json`, `pnpm-workspace.yaml`, `apps/*/package.json`).

The current implemented business slice is product management: authenticated users can list, create, edit, soft-delete, and, for admins, restore Product records. The root `README.md` still describes an initial foundation with no ERP modules, but the current source and tests show that Products, authentication, sessions, collections, product images, and soft-delete behavior are implemented.

## Start here

- Use [Architecture](architecture.md) to understand how the API, web app, shared contracts, auth boundary, and refactored web API transport fit together.
- Use [Workflows](workflows.md) for end-to-end Product, authentication, issue-tracker, and OpenWiki maintenance flows.
- Use [Domain Concepts](domain.md) for the canonical business language and Product rules that code should preserve.
- Use [Operations and Testing](operations-testing.md) for local development, database, verification, and scheduled documentation update commands.
- Use [Source Map](source-map.md) when you need to jump from a concept to the source files that implement it.

## Local setup and daily commands

The repo expects Node.js 24+ and pnpm 11+ according to root `package.json`; the README currently says pnpm 10, so prefer the root package metadata. Start from the checked-in examples rather than copying secrets into chat:

```bash
nvm use
pnpm install
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
pnpm --filter @guardiola-foundry/api exec node ace generate:key
pnpm db:up
pnpm db:migrate
pnpm dev
```

Useful root commands are defined in `package.json`:

- `pnpm dev` runs web and API in parallel.
- `pnpm dev:web` and `pnpm dev:api` run one app.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` run recursively where packages define those scripts.
- `pnpm db:up`, `pnpm db:down`, `pnpm db:migrate`, `pnpm db:rollback`, `pnpm db:status`, and `pnpm db:seed` wrap Docker/Postgres and Adonis migration commands.

## What to inspect first for changes

For Product work, start with [Domain Concepts](domain.md) to keep business language stable, then follow [Product workflows](workflows.md#product-management-workflows) into `apps/api/app/modules/products` and `apps/web/src/features/products`. For architectural refactors, read [Architecture](architecture.md) and the local policy in `docs/adr/architecture-policy.md`; the repository defaults to simple layered implementations and avoids speculative hexagonal/DDD structure unless business complexity or integration risk justifies it.

For future agents, `.scratch/<feature>/PRD.md` and `.scratch/<feature>/issues/*.md` are the local issue tracker. `Status: done` is terminal completion tracking for implemented work, not a triage role (`docs/agents/issue-tracker.md`).

## Backlog

- Materials module — source anchor: `CONTEXT.md` and `apps/web/src/routes/app.materials.tsx`; deferred because only shell placeholder/domain language exists.
- Inventory module — source anchor: `CONTEXT.md` and `apps/web/src/routes/app.inventory.tsx`; deferred because no API/domain implementation exists yet.
- Bills of Materials module — source anchor: `CONTEXT.md` and `apps/web/src/routes/app.bills-of-materials.tsx`; deferred because only navigation placeholder/domain language exists.
- README refresh — source anchor: `README.md`; deferred because this run updates generated OpenWiki docs only, but README statements about no ERP modules and no migrations are stale relative to Product source.
