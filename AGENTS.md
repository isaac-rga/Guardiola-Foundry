# Repository Guidelines

## Project Structure & Module Organization

This is a pnpm TypeScript monorepo. `apps/api` contains the AdonisJS API;`apps/web` is the React/Vite client; Shared contracts and Zod schemas belong in `packages/shared-types` and `packages/shared-validation`. Consume them through their `@guardiola-foundry/*` package names. Approved feature specifications belong in `.scratch/<spec>`.

For implementation work, always add the app-specific guide to context for the app you touch: use `apps/api/AGENTS.md` for backend tasks and `apps/web/AGENTS.md` for frontend tasks. If a task spans both apps, use both app guides alongside this root guide.

## Instruction Routing

Load only the role instructions applicable to the work:

- Implementation or bug fixing: `.agents/roles/development.md`
- Maintenance, refactoring, or technical debt: `.agents/roles/maintenance.md`
- Agent workflow, issue, or domain coordination: `.agents/roles/orchestration.md`
- Infrastructure, environment, or DevOps work: `.agents/roles/devops.md`
- Backend work: `apps/api/AGENTS.md`
- Frontend work: `apps/web/AGENTS.md`

## Coding Style & Naming Conventions

Use TypeScript with strict checking, two-space indentation, LF endings, and a final newline.
Prettier uses single quotes and no semicolons.
Shared packages use Oxlint.
Functions or variables camelCase.

## Shared Types & Validation Guidelines

Treat shared types and validation as cross-boundary domain contracts: organize them by business domain, keep common truly cross-domain, and prefer schemas as the source of truth.
See `docs/architecture/shared-types-and-validation.md` for the canonical rules.

## Architecture Policy

- Before making any architectural decision or introducing a new design seam, read `docs/adr/architecture-policy.md` and follow it as the source of truth for codebase-specific architecture policy and thresholds.

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
