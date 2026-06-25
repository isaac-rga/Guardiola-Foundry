# Repository Guidelines

## Frontend Structure

This directory is the React 19 and Vite frontend. Define file-based TanStack Router routes in `src/routes/`; keep route files thin and render domain screens from `src/features/<domain>/`. Reusable shadcn/ui primitives belong in `src/components/ui/`, shared application components in `src/components/`, and browser or API infrastructure in `src/lib/`. Use `src/lib/query/query-client.ts` for React Query configuration and `src/lib/api/` for API client concerns.

Never edit `src/routeTree.gen.ts` manually. It is generated from route files. Shared API types and Zod schemas must come from `@guardiola-foundry/shared-types` and `@guardiola-foundry/shared-validation` rather than being duplicated.

## Development Commands

Use Node.js 24+ and pnpm 11+. From `apps/web`:

- `pnpm dev`: start the Vite development server.
- `pnpm generate:routes`: regenerate the TanStack route tree.
- `pnpm test`: run Vitest once in jsdom.
- `pnpm lint`: check source files with Oxlint.
- `pnpm typecheck`: generate routes and run TypeScript project checks.
- `pnpm build`: generate routes, typecheck, and create the production bundle.
- `pnpm preview`: serve the production build locally.

## React and TypeScript Conventions

Use strict TypeScript, ES modules, two-space indentation, LF endings, single quotes, and no semicolons. Use kebab-case filenames (`home-page.tsx`), PascalCase React components, and camelCase functions. Prefer the `@/` alias over deep relative imports.

Keep components small and behavior-focused. Put server state in TanStack Query, not ad hoc effects. Use React Hook Form with shared Zod schemas for forms. Keep route loaders, search validation, and navigation concerns in route files; place domain rendering and interactions in feature modules.

## Styling and UI Components

Tailwind CSS v4 is configured through Vite and `src/index.css`. Use utility classes and existing semantic tokens such as `bg-background`, `text-muted-foreground`, and `border-border`; do not hardcode replacement colors when a token exists. Compose conditional classes with `cn()` from `@/lib/utils`.

Follow the shadcn/ui New York style configured in `components.json`. Reuse or extend primitives in `src/components/ui` before creating one-off controls. Preserve accessibility: semantic HTML, keyboard interaction, visible focus states, and accessible names are required.

## Testing and Delivery

Tests use Vitest, jsdom, and Testing Library. Colocate tests as `*.test.tsx`, query by accessible role or visible text, and assert user-observable behavior. Add focused regression coverage for changed interactions.

Use Conventional Commit subjects such as `feat: add customer table` or `fix: preserve invoice filters`. Pull requests must describe visible behavior, verification performed, and API contract or environment changes; include screenshots for UI changes. Document new `VITE_*` variables in `.env.example` and never commit secrets.
