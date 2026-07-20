---
type: Operations Guide
title: Guardiola Foundry Operations and Testing
description: Practical runbook for local development, database operations, quality checks, tests, and scheduled OpenWiki updates in the Guardiola Foundry monorepo.
tags: [operations, testing, database, ci, openwiki]
---

# Guardiola Foundry Operations and Testing

Use this page when changing code documented in [Architecture](architecture.md) or behavior described in [Workflows](workflows.md). Commands are defined in root `package.json` and app package files.

## Local services

The database is PostgreSQL 16 through `compose.yaml`. Use the repository scripts instead of raw Docker commands unless a task explicitly requires otherwise:

```bash
pnpm db:up
pnpm db:status
pnpm db:migrate
pnpm db:rollback
pnpm db:seed
pnpm db:down
```

The API test runner uses a dedicated `guardiola_foundry_test` database. README notes that fresh Docker volumes create it automatically; older local volumes may need the one-time manual `CREATE DATABASE guardiola_foundry_test OWNER guardiola_foundry` command.

## Running the app

```bash
pnpm dev      # web + API
pnpm dev:web  # Vite app only
pnpm dev:api  # Adonis API only
```

The frontend runs at `http://localhost:5173`, the API at `http://localhost:3333`, and `GET /health` returns `{ "status": "ok" }` without checking Postgres.

## Verification commands

Root scripts recurse through workspaces where scripts exist:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`apps/api` uses ESLint, TypeScript, Adonis build/test commands, and Japa functional tests. `apps/web` uses Oxlint, TanStack Router generation during build/typecheck, Vitest, React Testing Library, and jsdom. The shared packages currently participate through package scripts and TypeScript contracts consumed by both apps.

## Product test anchors

For [Product management workflows](workflows.md#product-management-workflows), start with:

- `apps/api/tests/functional/products/create_products.spec.ts` for API contract behavior: creation defaults, duplicate-name permissiveness, edit fields, image upload/removal, soft-delete filtering, include-deleted admin behavior, restore permissions, and auth failures.
- `apps/web/src/routes/-products.test.tsx` for route-level UI behavior: create dialog, duplicate warnings, filtering, edit page, unsaved-change blocking, delete feedback, deleted Product read-only state, and restore UI.

When changing shared Product types or validation, update API and web tests together because [Architecture](architecture.md#shared-contracts) uses shared schemas on both sides.

## Documentation and OpenWiki updates

The scheduled OpenWiki workflow in `.github/workflows/openwiki-update.yml` installs OpenWiki and runs `openwiki code --update --print`, then opens a PR. It uses OpenRouter and LangSmith environment variables by name; do not copy secret values into documentation or chat.

Generated OpenWiki content belongs under `openwiki/`. `openwiki/INSTRUCTIONS.md` is user-authored control metadata and should not be rewritten during normal update runs. The workflow PR includes `openwiki`, `AGENTS.md`, `CLAUDE.md`, and the workflow file so agent context can evolve with the generated wiki.
