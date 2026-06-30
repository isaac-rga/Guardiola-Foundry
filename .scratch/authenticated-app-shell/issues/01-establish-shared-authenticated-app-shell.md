# Establish the shared authenticated `/app` shell

Status: ready-for-agent

## Parent

- [PRD](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/authenticated-app-shell/PRD.md)

## What to build

Deliver the first complete authenticated shell path by moving route protection to a shared `/app` layout boundary and keeping `/app` as the real `Home` route inside that shell. The shell should provide one persistent authenticated layout with shared navigation, page-owned visible header content, and a shared neutral `Home` empty-state surface so signing in lands the user in a coherent product frame instead of a one-off protected page.

## Acceptance criteria

- [ ] Unauthenticated visits to `/app` redirect to `/sign-in`, while authenticated visits render the shared shell without exposing protected content before session validation.
- [ ] `/app` remains the real authenticated `Home` route and renders inside the shared shell with the neutral empty-state surface and page identity owned by the destination page body.
- [ ] The shared shell does not own a fixed page-title bar; visible page identity for this slice is rendered within the authenticated page body.

## Blocked by

None - can start immediately
