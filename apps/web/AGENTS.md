# Repository Guidelines

This document extends the root AGENTS.md. Only app-specific conventions are documented here.

This directory is the React 19 and Vite frontend.
Using:
- TanStack Router, Query, and Table
- Tailwind CSS and shadcn/ui
- React Hook Form and Zod

## Folder Structure

```text
apps/web/
└─ src/
   ├─ assets/
   ├─ routes/                 # Thin file-based routes
   ├─ features/               # Domain screens and feature behavior
   │  └─ <domain>/
   │     └─ api/              # Feature-specific endpoints and server state
   ├─ components/
   │  ├─ app/                 # Shared app-level components
   │  ├─ layout/              # Reserved layout area; currently unused
   │  └─ ui/                  # shadcn/ui primitives
   ├─ lib/                    # Infrastructure and shared technical helpers
   │  ├─ api/                 # Shared transport helpers only
   │  ├─ auth/                # Auth management
   │  └─ utils/               # Generic helpers like cn(), etc.
   └─ hooks/                  # Shared UI hook
```

Keep route files thin and render domain screens from `src/features/<domain>/`.
Do not edit generated output such as `apps/web/src/routeTree.gen.ts`, `dist/`, or `build/`.

## Feature API Modules

Feature-specific endpoint adapters and TanStack Query server-state modules belong under `src/features/<domain>/api/`. Keep endpoint adapters close to the feature they serve, and place feature cache updates, invalidation rules, query keys, and mutation hooks in the same API area.

Use `src/lib/api/` only for shared transport helpers that are not owned by a single feature, such as base URL resolution or common error parsing.

Screens should call feature-local hooks such as `useProductList`, `useProductDetail`, `useCreateProduct`, `useUpdateProduct`, `useDeleteProduct`, and `useRestoreProduct` rather than constructing fetch calls, query keys, or cache updates inline. Prefer endpoint-shaped names when the hook maps directly to an API action. Keep visual list projection rules, labels, filters, and sorting in separate feature modules unless they are part of server-state synchronization.

## React and TypeScript Conventions

Keep components small and behavior-focused. Put server state in feature-local TanStack Query modules, not ad hoc effects or presentation components. Use React Hook Form with shared Zod schemas for forms. Keep route loaders, search validation, and navigation concerns in route files; place domain rendering and interactions in feature modules.

## UI Guidelines

- Use shadcn/ui components from `@/components/ui`.
- Do not install new UI libraries without approval.
- Treat `src/components/ui` as shared design primitives. Prefer composition in app or feature components. Only modify primitives when the task explicitly requires a reusable design-system change.
- Feature-specific components go under `src/features/<domain>/components`.
- Shared app components go under `src/components/app`.
- Forms should use shadcn form components with Zod schemas.

Tailwind CSS v4 is configured through Vite and `src/index.css`. Use utility classes and existing semantic tokens such as `bg-background`, `text-muted-foreground`, and `border-border`; do not hardcode replacement colors when a token exists. Compose conditional classes with `cn()` from `@/lib/utils`.

Follow the shadcn/ui New York style configured in `components.json`.

Use shadcn CLI to add missing primitives. Do not manually recreate shadcn components.
If a primitive is missing, add it with the shadcn CLI from the repository root: `pnpm dlx shadcn@latest add <component> -c apps/web`.

## Testing guidelines

Tests use Vitest, jsdom, and Testing Library. Colocate tests as `*.test.tsx`, query by accessible role or visible text, and assert user-observable behavior. Add focused regression coverage for changed interactions.

## Framework Documentation & Tactical Alignment

Before implementing or modifying frontend behavior, consult the appropriate Context7 documentation instead of relying on memory. Only consult documentation when needed.

### Primary documentation sources

- React: `@context7 /reactjs/react.dev`
- TanStack Router: `@context7 /tanstack/router`
- TanStack Query: `@context7 /tanstack/query`
- TanStack Table: `@context7 /tanstack/table`
- shadcn/ui: `@context7 /shadcn-ui/ui`
- React Hook Form: `@context7 /react-hook-form/documentation`
- React Hook Form Resolvers: `@context7 /react-hook-form/resolvers`
- Zod: `@context7 /websites/zod_dev`
- Vitest: `@context7 /vitest-dev/vitest`

### Context Ingestion Mapping
Do not browse randomly. Use specific subpaths directly based on the architectural layer you are touching:
- Route files, navigation, loaders, search params, and route generation → TanStack Router.
- Server state, caching, invalidation, queries, and mutations → TanStack Query.
- Tables, column definitions, row models, sorting, filtering, and table state → TanStack Table.
- UI primitives, theming, component composition, and shadcn CLI usage → shadcn/ui.
- Forms, form state, controllers, validation flow, and submission handling → React Hook Form.
- Zod integration with React Hook Form → React Hook Form Resolvers.
- Runtime validation and schema/type inference → Zod.
- Component tests, jsdom behavior, mocks, and assertions → Vitest.

<!-- intent-skills:start -->
### Skill Loading

Before editing files for a substantial task:
- Run `pnpm dlx @tanstack/intent@latest list` to see available local skills.
- If a listed skill matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

## Development Commands

From `apps/web`:

- `pnpm generate:routes`: regenerate the TanStack route tree.
- `pnpm test`: run Vitest once in jsdom.
- `pnpm lint`: check source files with Oxlint.
- `pnpm typecheck`: generate routes and run TypeScript project checks.
- `pnpm build`: generate routes, typecheck, and create the production bundle.
- `pnpm preview`: serve the production build locally.
