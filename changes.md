# Reorganize Repository Agent Instructions

This documentation-only refactor separates the instructions previously concentrated in the root [AGENTS.md](AGENTS.md) into role- and application-specific guides. It does not change application code, commands, thresholds, conventions, or policy meaning.

## Root Instructions and Routing

[AGENTS.md](AGENTS.md) now keeps the instructions that apply across repository work:

- repository and project structure;
- routing to applicable role and application guides;
- universal TypeScript, formatting, naming, and shared-package linting conventions;
- the canonical shared-types and architecture-policy references;
- documentation and comment guidelines;
- the repository-wide human/CI Quality Gate rule.

Agents are directed to load only the guides applicable to their work:

- implementation or bug fixing: [.agents/roles/development.md](.agents/roles/development.md);
- maintenance, refactoring, or technical debt: [.agents/roles/maintenance.md](.agents/roles/maintenance.md);
- agent workflow, issue, or domain coordination: [.agents/roles/orchestration.md](.agents/roles/orchestration.md);
- infrastructure, environment, or DevOps work: [.agents/roles/devops.md](.agents/roles/devops.md);
- backend work: [apps/api/AGENTS.md](apps/api/AGENTS.md);
- frontend work: [apps/web/AGENTS.md](apps/web/AGENTS.md).

## Role-Specific Instructions

[.agents/roles/development.md](.agents/roles/development.md) contains the existing DRY and abstraction rules used during implementation, the general architectural implementation rules, development commands, and testing guidance.

[.agents/roles/maintenance.md](.agents/roles/maintenance.md) remains intentionally minimal because the original root guide did not contain a distinct body of maintenance-only policy. It routes maintenance work that changes implementation to the development guide rather than duplicating those rules.

[.agents/roles/orchestration.md](.agents/roles/orchestration.md) contains the existing local issue-tracker and domain-document discovery instructions, including the references to `docs/agents/issue-tracker.md` and `docs/agents/domain.md`.

[.agents/roles/devops.md](.agents/roles/devops.md) contains the existing database and environment lifecycle commands.

## Application-Specific Instructions

[apps/api/AGENTS.md](apps/api/AGENTS.md) retains all of its previous content and now also contains the root instructions specific to backend work:

- API linting and import aliases;
- isolation of cross-cutting server concerns;
- composition guidance for shared data behavior;
- the migration and schema-change workflow.

[apps/web/AGENTS.md](apps/web/AGENTS.md) retains all of its previous content and now also contains the root instructions specific to frontend work:

- web linting, React naming, and the `@/` import alias;
- separation of data fetching and server-state synchronization from presentation components.

## Repository Tracking

[.gitignore](.gitignore) now keeps `.agents/` ignored by default while allowing `.agents/roles/` to be tracked. Without this narrow exception, the requested role files would not appear in repository review or a future commit.

## Classification Decisions

The original “Rule of Three for Refactoring” remains with the development DRY and abstraction rules because it governs implementation decisions rather than a separate maintenance workflow.

Database environment lifecycle commands moved to the DevOps guide. The workflow that applies when models or schemas change moved to the API guide.

The final `pnpm quality` rule remains in the root guide because it is a repository-wide human/CI boundary.

## Validation

- Compared the reorganized files with the working-tree version of the original root guide.
- Accounted for every substantive original instruction.
- Confirmed that the only non-verbatim source lines were three mixed-scope sentences split between their applicable guides: linting, naming, and import aliases.
- Confirmed that the existing API and web guide content was preserved and only appended to.
- Confirmed that all canonical references remain present and point to the requested paths.
- Ran whitespace validation with `git diff --check`.
- Did not run application tests or the full `pnpm quality` gate because this change only reorganizes agent documentation.

All changes remain uncommitted for review. The pre-existing modification to [docs/architecture/shared-types-and-validation.md](docs/architecture/shared-types-and-validation.md) was not changed as part of this work.
