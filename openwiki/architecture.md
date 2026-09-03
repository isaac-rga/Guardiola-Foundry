---
type: Architecture Overview
title: Guardiola Foundry Architecture
description: Explains the Guardiola Foundry monorepo architecture, including the AdonisJS API, React app shell, shared contracts, auth boundary, persistence model, and layered architecture policy.
tags: [architecture, api, web, contracts, auth]
---

# Guardiola Foundry Architecture

Guardiola Foundry uses a simple layered monorepo architecture. The root `package.json` coordinates `apps/api`, `apps/web`, `packages/shared-types`, and `packages/shared-validation`; `pnpm-workspace.yaml` declares the workspace packages. The architecture policy in `docs/adr/architecture-policy.md` says CRUD/MVP slices should stay direct and layered, while hexagonal or DDD structure is reserved for flows with interacting business rules, strict lifecycle transitions, core operational logic, or external integrations that need insulation.

[Workflows](./workflows.md) are implemented through these layers, and [Domain Concepts](./domain.md) define the language that shared contracts and UI labels should preserve.

## Runtime shape

- `apps/api` is an AdonisJS 7 API with Lucid ORM and PostgreSQL. `apps/api/start/routes.ts` registers health, auth, Materials, and Products endpoints and dispatches to controllers under `apps/api/app/modules`.
- `apps/web` is a React 19/Vite client using TanStack Router, TanStack Query, TanStack Table, React Hook Form, Zod, Tailwind CSS, and shadcn-style UI primitives. File routes under `apps/web/src/routes` compose feature components under `apps/web/src/features`.
- `packages/shared-types` defines cross-boundary TypeScript contracts for health, auth, Products, and Materials.
- `packages/shared-validation` defines Zod schemas used by the API controllers and web endpoint adapters to validate/parse the same contracts.

The [Source Map](./source-map.md) lists the main files for each runtime area.

## API structure

The API currently exposes `GET /health`, auth endpoints, `GET /materials`, and Product list/create/show/update/delete/restore endpoints. Controllers authenticate bearer tokens directly where needed. Product and Material controllers use shared validation/contracts but keep framework and ORM access in the layered service/model path. This intentionally matches the architecture policy: current Product and Materials slices are operationally simple enough that direct Lucid usage in services is acceptable.

## Web structure

TanStack Router is initialized in `apps/web/src/router.tsx` from generated route tree code. The `/app` route in `apps/web/src/routes/app.tsx` is the protected boundary: its loader calls `requireCurrentAuthSession()`, which bootstraps the stored session through `GET /auth/me` or redirects to `/sign-in`.

`AuthenticatedAppShell` in `apps/web/src/features/app-shell/authenticated-app-shell.tsx` owns navigation and shell context. It exposes the session through `useAppShell()`, which feature pages use to send bearer tokens to API endpoint adapters. Products and Materials demonstrate the intended pattern: route file registers the URL, feature page owns UI/query state, feature-local `api/endpoints.ts` owns HTTP details.

## Shared contract architecture

`docs/architecture/shared-types-and-validation.md` says shared code should be organized by business domain, not technical category. The current code is midway through that direction: Product and auth contracts still live primarily in package indexes, while Materials contracts have been split into `materials.ts` files and re-exported.

[Domain Concepts](./domain.md) are encoded through these contracts. [Workflows](./workflows.md) depend on them because API responses are serialized in services/controllers and parsed again by web endpoint adapters before UI code consumes them.

## Authentication boundary

The auth design is documented in `docs/adr/0001-token-based-auth.md` and implemented in `apps/api/app/modules/auth/auth_service.ts`. Sign-in issues an opaque bearer token to the client but stores only a SHA-256 hash server-side in `access_tokens`. Tokens expire after 30 days; logout revokes the presented token; password change revokes all active tokens for the user.

The web app stores the returned session in localStorage through `apps/web/src/lib/auth/session-storage.ts`, validates it with shared Zod schemas, and refreshes current user data during `/app` route loading. Product and Materials [workflows](./workflows.md) depend on the app-shell session and bearer token rather than global implicit auth.

## Persistence and soft deletion

Lucid models live in `apps/api/app/models`. Database structure is defined by migrations under `apps/api/database/migrations`, with generated schema snapshots in `apps/api/database/schema.ts`.

`apps/api/app/mixins/soft_delete.ts` adds a repository-wide soft-delete pattern for Product, Material, and MaterialSource models. It registers hooks that hide `deleted_at` rows by default and provides `queryWithDeleted()`, `includeDeleted()`, `softDelete()`, and `restore()` for explicit deleted-aware behavior. Product workflows use this for recoverable deletion; Materials use it so future BOM/Inventory references are not threatened by hard deletes.

## Integration points

Current integrations are local and first-party: PostgreSQL through Docker Compose and Lucid, browser `fetch` from feature-local endpoint adapters, local filesystem storage for Product images under the API app temp path, and workspace packages for shared types and validation. There are no external vendor APIs, queues, or background workers in the inspected source. If those arrive, revisit the architecture policy before adding direct integration logic to controllers or UI components.
