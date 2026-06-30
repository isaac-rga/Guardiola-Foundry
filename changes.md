# Collapsible Rail Persistence And Mobile Shell Behavior

This slice completes `.scratch/authenticated-app-shell/issues/03-add-collapsible-rail-persistence-and-mobile-shell-behavior.md`.

The branch already had the authenticated shell, the icon-rail-capable sidebar primitive, and the mobile sheet. What this issue needed was the interaction model to become reliable:

- desktop collapse had to survive a fresh browser session
- mobile route-changing actions had to dismiss the sheet before leaving it behind
- authenticated route changes had to reset the shared content region to the top

If you are reviewing the patch, read it in this order.

## 1. The shell still lives at the `/app` layout seam

Start with:

- `apps/web/src/routes/app.tsx`
- `apps/web/src/features/app-shell/authenticated-app-shell.tsx`

The auth seam did not move. `/app` is still the protected layout route, and it still owns the shared shell plus the existing password-change and sign-out actions.

That matters because this issue is not another auth slice. It is a shell-behavior slice layered onto the existing authenticated boundary.

## 2. Desktop collapse state is now restored from browser-local storage

Stay in:

- `apps/web/src/features/app-shell/authenticated-app-shell.tsx`

The shell now controls the desktop sidebar open state instead of relying on the sidebar primitive's default-open-only behavior.

The important additions are:

- `SHELL_SIDEBAR_STORAGE_KEY`
- `readPersistedSidebarOpenState()`
- `persistSidebarOpenState()`
- a controlled `SidebarProvider`

Before this change, the shell could collapse during the current session, but a fresh mount came back expanded because nothing restored the prior state into React.

After this change:

- collapsing the desktop shell writes `true` or `false` into browser-local storage
- the next authenticated shell mount reads that value immediately
- the existing desktop icon rail continues to work without changing the route seam

This keeps the diff small: the shell owns the persistence requirement, and the existing sidebar primitive still owns the visual collapse behavior.

## 3. Mobile route changes now dismiss the transient shell first

Still in:

- `apps/web/src/features/app-shell/authenticated-app-shell.tsx`

The new `AuthenticatedAppShellFrame` uses `useSidebar()` so route-changing actions can see whether the mobile sheet is open.

That frame centralizes the route-changing shell actions:

- clicking the brand header
- clicking `Home`
- clicking any main navigation item
- choosing `User Settings`
- choosing `Log Out`

On mobile, those actions now close the sheet before continuing with navigation or logout. On desktop, the same handlers simply navigate.

This is intentionally direct. There is no new abstraction layer or route metadata system here because the issue only needs reliable shell behavior, not a bigger navigation architecture.

## 4. The authenticated content region is now the thing that scrolls

Then read the lower part of:

- `apps/web/src/features/app-shell/authenticated-app-shell.tsx`

The shell now gives the authenticated page body its own explicit scroll container:

- `SidebarInset` is constrained to the viewport height
- the inner content wrapper gets `overflow-y-auto`
- that wrapper is tagged with `data-authenticated-content="true"`

An effect keyed by `location.pathname` resets that content region's `scrollTop` to `0`.

That matches the slice contract:

- the shell keeps one stable content surface
- authenticated route changes reset the work area to the top
- the behavior lives at the shell seam instead of being reimplemented in each page

## 5. The tests now cover the new shell contract at the route boundary

Then read:

- `apps/web/src/routes/-app.test.tsx`
- `apps/web/src/test/setup.ts`

The route suite now verifies the behaviors this issue adds:

- the collapsed desktop rail is restored after the shell remounts
- the authenticated content region resets to the top after route changes
- the mobile sidebar sheet dismisses before navigating to another authenticated route

`apps/web/src/test/setup.ts` also now stubs `ResizeObserver` and a default desktop `innerWidth` so the mobile sheet path can be tested reliably in jsdom.

This keeps the verification at the preferred seam from the PRD: the real router plus the real authenticated shell, not low-level unit tests of helper functions.

## 6. What did not change

This patch does not change:

- the authenticated route structure
- the main navigation labels or order
- the existing icon rail and tooltip behavior
- the `User Settings` or password-change contract
- the logout API flow

That is deliberate. The issue only asked for persistence, mobile dismissal behavior, and scroll reset.

## 7. Verification

The checks that passed for this slice were:

- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH ./node_modules/.bin/vitest run src/routes/-app.test.tsx --reporter=verbose` in `apps/web`
- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH ./node_modules/.bin/vitest run --reporter=dot` in `apps/web`
- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH ./node_modules/.bin/tsc -b --pretty false` in `apps/web`
- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH ./node_modules/.bin/oxlint src` in `apps/web`
- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH ./node_modules/.bin/tsc --noEmit` in `apps/api`

The full repository test wrapper, `pnpm test`, did not produce usable output in this environment, so I switched to direct package-level commands.

The API test suite could not be completed here because `apps/api` test startup fails in this sandbox with:

- `Error: listen EPERM: operation not permitted 0.0.0.0:3333`

So the web slice is verified, and the remaining monorepo test gap is environmental rather than caused by this change.

## 8. Technical debt

- The shell now owns both desktop persistence and mobile route-dismiss behavior in one file. That is the right scope for this slice, but if more shell interactions land later, it may be worth extracting a small route-action helper inside the app-shell feature instead of growing `authenticated-app-shell.tsx` indefinitely.
