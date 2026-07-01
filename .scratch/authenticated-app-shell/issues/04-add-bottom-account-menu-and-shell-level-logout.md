# Add the bottom account menu and shell-level logout

Status: ready-for-agent

## Parent

- [PRD](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/authenticated-app-shell/PRD.md)

## What to build

Deliver the persistent account-actions path by replacing the current inline signed-in panel with a bottom-anchored account menu in the authenticated shell. The trigger should use a generated fallback avatar from the `Email Address`, show email and human-readable role when expanded, reduce to avatar-only in the collapsed rail, and provide a popover with user actions followed by a standalone `Log Out` action that works from any authenticated page.

## Acceptance criteria

- [ ] The sidebar bottom area contains an account trigger that shows the email-initial fallback avatar, displays `Email Address` and role when expanded, and reduces to an avatar-only control in the collapsed rail.
- [ ] The floating account popover opens above the trigger, closes on outside interaction, and always closes when a menu item is selected.
- [ ] Selecting `Log Out` from the account menu signs out the current authenticated session and returns the user to `/sign-in` from any authenticated page.

## Blocked by

- [01-establish-shared-authenticated-app-shell](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/authenticated-app-shell/issues/01-establish-shared-authenticated-app-shell.md)
