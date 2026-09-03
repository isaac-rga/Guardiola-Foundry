# Development

## General DRY & Architecture Standards

You must enforce a healthy DRY (Don't Repeat Yourself) strategy. Follow these rules to keep our architecture clean and maintainable.

### 1. Abstract Knowledge, Not Just Syntax
* **Rule:** Only abstract code if it represents the exact same business rule or system knowledge.
* **Instruction:** If two different features happen to use similar-looking logic today, but they could change for different reasons tomorrow, **do not abstract them**. Duplication is cheaper than the wrong abstraction.

### 2. The "Rule of Three" for Refactoring
* **Rule:** Do not write abstractions prematurely for code that is only written twice.
* **Instruction:** Write code inline the first time. Copy and modify it the second time. By the third time you write the exact same logic, refactor it into a reusable function, component, or class.

## Architectural Meta-Rules

- Prefer the simplest layered implementation for straightforward CRUD, reporting, and MVP work unless the issue clearly justifies stronger architectural boundaries.
- When an external dependency is likely to change, isolate it behind a boundary instead of coupling core logic directly to a vendor SDK, transport, or provider.
- Do not create single-implementation interfaces. If there is no meaningful polymorphism, use a concrete class or function.
- Do not add hexagonal or DDD overhead for generic tables, simple workflows, or thin data pipelines.
- Do not collapse complex calculations, multiple external integrations, or stateful business flows into a single oversized controller or service.

## Build, Test, and Development Commands
Use Node.js 24+ and the pnpm version pinned in `package.json`.

### Execution & Build Matrix
*   **Run local development environment (Full Stack):** `pnpm dev` (Runs both `@guardiola-foundry/web` and `@guardiola-foundry/api` in parallel).
*   **Run Web app only:** `pnpm dev:web`
*   **Run API app only:** `pnpm dev:api`

## Testing Guidelines

Add focused regression tests for changed behavior and assert user-visible outcomes or HTTP contracts.
