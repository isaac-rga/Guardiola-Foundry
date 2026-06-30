# Authenticated App Shell

This branch keeps the shared authenticated `/app` shell, but removes the stale idea that the shell owns a fixed application bar or route-level page metadata contract.

The current contract is simpler and matches the implementation:

- auth protection lives at the shared `/app` boundary
- the shell owns the persistent sidebar, account menu, and authenticated frame
- authenticated pages render inside that frame
- each page owns its own visible header and body composition
- `User Settings` stays inside the shell and continues to host password change

If you are reviewing the patch, read it in this order.

## 1. The shared shell seam

Start in:

- `apps/web/src/routes/app.tsx`
- `apps/web/src/features/app-shell/authenticated-app-shell.tsx`

`app.tsx` remains the protected layout route for the authenticated application.

That route still owns the same session-sensitive behavior:

1. require a valid current session before rendering
2. sign out the current session
3. change the current user password
4. clear stored auth state and return to `/sign-in` on success

The shell owns the persistent frame around authenticated pages:

- sidebar navigation
- sidebar collapse behavior
- shared account menu
- authenticated content frame

What it no longer pretends to own is page-title rendering. There is no shell-level app bar contract in the code anymore.

## 2. Route pages now render directly

Next read:

- `apps/web/src/routes/app.index.tsx`
- `apps/web/src/routes/app.products.tsx`
- `apps/web/src/routes/app.materials.tsx`
- `apps/web/src/routes/app.inventory.tsx`
- `apps/web/src/routes/app.bills-of-materials.tsx`
- `apps/web/src/routes/app.user-settings.tsx`

These routes now render their page modules directly.

The cleanup here is intentional: the old `AppShellPage` wrapper exposed title, subtitle, and eyebrow props that the shell never consumed. Keeping that wrapper would leave a dead architectural seam in place and continue to suggest a shell-level metadata contract that does not exist.

After this change, the route layer no longer claims to provide shell metadata. It just selects which authenticated page to render inside the shared frame.

## 3. Page identity belongs to the page body

Then read:

- `apps/web/src/features/app-shell/workspace-pages.tsx`
- `apps/web/src/components/app/page-header.tsx`
- `apps/web/src/features/auth/user-settings-page.tsx`

This is the real page-identity seam today.

The workspace pages render their own visible headers through `PageHeader`, and `User Settings` renders its own card-based account summary and password section inside the page body. That means:

- navigation labels and page headings are allowed to diverge
- page composition stays owned by the page module
- the shell can stay focused on auth, navigation, and shared layout

This matches the implementation the branch already had; the cleanup just makes the contract honest.

## 4. Navigation and account behavior

Stay in:

- `apps/web/src/features/app-shell/authenticated-app-shell.tsx`

The first real authenticated information architecture is still:

- `Home`
- `Products`
- `Materials`
- `Inventory`
- `Bills of Materials`

`User Settings` still lives outside the main navigation and is reached from the bottom account menu.

The account menu still carries the current signed-in identity:

- fallback avatar from the first email letter
- email address
- human-friendly role label

`Log Out` still uses the same current-session logout behavior; it is just available from the shared shell instead of a one-off protected page.

## 5. User settings remains inside the shell

Then read:

- `apps/web/src/features/auth/user-settings-page.tsx`

This page still combines:

- a read-only account summary
- the existing password-change form

The password-change behavior stays intentionally unchanged:

- same shared Zod validation
- same field set
- same API call
- same success path back to `/sign-in`
- same inline error handling on failure

This branch is about shell structure and contract cleanup, not auth-policy changes.

## 6. PRD alignment

Then read:

- `.scratch/authenticated-app-shell/PRD.md`

The PRD now matches the implemented architecture:

- no fixed shell-level application bar
- no route-to-shell metadata contract
- page headers are page-owned, not shell-owned
- the shell contract is auth, layout, navigation, and account actions

That removes the main context mismatch that was present before this cleanup.

## 7. Tests

Finally read:

- `apps/web/src/routes/-app.test.tsx`
- `apps/web/src/routes/-sign-in.test.tsx`
- `apps/web/src/test/setup.ts`

The route tests still verify the shell at the authenticated boundary:

1. unauthenticated `/app` access redirects before protected content renders
2. authenticated `/app` lands inside the shared shell
3. child routes render their own page-specific header/content inside that shell
4. `User Settings` renders inside the same shell and preserves password-change behavior
5. sign-in still lands on `/app`
6. logout still clears the current session and returns to sign-in

The small `matchMedia` and `scrollTo` shims in `src/test/setup.ts` still exist because the shared sidebar primitives need those browser APIs in jsdom.

## 8. Verification

The checks for this cleanup are:

- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH ./node_modules/.bin/vitest run` in `apps/web`
- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH ./node_modules/.bin/tsc -b --pretty false` in `apps/web`
- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH ./node_modules/.bin/oxlint` in `apps/web`

## 9. What this still does not do

This branch still does not add:

- real business content for the authenticated work areas
- role-based navigation differences
- global search, notifications, or breadcrumbs
- a fixed shell-level page-title surface
- browser document-title management

That keeps the implementation narrow: one shared authenticated shell, page-local page composition, and no dead metadata contract.

## 10. Technical debt

- `apps/web/src/features/app-shell/workspace-pages.tsx` is a large mixed-responsibility reference bundle that combines five route bodies, local dialog state, sample data, and shared helper components in one file. That keeps the shell slice moving, but it raises collision risk for future domain work and makes replacement with real pages less incremental.
- Route coverage in `apps/web/src/routes/-app.test.tsx` proves the happy-path shell seam, but it does not exercise the highest-risk shell behaviors called out in the PRD: sidebar collapse persistence, mobile sheet dismissal on navigation, menu-close-on-selection, and reset-to-top behavior for repeated/current-route navigation.
- Shared primitives under `apps/web/src/components/ui/` were expanded as part of the shell rollout, even though `apps/web/AGENTS.md` treats those files as a last-resort seam. The current branch has no primitive-level regression tests around the added sidebar, sheet, and dropdown interactions, so future shell work can regress shared UI behavior outside the app-shell feature boundary.
- The current page-header contract is conventional rather than enforced. Future authenticated pages can still drift visually if they bypass `PageHeader` or invent competing header patterns without a tighter shared page-composition convention.
