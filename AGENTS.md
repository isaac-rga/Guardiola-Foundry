# Repository Guidelines

## Project Structure & Module Organization

This is a pnpm TypeScript monorepo. `apps/api` contains the AdonisJS API; organize business code by domain under `app/modules/<domain>`, with framework configuration in `config/`, routes and startup hooks in `start/`, migrations in `database/migrations/`, and API tests in `tests/functional/`. `apps/web` is the React/Vite client: route files live in `src/routes/`, domain UI in `src/features/`, reusable controls in `src/components/`, and infrastructure helpers in `src/lib/`. Shared contracts and Zod schemas belong in `packages/shared-types` and `packages/shared-validation`. Consume them through their `@guardiola-foundry/*` package names. Approved feature specifications belong in `docs/specs/`.

For implementation work, always add the app-specific guide to context for the app you touch: use `apps/api/AGENTS.md` for backend tasks and `apps/web/AGENTS.md` for frontend tasks. If a task spans both apps, use both app guides alongside this root guide.

Do not edit generated output such as `apps/web/src/routeTree.gen.ts`, `dist/`, or `build/` by hand.

## Build, Test, and Development Commands

Use Node.js 24+ and the pnpm version pinned in `package.json`.

- `pnpm install --frozen-lockfile` installs workspace dependencies reproducibly.
- `pnpm dev` runs the web app and API; use `pnpm dev:web` or `pnpm dev:api` for one service.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` run the repository-wide CI checks.
- `pnpm db:up` starts PostgreSQL; `pnpm db:status` verifies connectivity and migration state.
- `pnpm db:migrate` applies pending AdonisJS migrations.

## Coding Style & Naming Conventions

Use TypeScript with strict checking, two-space indentation, LF endings, and a final newline. Prettier uses single quotes and no semicolons. The API uses ESLint; the web and shared packages use Oxlint. Keep filenames and feature directories kebab-case (`home-page.tsx`), React components PascalCase, and functions or variables camelCase. Prefer the web `@/` alias and API import aliases over deep relative imports.

## Testing Guidelines

API functional tests use Japa and follow `*.spec.ts`; web tests use Vitest, jsdom, and Testing Library with colocated `*.test.tsx` files. No coverage threshold is configured, so add focused regression tests for changed behavior and assert user-visible outcomes or HTTP contracts. Run `pnpm test` before submitting.

## Commit & Pull Request Guidelines

The current history uses Conventional Commit-style subjects, for example `chore: initialize ERP monorepo`. Continue with concise prefixes such as `feat:`, `fix:`, `test:`, or `chore:`. Pull requests should explain the change and verification performed, link relevant issues/specifications, call out migrations or environment changes, and include screenshots for visible UI changes. Ensure all four CI commands pass.

## Security & Configuration

Copy each app's `.env.example` to its local environment file. Never commit secrets or generated `APP_KEY` values; document new variables in the corresponding example file.

## Agent skills

### Issue tracker

Issues for this repo are tracked as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

The repo uses the default five triage labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This repo uses a multi-context domain-doc layout with a root `CONTEXT-MAP.md` that points to per-context `CONTEXT.md` files. See `docs/agents/domain.md`.
