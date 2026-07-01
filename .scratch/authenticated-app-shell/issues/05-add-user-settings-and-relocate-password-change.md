# Add `User Settings` and relocate password change

Status: ready-for-agent

## Parent

- [PRD](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/authenticated-app-shell/PRD.md)

## What to build

Deliver the account-management destination by adding `/app/user-settings` inside the shared authenticated shell and moving the existing `Password Change` flow there without changing its behavior. The page should show the small read-only account summary above the form, stay inside the same interactive main shell, and be reachable from the account menu while preserving the existing sign-out-after-password-change policy.

## Acceptance criteria

- [ ] Authenticated users can open `/app/user-settings` from the account menu, remain inside the shared shell, and see page title `User Settings` with no subtitle.
- [ ] The `User Settings` page shows the read-only account summary with `Email` and `Role` above the existing password-change form.
- [ ] The relocated password-change flow keeps its current validation, error handling, and post-success sign-out behavior while the account menu still closes on selection.

## Blocked by

- [01-establish-shared-authenticated-app-shell](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/authenticated-app-shell/issues/01-establish-shared-authenticated-app-shell.md)
- [04-add-bottom-account-menu-and-shell-level-logout](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/authenticated-app-shell/issues/04-add-bottom-account-menu-and-shell-level-logout.md)
