# Establish the shared authenticated `/app` shell

Status: ready-for-agent

## Parent

- [PRD](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/authenticated-app-shell/PRD.md)

## What to build

Deliver the first complete authenticated shell path by moving route protection to a shared `/app` layout boundary and keeping `/app` as the real `Home` route inside that shell. The shell should provide one persistent authenticated layout with a fixed application bar, route-owned page metadata, and a shared neutral `Home` empty-state surface so signing in lands the user in a coherent product frame instead of a one-off protected page.

## Acceptance criteria

- [ ] Unauthenticated visits to `/app` redirect to `/sign-in`, while authenticated visits render the shared shell without exposing protected content before session validation.
- [ ] `/app` remains the real authenticated `Home` route and renders inside the shared shell with title `Home`, subtitle `Work in progress…`, and the neutral empty-state surface.
- [ ] The application bar presents route-owned page metadata with a required title, optional subtitle, fixed placement, and a reserved right-side actions area that remains empty in this slice.

## Blocked by

None - can start immediately
