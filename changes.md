# Authenticated Work-Area Routes And Navigation

This slice completes `.scratch/authenticated-app-shell/issues/02-add-authenticated-work-area-routes-and-navigation`.

The goal here is deliberately small: make the authenticated information architecture real without pretending the domain pages already exist. After this change, the signed-in shell exposes real URLs for `Home`, `Products`, `Materials`, `Inventory`, and `Bills of Materials`, and each route owns its own visible page identity while sharing the same neutral placeholder body.

If you are reviewing the patch, read it in this order.

## 1. The authenticated route boundary stays the seam

Start in:

- `apps/web/src/routes/app.tsx`
- `apps/web/src/features/app-shell/authenticated-app-shell.tsx`

Nothing about the auth boundary changes for this issue.

`/app` is still the protected layout route. It still:

1. requires a valid current session before rendering
2. signs out the current session
3. changes the current user password
4. clears stored auth state and returns to `/sign-in` after successful auth actions

That matters because issue 02 is not a new auth slice. It is a navigation and route-structure slice built on top of the shell seam from issue 01.

## 2. The work areas are real routes, not one placeholder screen

Next read:

- `apps/web/src/routes/app.index.tsx`
- `apps/web/src/routes/app.products.tsx`
- `apps/web/src/routes/app.materials.tsx`
- `apps/web/src/routes/app.inventory.tsx`
- `apps/web/src/routes/app.bills-of-materials.tsx`

These routes already existed on the branch, and this patch keeps them as the real route boundary for each work area:

- `/app`
- `/app/products`
- `/app/materials`
- `/app/inventory`
- `/app/bills-of-materials`

The important part of this issue is that navigation now lands on route-specific pages that are intentionally simple instead of showing rich example compositions that made the slice look more implemented than it is.

## 3. Page identity is route-owned, but the placeholder body is shared

Then read:

- `apps/web/src/features/app-shell/workspace-pages.tsx`
- `apps/web/src/components/app/page-header.tsx`

This file is where the main implementation changed.

Before this patch, the work-area routes rendered elaborate example screens with tables, dialogs, metrics, and other domain-shaped placeholders. That drifted past the issue scope and broke the acceptance criteria for this slice, which call for:

- real authenticated routes
- route-owned visible page identity
- one shared centered neutral empty-state surface
- no duplicate page-title surface inside the page body

The new `workspace-pages.tsx` is intentionally narrow:

- each route renders a `PageHeader` with its own title and short description
- each route then renders the same centered placeholder surface
- that shared surface shows `Work in progress…`
- the body no longer repeats the route title inside the placeholder card

That keeps the architectural contract honest:

- navigation identity belongs to the destination route
- the shell stays focused on layout and navigation
- future business pages can replace the placeholder body without reopening auth or shell concerns

## 4. Navigation behavior stays persistent and ordered

Stay in:

- `apps/web/src/features/app-shell/authenticated-app-shell.tsx`

The sidebar navigation order remains:

1. `Home`
2. `Products`
3. `Materials`
4. `Inventory`
5. `Bills of Materials`

The active-state rule stays aligned with the PRD and issue:

- `Home` stays interactive on `/app`
- `Home` does not show the active highlight
- non-Home work-area routes do show the active highlight when selected

This means the shell continues to provide persistent navigation, but the route body is now visually honest about what is and is not implemented yet.

## 5. The tests now assert the real issue contract

Then read:

- `apps/web/src/routes/-app.test.tsx`
- `apps/web/src/routes/-sign-in.test.tsx`

The route tests now verify the behaviors this issue actually cares about:

- `/app` renders `Home` inside the authenticated shell
- child routes render their own page identity
- every work-area route shows the shared `Work in progress…` placeholder
- the main navigation order is preserved
- `Home` does not expose an active route state
- non-Home destinations do expose active route state
- sign-in still lands the user inside the authenticated home route

This keeps the verification at the preferred seam: the real router plus the real shell, rather than lower-level component tests.

## 6. What did not change

This patch does not add:

- real domain workflows for products, materials, inventory, or bills of materials
- role-based navigation differences
- changes to `User Settings`
- changes to logout behavior
- changes to password-change behavior

That is intentional. The slice is about route structure and navigation truthfulness, not about filling the pages in early.

## 7. Verification

The checks run for this slice were:

- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH ./node_modules/.bin/vitest run src/routes/-app.test.tsx` in `apps/web`
- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH ./node_modules/.bin/vitest run` in `apps/web`
- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH ./node_modules/.bin/tsc -b --pretty false` in `apps/web`
- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH ./node_modules/.bin/oxlint src` in `apps/web`

`pnpm typecheck` was attempted first, but it did not return in this environment, so the equivalent direct TypeScript build check was used instead.

## 8. Technical debt

- `apps/web/src/features/app-shell/workspace-pages.tsx` still centralizes all five work-area placeholders in one file. That is acceptable for this slice, but each real domain page should move to its own feature module when actual functionality starts landing.
- The shell now has a clearer placeholder contract, but the branch still contains later-slice artifacts like `User Settings`. That is fine for the current branch, though it means future issue-by-issue review should stay disciplined about which acceptance criteria are being claimed at each step.
