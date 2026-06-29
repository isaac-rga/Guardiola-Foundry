# Guardiola Foundry ERP

Initial monorepo foundation for the Guardiola Foundry ERP. It contains a React single-page application, an AdonisJS API, shared TypeScript contracts, and shared Zod validation. No ERP business modules are implemented yet.

## Technology

- pnpm workspaces
- React 19, Vite, and TypeScript
- TanStack Router, Query, and Table
- Tailwind CSS and shadcn/ui
- React Hook Form and Zod
- AdonisJS 7 with Lucid ORM
- PostgreSQL 16

## Requirements

- Node.js 24 or newer
- pnpm 10
- Docker with Docker Compose

## Install

```bash
nvm use
pnpm install
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
pnpm --filter @guardiola-foundry/api exec node ace generate:key
```

Start PostgreSQL and verify that Lucid can connect:

```bash
pnpm db:up
pnpm db:status
```

There are no application migrations yet. When migrations are added, run them with:

```bash
pnpm db:migrate
```

The API test runner uses a dedicated PostgreSQL database named `guardiola_foundry_test`. On a fresh `pnpm db:up`, Docker creates it automatically. If your local Postgres volume already exists from an older setup, create it once with:

```bash
docker compose exec -T postgres psql -U guardiola_foundry -d postgres -c "CREATE DATABASE guardiola_foundry_test OWNER guardiola_foundry"
```

## Run

Run both applications:

```bash
pnpm dev
```

Run them independently:

```bash
pnpm dev:web
pnpm dev:api
```

- Frontend: <http://localhost:5173>
- API: <http://localhost:3333>
- Health check: <http://localhost:3333/health>

## Health Endpoint

| Method | Path | Input | Success output | Application errors |
| --- | --- | --- | --- | --- |
| `GET` | `/health` | None | `200 { "status": "ok" }` | None |

The health endpoint is a liveness check. It intentionally does not query PostgreSQL.

## Quality Commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Database Commands

```bash
pnpm db:up       # Start PostgreSQL
pnpm db:status   # Verify Lucid connectivity and migration status
pnpm db:migrate  # Apply pending migrations
pnpm db:logs     # Follow PostgreSQL logs
pnpm db:down     # Stop PostgreSQL
```

## Project Structure

```text
.
├── apps/
│   ├── api/
│   │   ├── app/modules/health/
│   │   ├── config/
│   │   ├── database/migrations/
│   │   ├── start/
│   │   └── tests/functional/
│   └── web/
│       ├── src/
│       │   ├── routes/
│       │   ├── features/
│       │   ├── components/
│       │   │   ├── ui/
│       │   │   └── layout/
│       │   ├── lib/
│       │   │   ├── api/
│       │   │   ├── auth/
│       │   │   ├── query/
│       │   │   └── utils/
│       │   └── hooks/
│       └── components.json
├── packages/
│   ├── shared-types/
│   └── shared-validation/
├── docs/specs/
├── compose.yaml
├── pnpm-workspace.yaml
└── package.json
```

## Shared Packages

- `@guardiola-foundry/shared-types` exports TypeScript-only contracts, beginning with `HealthResponse`.
- `@guardiola-foundry/shared-validation` exports shared Zod schemas, beginning with `healthResponseSchema`.

Applications should consume shared packages through their workspace package names instead of relative paths.

## Manual Steps

1. Install or activate Node.js 24 or newer.
2. Create each app environment file from its checked-in example.
3. Generate the AdonisJS application key.
4. Ensure Docker is running before starting PostgreSQL.
5. Add future database migrations and ERP modules only from approved specifications in `docs/specs`.
