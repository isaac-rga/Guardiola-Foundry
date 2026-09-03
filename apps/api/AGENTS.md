# Repository Guidelines

This document extends the root AGENTS.md. Only app-specific conventions are documented here.
This is an AdonisJS 7 API application.

## Architectural & Folder Blueprint
You must strictly isolate business logic using a Vertical Slice Architecture. Never cross-contaminate domains without explicit instruction.

```text
apps/api/
├── app/
│   ├── modules/<domain>     # CORE DOMAIN AREA (Vertical Slices) e.g., "products", "materials"
│   │   ├── controllers/     # e.g., health_controller.ts
│   │   ├── models/          # Domain specific models (Lucid)
│   │   └── services/        # Domain business logic
│   ├── middleware/          # Global/Shared HTTP middleware
│   ├── mixins/              # Global/Shared mixins
│   └── exceptions/          # Global exception handlers
├── config/                   # Framework settings only
├── database/migrations/     # Lucid migrations only
├── start/                   # Boot-time wiring & HTTP routing
│   ├── routes.ts            # Lazy-load using #modules/* alias
│   └── kernel.ts
└─── tests/                  # Japa test suites
    ├── functional/          # API Endpoint testing
    └── unit/                # Isolated business logic testing
```

## Coding Conventions & Guardrails
Failure to follow these rules will result in broken imports and linting errors.

### Naming Conventions
- **Filenames:** `snake_case` strictly for AdonisJS classes (e.g., `health_controller.ts`, `user_repository.ts`).
- **Class Names:** `PascalCase` (e.g., `HealthController`).
- **Methods & Variables:** `camelCase` (e.g., `getHealthStatus()`).

### Controller vs. Domain Isolation
- **Controllers** are purely HTTP orchestrators. They handle requests, status codes, and responses.
- **Domain Logic** must live inside `app/modules/<domain>/`.
- **YAGNI Rule:** Do not abstract or create interfaces/repositories unless multiple callers explicitly require them. Keep code concrete.

### Other conventions
- ESLint extends `@adonisjs/eslint-config/app`;
- Prettier uses `@adonisjs/prettier-config`.
- Prefer configured aliases such as `#modules/*`, `#middleware/*`, and `#database/*` over deep relative imports.

## Testing Guidelines

Japa test files must end in `*.spec.ts`. Functional tests verify application behavior through a public boundary using real infrastructure. HTTP-facing behavior should call the endpoint and assert status codes and response bodies, following `tests/functional/health.spec.ts`. Database-backed behavior without an HTTP endpoint, such as importers, migrations, and persistence constraints, may be exercised through its public application or persistence boundary. Keep unit tests for isolated logic that does not require infrastructure. Run the targeted suite while developing.

## Framework Documentation & Tactical Alignment
CRITICAL: This project runs on **AdonisJS v7**. Do not use deprecated v5/v6 syntax (e.g., old routing decorators or custom dotenv loaders).

### 1. Primary Context Commands
When implementing or modifying code, you MUST fetch exact syntax using these specific context providers:
- Framework Core: `@context7 /adonisjs/v7-docs`
- Database & Models: `@context7 /adonisjs/lucid.adonisjs.com`
- Testing & Assertions: `@context7 /websites/japa_dev`

### 2. Context Ingestion Mapping
Do not browse randomly. Use specific subpaths directly based on the architectural layer you are touching:
- **Routing/Controllers/Validation:** Map to `@context7 /adonisjs/v7-docs/guides/basics/`. Prefer current v7 patterns such as route groups, group middleware, resource routes, `.only()`, `.except()`, and `.params()`.
- **Authentication/Guards:** Map to `@context7 /adonisjs/v7-docs/guides/auth/`
- **Database/Migrations/Lucid:** Map to `@context7 /adonisjs/v7-docs/guides/database/` or Lucid primary source.
- **Test Doubles/API Tests:** Map to `@context7 /adonisjs/v7-docs/guides/testing/` or Japa primary source.
- **Inversion of Control (IoC)/Dependency Injection:** Map to `@context7 /adonisjs/v7-docs/guides/concepts/`

### 3. Verification Protocol (Definition of Done)
Before marking any task as complete, you must explicitly output a confirmation in your thought process:
"Verified implementation against [Source Path] to ensure compliance with AdonisJS v7 end-to-end standards."

## Security & Configuration
Copy each app's `.env.example` to its local environment file. Never commit secrets or generated `APP_KEY` values; document new variables in the corresponding example file.

## Development Commands

From `apps/api`:

- `pnpm test`: run all configured Japa suites.
- `pnpm lint`: check API TypeScript with ESLint.
- `pnpm typecheck`: run strict TypeScript checks without emitting files.
- `pnpm build`: compile the production application into `build/`.
- `node ace <command>`: run AdonisJS CLI tasks directly.

## Repository API Instructions

The API uses ESLint.
Prefer API import aliases over deep relative imports.

### Isolate Cross-Cutting Concerns
* **Rule:** Do not scatter systemic logic (like Authentication, Logging, Error Handling, or Caching) across individual business files or controllers.
* **Instruction:** Handle these behaviors at the architectural boundaries using structural patterns. Use HTTP Middleware, Interceptors, Decorators, or Aspect-Oriented Programming (AOP) to keep core business logic clean.

### Share Data Behaviors via Composition
* **Rule:** Do not duplicate database filters, state manipulation, or universal data traits across multiple models or tables.
* **Instruction:** Use composition over inheritance. Utilize ORM Mixins, Plugins, or Traits to inject shared behaviors (like Soft Delete, Multi-Tenancy filtering, or Automatic Audit Logs) into data models.

### Database Changes (If Applicable)

If the task modifies models or schema
1. Run pending migrations to apply changes.
2. Check Migration Status
3. Seed database only recently added seed (if applicable)
