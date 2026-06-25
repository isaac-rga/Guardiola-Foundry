# Repository Guidelines

## Backend Structure

This directory is the AdonisJS 7 API application. Organize business code by domain under `app/modules/<domain>/`; for example, the health endpoint uses `app/modules/health/controllers/health_controller.ts`. Register HTTP routes in `start/routes.ts` and lazy-load controllers through the `#modules/*` import alias. Keep middleware in `app/middleware/`, exception handling in `app/exceptions/`, framework settings in `config/`, and boot-time wiring in `start/`.

Place Lucid migrations in `database/migrations/`. API tests belong in `tests/unit/`, `tests/functional/`, or `tests/browser/` according to scope. Shared request and response contracts should come from `@guardiola-foundry/shared-types`; do not duplicate them locally.

## Development Commands

Use Node.js 24+ and pnpm 11+. From `apps/api`:

- `pnpm dev`: start AdonisJS with hot module replacement.
- `pnpm test`: run all configured Japa suites.
- `pnpm lint`: check API TypeScript with ESLint.
- `pnpm typecheck`: run strict TypeScript checks without emitting files.
- `pnpm build`: compile the production application into `build/`.
- `node ace <command>`: run AdonisJS CLI tasks directly.

Database lifecycle scripts live at the monorepo root: use `pnpm db:up`, `pnpm db:status`, and `pnpm db:migrate` there.

## Coding Conventions

Use TypeScript, ES modules, two-space indentation, LF endings, single quotes, and no semicolons. ESLint extends `@adonisjs/eslint-config/app`; Prettier uses `@adonisjs/prettier-config`. Use snake_case filenames for AdonisJS classes (`health_controller.ts`), PascalCase class names, and camelCase methods and variables. Prefer configured aliases such as `#modules/*`, `#middleware/*`, and `#database/*` over deep relative imports.

Keep controllers focused on HTTP concerns. Put domain behavior in the corresponding module as it grows, without introducing abstractions before multiple callers require them.

## Testing Guidelines

Japa test files must end in `*.spec.ts`. Functional tests should call the HTTP endpoint and assert status codes and response bodies, following `tests/functional/health.spec.ts`. Add a focused regression test for every behavior change. Run the targeted suite while developing and complete `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` before submission.

## Commits, Pull Requests, and Configuration

Use concise Conventional Commit subjects, such as `feat: add supplier endpoint` or `fix: reject invalid invoice totals`. Pull requests must describe API contract changes, verification performed, migrations, and new environment variables. Link relevant issues or specifications.

Copy `.env.example` to `.env` for local development. Never commit `.env`, secrets, database credentials, or generated `APP_KEY` values; document every new variable in `.env.example`.
