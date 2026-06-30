# Authenticated App Shell

This slice turns `/app` from one protected placeholder page into the first real authenticated shell.

The behavior change is:

- auth protection now lives at the shared `/app` boundary
- `/app` remains the real authenticated `Home` route
- page title and optional subtitle now belong to each authenticated route
- the shell provides one persistent application frame with sidebar navigation and a fixed app bar
- `Password Change` moves into `/app/user-settings`
- the throwaway prototype shell route is removed

If you are reviewing the patch, read it in this order.

## 1. The shared shell seam

Start in:

- `apps/web/src/routes/app.tsx`
- `apps/web/src/features/app-shell/authenticated-app-shell.tsx`

`app.tsx` is no longer the authenticated page itself. It is now the protected layout route.

That route still does the same session-sensitive work it owned before:

1. require a valid current session before rendering
2. sign out the current session
3. change the current user password
4. clear stored auth state and return to `/sign-in` on success

What changed is where those behaviors render. Instead of passing everything into one page component, the route now renders `AuthenticatedAppShell` and an `Outlet`.

That shell owns the persistent frame:

- the sidebar and app bar
- the shared account menu
- the per-route page metadata contract
- the full-width authenticated content surface

This is the main architectural move in the slice: auth stays at the highest practical seam, and authenticated pages become children inside that frame.

## 2. Route-owned page identity

Next read:

- `apps/web/src/routes/app.index.tsx`
- `apps/web/src/routes/app.products.tsx`
- `apps/web/src/routes/app.materials.tsx`
- `apps/web/src/routes/app.inventory.tsx`
- `apps/web/src/routes/app.bills-of-materials.tsx`
- `apps/web/src/routes/app.user-settings.tsx`

Each authenticated route now declares its own title and optional subtitle by rendering through `AppShellPage`.

That gives the shell one simple contract:

- every page must provide a title
- pages may provide a subtitle
- the shell app bar renders that metadata consistently

For this first slice:

- `Home` uses title `Home`
- the placeholder routes use subtitle `Work in progress…`
- `User Settings` omits the subtitle so the app bar collapses to the shorter form

This keeps page identity in the route layer instead of hiding it inside feature components.

## 3. Shared placeholder surface

Then stay in:

- `apps/web/src/features/app-shell/authenticated-app-shell.tsx`

`WorkInProgressPage` is the shared neutral empty-state surface used by:

- `Home`
- `Products`
- `Materials`
- `Inventory`
- `Bills of Materials`

The important detail here is what it does not do: it does not repeat the page title inside the page body.

That leaves the fixed app bar as the one visible page-title surface, which was one of the explicit goals of the shell design.

## 4. Sidebar and account menu behavior

Still in:

- `apps/web/src/features/app-shell/authenticated-app-shell.tsx`

Read the navigation and account menu together.

The sidebar now establishes the first real authenticated information architecture:

- `Home`
- `Products`
- `Materials`
- `Inventory`
- `Bills of Materials`

Two decisions are worth noticing:

1. `Home` is interactive but is not implemented as an active TanStack link, so it never picks up the active highlight rule.
2. `User Settings` lives outside the main navigation and is reached from the bottom account menu.

The account menu also carries the current signed-in identity:

- fallback avatar from the first email letter
- email address
- human-friendly role label

`Log Out` still goes through the same current-session logout path; it is just surfaced from a persistent shared place instead of the old placeholder page.

## 5. User settings page

Then read:

- `apps/web/src/features/auth/user-settings-page.tsx`

This is where the old protected-page account content moved.

The page now combines:

- a small read-only account summary
- the existing password-change form

The password-change behavior itself stays intentionally unchanged:

- same shared Zod validation
- same field set
- same API call
- same success path back to `/sign-in`
- same inline error handling on failure

The slice changes placement, not policy.

## 6. Route tree and cleanup

Then glance at:

- `apps/web/src/routeTree.gen.ts`

This reflects the new nested authenticated route structure under `/app`.

It also shows an important cleanup outcome: the throwaway `/prototype/app-shell` route is gone because the real shell now exists.

## 7. Tests

Finally read:

- `apps/web/src/routes/-app.test.tsx`
- `apps/web/src/routes/-sign-in.test.tsx`
- `apps/web/src/test/setup.ts`

The old `/app` tests were centered on one placeholder page. They now verify shell behavior at the route boundary instead:

1. unauthenticated `/app` access redirects before shell content renders
2. authenticated `/app` lands on `Home` inside the shared shell
3. child routes surface their own metadata in the fixed app bar
4. `User Settings` renders inside the same shell and preserves password-change behavior
5. sign-in still lands on `/app`
6. logout still clears the current session and returns to sign-in

The small `matchMedia` and `scrollTo` shims in `src/test/setup.ts` are there because the shared sidebar primitives need those browser APIs in jsdom.

## 8. Verification

The checks for this slice were:

- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH ./node_modules/.bin/vitest run` in `apps/web`
- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH ./node_modules/.bin/tsc -b --pretty false` in `apps/web`
- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH ./node_modules/.bin/oxlint` in `apps/web`
- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH CI=true node ace.js test functional` in `apps/api`

## 9. What this does not do

This patch stays narrow on purpose. It does not add:

- real business content for the authenticated work areas
- role-based navigation differences
- global search, notifications, or app-bar actions
- new password-management behavior beyond relocating the existing flow
- a second shell implementation alongside the real one

That keeps the diff tied to the issue: establish one shared authenticated shell and move the existing account flow into it.
