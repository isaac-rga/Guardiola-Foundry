# Repository Guidelines

This document extends the root AGENTS.md. Only app-specific conventions are documented here.

## Frontend Structure

This directory is the React 19 and Vite frontend. Define file-based TanStack Router routes in `src/routes/`; keep route files thin and render domain screens from `src/features/<domain>/`. Reusable shadcn/ui primitives belong in `src/components/ui/`, shared application components in `src/components/`, and browser or API infrastructure in `src/lib/`. Use `src/lib/query/query-client.ts` for React Query configuration and `src/lib/api/` for API client concerns.

Never edit `src/routeTree.gen.ts` manually. It is generated from route files.

## Development Commands

From `apps/web`:

- `pnpm dev`: start the Vite development server.
- `pnpm generate:routes`: regenerate the TanStack route tree.
- `pnpm test`: run Vitest once in jsdom.
- `pnpm lint`: check source files with Oxlint.
- `pnpm typecheck`: generate routes and run TypeScript project checks.
- `pnpm build`: generate routes, typecheck, and create the production bundle.
- `pnpm preview`: serve the production build locally.

## React and TypeScript Conventions

Keep components small and behavior-focused. Put server state in TanStack Query, not ad hoc effects. Use React Hook Form with shared Zod schemas for forms. Keep route loaders, search validation, and navigation concerns in route files; place domain rendering and interactions in feature modules.

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
If a primitive is missing, add it with the shadcn CLI from the repository root: `pnpm dlx shadcn@latest add <component> -c apps/web`
Do not manually recreate shadcn components.

## Libraries and Framework Documentation
Before implementing or modifying frontend behavior, consult the appropriate Context7 documentation instead of relying on memory.

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

### Usage guidance

- Route files, navigation, loaders, search params, and route generation → TanStack Router.
- Server state, caching, invalidation, queries, and mutations → TanStack Query.
- Tables, column definitions, row models, sorting, filtering, and table state → TanStack Table.
- UI primitives, theming, component composition, and shadcn CLI usage → shadcn/ui.
- Forms, form state, controllers, validation flow, and submission handling → React Hook Form.
- Zod integration with React Hook Form → React Hook Form Resolvers.
- Runtime validation and schema/type inference → Zod.
- Component tests, jsdom behavior, mocks, and assertions → Vitest.

## Testing and Delivery

Tests use Vitest, jsdom, and Testing Library. Colocate tests as `*.test.tsx`, query by accessible role or visible text, and assert user-observable behavior. Add focused regression coverage for changed interactions.

Document new `VITE_*` variables in `.env.example`.
