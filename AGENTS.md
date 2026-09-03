# Repository Guidelines

## Project Structure & Module Organization

This is a pnpm TypeScript monorepo. `apps/api` contains the AdonisJS API;`apps/web` is the React/Vite client; Shared contracts and Zod schemas belong in `packages/shared-types` and `packages/shared-validation`. Consume them through their `@guardiola-foundry/*` package names. Approved feature specifications belong in `.scratch/<spec>`.

For implementation work, always add the app-specific guide to context for the app you touch: use `apps/api/AGENTS.md` for backend tasks and `apps/web/AGENTS.md` for frontend tasks. If a task spans both apps, use both app guides alongside this root guide.

## Coding Style & Naming Conventions

Use TypeScript with strict checking, two-space indentation, LF endings, and a final newline.
Prettier uses single quotes and no semicolons.
The API uses ESLint; the web and shared packages use Oxlint.
React components PascalCase, and functions or variables camelCase.
Prefer the web `@/` alias and API import aliases over deep relative imports.

### General DRY & Architecture Standards

You must enforce a healthy DRY (Don't Repeat Yourself) strategy. DRY is not just about avoiding duplicate lines of code; it is about ensuring every piece of system knowledge has a single, authoritative home. Follow these rules to keep our architecture clean and maintainable.

#### 1. Abstract Knowledge, Not Just Syntax
* **Rule:** Only abstract code if it represents the exact same business rule or system knowledge.
* **Instruction:** If two different features happen to use similar-looking logic today, but they could change for different reasons tomorrow, **do not abstract them**. Duplication is cheaper than the wrong abstraction.

#### 2. Isolate Cross-Cutting Concerns
* **Rule:** Do not scatter systemic logic (like Authentication, Logging, Error Handling, or Caching) across individual business files or controllers.
* **Instruction:** Handle these behaviors at the architectural boundaries using structural patterns. Use HTTP Middleware, Interceptors, Decorators, or Aspect-Oriented Programming (AOP) to keep core business logic clean.

#### 3. Share Data Behaviors via Composition
* **Rule:** Do not duplicate database filters, state manipulation, or universal data traits across multiple models or tables.
* **Instruction:** Use composition over inheritance. Utilize ORM Mixins, Plugins, or Traits to inject shared behaviors (like Soft Delete, Multi-Tenancy filtering, or Automatic Audit Logs) into data models.

#### 4. Separate Data Fetching from UI Layout
* **Rule:** Never embed raw API calls, data fetching states, or cache mutations directly inside UI presentation components.
* **Instruction:** Isolate data syncing into a dedicated state management or data-fetching layer (e.g., Custom Hooks, Repositories, or Services). Presentation components should only receive clean data and trigger actions.

#### 5. The "Rule of Three" for Refactoring
* **Rule:** Do not write abstractions prematurely for code that is only written twice.
* **Instruction:** Write code inline the first time. Copy and modify it the second time. By the third time you write the exact same logic, refactor it into a reusable function, component, or class.

## Shared Types & Validation Guidelines

Treat shared types and validation as cross-boundary domain contracts: organize them by business domain, keep common truly cross-domain, and prefer schemas as the source of truth.
See `docs/architecture/shared-types-and-validation.md` for the canonical rules.

## Architectural Meta-Rules

- Prefer the simplest layered implementation for straightforward CRUD, reporting, and MVP work unless the issue clearly justifies stronger architectural boundaries.
- When an external dependency is likely to change, isolate it behind a boundary instead of coupling core logic directly to a vendor SDK, transport, or provider.
- Do not create single-implementation interfaces. If there is no meaningful polymorphism, use a concrete class or function.
- Do not add hexagonal or DDD overhead for generic tables, simple workflows, or thin data pipelines.
- Do not collapse complex calculations, multiple external integrations, or stateful business flows into a single oversized controller or service.
- Before making any architectural decision or introducing a new design seam, read `docs/adr/architecture-policy.md` and follow it as the source of truth for codebase-specific architecture policy and thresholds.

## Build, Test, and Development Commands
Use Node.js 24+ and the pnpm version pinned in `package.json`.

### Execution & Build Matrix
*   **Run local development environment (Full Stack):** `pnpm dev` (Runs both `@guardiola-foundry/web` and `@guardiola-foundry/api` in parallel).
*   **Run Web app only:** `pnpm dev:web`
*   **Run API app only:** `pnpm dev:api`

### Database & Environment Control
*   **Spin up Postgres Container:** `pnpm db:up` (Do not run raw `docker compose` manually unless specified).
*   **Teardown Database Container:** `pnpm db:down`
*   **Run Pending Migrations:** `pnpm db:migrate`
*   **Rollback Last Migration:** `pnpm db:rollback`
*   **Check Migration Status:** `pnpm db:status`
*   **Seed Database:** `pnpm db:seed`

### Database Changes (If Applicable)

If the task modifies models or schema
1. Run pending migrations to apply changes.
2. Check Migration Status
3. Seed database only recently added seed (if applicable)

## Testing Guidelines

No coverage threshold is configured, so add focused regression tests for changed behavior and assert user-visible outcomes or HTTP contracts.

## Documentation Guidelines

Write comments only when they add knowledge. Documentation exists to preserve information that cannot be inferred from the code itself. Assume future contributors will often be AI agents.

Prefer comments that explain:
- **Why** a decision was made.
- Business rules.
- Domain constraints.
- Invariants.
- Architectural decisions.
- Performance trade-offs.
- Technical debt with removal criteria.
- Workarounds and their reason.
- Important side effects.
- Avoid comments that simply describe what the code already says.

## Quality Gate

The final `pnpm quality` gate belongs to the human and CI. Run it only when explicitly requested. During implementation, run only the focused checks needed for the change. Treat gate failures shared by the user as input for correction.

## Agent skills

### Issue tracker

Issues for this repo are tracked as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Domain docs

This repo uses a multi-context domain-doc layout with a root `CONTEXT-MAP.md` that points to per-context `CONTEXT.md` files. See `docs/agents/domain.md`.
