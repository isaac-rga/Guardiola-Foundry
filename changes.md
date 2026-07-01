# Bottom Account Menu And Shell-Level Logout

This slice completes `.scratch/authenticated-app-shell/issues/04-add-bottom-account-menu-and-shell-level-logout.md`.

The shared shell was already in place on this branch. What this issue finishes is the account-control path at the bottom of that shell: the menu now behaves like a real shell action surface instead of a mostly-correct dropdown.

If you are reviewing the patch, read it in this order.

## 1. The shell-level auth actions still live at the `/app` layout seam

Start with:

- `apps/web/src/routes/app.tsx`
- `apps/web/src/features/app-shell/authenticated-app-shell.tsx`

`/app` is still the protected layout route, and it still owns the current-session actions for password change and logout.

That seam matters for this issue because `Log Out` is supposed to work from any authenticated page. The route layout remains the one place that can guarantee that behavior without re-implementing sign-out logic in each child route.

## 2. The bottom account trigger still shows identity inline, but the menu is now controlled explicitly

Stay in:

- `apps/web/src/features/app-shell/authenticated-app-shell.tsx`

The trigger still follows the contract from the PRD:

- the fallback avatar uses the first letter of the authenticated email address
- the expanded sidebar shows email plus a human-readable role
- the collapsed rail keeps only the avatar control

The important change in this slice is that `AccountMenu` now owns an explicit `menuOpen` state through Radix's controlled dropdown API.

Before this change, the dropdown was relying on default menu behavior. That worked for some cases, but it broke down once `Log Out` needed custom asynchronous handling. The old logout handler prevented the menu's default select behavior, which meant the menu could stay open while sign-out was in flight.

After this change, item selection closes the menu intentionally before any follow-up action continues.

## 3. `User Settings` and `Log Out` now follow the same shell-action rule

Still in:

- `apps/web/src/features/app-shell/authenticated-app-shell.tsx`

The account popover still has the same two action groups:

- `User Settings`
- `Log Out`

What changed is the behavior contract around those actions.

`User Settings` now uses the shell's route action directly instead of delegating to a nested link. That keeps the menu behavior and the route behavior in one place:

- close the account menu
- dismiss the mobile sheet if it is open
- navigate to `/app/user-settings`

`Log Out` now follows the same pattern:

- close the account menu first
- dismiss the mobile sheet if it is open
- call the existing shell-level sign-out handler

This keeps the implementation small and makes the menu behavior predictable even when the underlying action is asynchronous.

## 4. Collapsed and mobile menus now use the compact popover width the PRD asked for

Still in:

- `apps/web/src/features/app-shell/authenticated-app-shell.tsx`

The menu width now depends on shell state:

- expanded desktop keeps matching the trigger width
- collapsed desktop uses a compact fixed width
- mobile also uses the compact fixed width

That fixes an important shell-detail bug. In the collapsed rail, the trigger becomes an avatar-sized button. Reusing the trigger width there made the popover collapse down toward the trigger size, which is not the intended account-menu presentation.

The shell now checks the sidebar state and only uses trigger-width sizing when the desktop sidebar is actually expanded.

## 5. The regression coverage stays at the route seam

Then read:

- `apps/web/src/routes/-app.test.tsx`

The existing shell route suite already covered authenticated rendering, navigation, and a basic logout path. This slice adds a tighter regression around the account-menu contract:

- open the menu from an authenticated child route
- select `Log Out`
- verify the menu disappears immediately
- then let the logout request resolve and verify redirect to `/sign-in`

That test matters because it proves the menu closes before the asynchronous sign-out completes, which is the user-visible behavior this issue was missing.

## 6. What did not change

This patch does not change:

- the `/app` route structure
- main navigation ordering or active-state rules
- the password-change flow
- session-storage clearing behavior
- the logout API contract

That is deliberate. The issue asked for the bottom account menu and reliable shell-level logout behavior, not another shell architecture pass.

## 7. Verification

The checks for this slice were:

- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH ./node_modules/.bin/vitest run src/routes/-app.test.tsx --reporter=verbose` in `apps/web`
- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH ./node_modules/.bin/oxlint src` in `apps/web`
- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH ./node_modules/.bin/tsc -b --pretty false` in `apps/web`

I will also run the broader test pass at the end of the implementation flow, per the repo guidance and the `implement` skill.

## 8. Technical debt

- The account menu still keeps trigger rendering, width policy, and action wiring in one component. That is fine at this size, but if more account actions arrive later, the menu-action wiring could be extracted into a small shell-local helper to keep the component from accumulating branching UI behavior.
