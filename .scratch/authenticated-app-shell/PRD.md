# Authenticated App Shell

Status: ready-for-agent

## Problem Statement

Guardiola Foundry currently treats `/app` as a single protected page that mixes together route protection, current authenticated `User` display, `Password Change`, and sign-out actions inside one placeholder screen. That makes the authenticated experience too shallow for the next phase of the product: there is no persistent application shell, no stable navigation between work areas, no place for page-level identity like titles and subtitles, no bottom-anchored account menu, and no structure for introducing `Products`, `Materials`, `Inventory`, `Bills of Materials`, or `User Settings` as real authenticated destinations. The result is that protected access works, but the application does not yet feel like a coherent signed-in product for an `Admin` or `Operator`.

## Solution

Introduce a shared authenticated app shell rooted at `/app` that owns route protection, persistent sidebar behavior, shared navigation across real authenticated child routes, and the bottom-anchored account menu. The shell will include `Home`, `Products`, `Materials`, `Inventory`, and `Bills of Materials` in the main navigation, with `User Settings` and `Log Out` available from a bottom-anchored user menu. The shell will support a persistent collapsible sidebar with an icon rail, use one consistent layout model across desktop and mobile, keep page identity visually consistent while allowing each authenticated page to own its visible header content, and move the existing `Password Change` flow into `/app/user-settings`. Placeholder pages will be real authenticated routes with intentional empty-state surfaces, so the shell can be integrated cleanly before deeper page content is implemented.

## User Stories

1. As a `User`, I want `/app` to feel like a real authenticated home area, so that signing in takes me into a coherent product shell instead of a one-off placeholder page.
2. As a `User`, I want the authenticated shell to protect all app routes consistently, so that deep-linking into any work area requires a valid authenticated session.
3. As a `User`, I want the main application navigation to stay visible across authenticated pages, so that I can move between work areas without losing context.
4. As a `User`, I want a `Home` destination in the sidebar, so that I always have an obvious way to return to the authenticated landing page.
5. As a `User`, I want `Products`, `Materials`, `Inventory`, and `Bills of Materials` to be real authenticated pages, so that the app structure matches the work areas it is preparing to support.
6. As a `User`, I want `User Settings` to be a real authenticated page, so that account management has a stable destination in the app.
7. As a `User`, I want each authenticated page to have its own URL, so that browser navigation and direct links behave naturally.
8. As a `User`, I want the app shell to preserve the same layout while the page body changes, so that moving between screens feels continuous.
9. As a `User`, I want the sidebar header to navigate me back to `Home`, so that the brand area is also a usable return path.
10. As a `User`, I want the `Home` sidebar item to remain interactive even when I am already on `/app`, so that I can use it as a reliable “return to top” action later.
11. As a `User`, I want `Home` to be the one navigation item that never shows the active highlight, so that the shell follows the agreed visual rule for the landing page.
12. As a `User`, I want the currently selected domain page to show an active navigation highlight, so that I can always tell where I am in the app.
13. As a `User`, I want active highlighting to work the same way in the expanded sidebar and in the collapsed icon rail, so that sidebar mode does not change navigation meaning.
14. As a `User`, I want the sidebar to collapse into an icon rail instead of disappearing entirely, so that I can reclaim space without losing persistent navigation.
15. As a `User`, I want the collapsed rail icons to show tooltips, so that navigation remains discoverable even when labels are hidden.
16. As a `User`, I want the sidebar collapse state to persist as I move between authenticated pages, so that the shell respects my chosen working layout.
17. As a `User`, I want the sidebar collapse state to persist if I close the app and return later on the same browser, so that the shell remembers my local preference.
18. As a `User`, I want each authenticated page to surface its own identity within the page body, so that page context stays clear without requiring shell-level title chrome.
19. As a `User`, I want page identity to update immediately when I navigate, so that the content always matches my current route without delay.
20. As a `User`, I want pages that need less context to use a shorter header treatment, so that the interface does not reserve empty shell-level space unnecessarily.
21. As a `User`, I want page-specific actions to remain owned by each page composition, so that future controls can be added without reshaping the shared shell.
22. As a `User`, I want the shared shell to stay focused on navigation and account access, so that page identity remains a responsibility of the destination page.
23. As a `User`, I want the content region below the shell chrome to use one consistent app surface, so that page bodies feel like part of one authenticated environment.
24. As a `User`, I want the content region to use full-width space by default, so that future operational screens are not boxed into a narrow layout too early.
25. As a `User`, I want placeholder screens to feel intentionally unfinished rather than broken, so that empty routes still read as part of a deliberate product structure.
26. As a `User`, I want `Home`, `Products`, `Materials`, `Inventory`, and `Bills of Materials` to use the same centered neutral empty-state surface for now, so that the first shell slice stays visually consistent.
27. As a `User`, I want those placeholder pages to show `Work in progress…`, so that the app makes it obvious that content is still forthcoming.
28. As a `User`, I want placeholder pages to avoid duplicate page-title surfaces inside the page body, so that page identity stays clean and intentional.
29. As a `User`, I want the bottom of the sidebar to contain a user menu, so that account-related actions live in one predictable place.
30. As a `User`, I want the user menu trigger to show a fallback avatar generated from my `Email Address`, so that the shell presents signed-in identity without needing profile data that does not exist yet.
31. As a `User`, I want the expanded user menu trigger to show my `Email Address` and role, so that my identity context is visible without opening the menu.
32. As a `User`, I want the collapsed user menu trigger to reduce to an avatar-only control, so that it matches the compact icon-rail behavior.
33. As a `User`, I want the user menu to open in a floating popover above the bottom trigger, so that the menu remains visually anchored to the sidebar.
34. As a `User`, I want the expanded user menu popover width to match the trigger width, so that the menu feels like part of the shell rather than a detached card.
35. As a `User`, I want the collapsed or mobile user menu popover to use a compact fixed width, so that it still feels intentional when less trigger space is available.
36. As a `User`, I want the user menu to close when I click outside it, so that it behaves like a normal contextual popover.
37. As a `User`, I want the user menu to close when I select `User Settings`, so that the app does not leave transient UI open after navigation.
38. As a `User`, I want the user menu to close when I select `Log Out`, so that the transient menu disappears before the app signs me out.
39. As a `User`, I want `User Settings` to stay inside the same authenticated shell as the rest of the app, so that account management does not feel like a separate subsystem.
40. As a `User`, I want the full main sidebar navigation to remain interactive while I am on `User Settings`, so that I can move back into the app without changing navigation mode.
41. As a `User`, I want `User Settings` to show a small read-only account summary with my `Email Address` and role, so that the page reflects my current identity before presenting account actions.
42. As a `User`, I want `User Settings` to contain the existing `Password Change` flow, so that account-management actions live in the correct destination after the shell is introduced.
43. As a `User`, I want the `Password Change` form behavior to remain unchanged in `User Settings`, so that moving the form does not silently change validation or submission rules.
44. As a `User`, I want a successful `Password Change` to keep the current sign-out-after-change behavior, so that password-rotation policy stays consistent with the existing auth design.
45. As a `User`, I want `Log Out` to work from any authenticated page, so that session exit is always available regardless of where I am in the app.
46. As a `User`, I want `Log Out` to clear my current session and return me to `/sign-in`, so that protected content is no longer accessible once I sign out.
47. As a `User`, I want direct links to authenticated child routes like `/app/products` and `/app/user-settings` to work when I have a valid session, so that the route structure is real, not simulated.
48. As a `User`, I want unauthenticated visits to any `/app` route to redirect me to `/sign-in` before shell content renders, so that protected app structure is never exposed without access.
49. As a mobile `User`, I want the same shell concepts to work on small screens, so that mobile navigation does not invent a separate product model.
50. As a mobile `User`, I want a sidebar trigger to remain available in the shell, so that I can open the sidebar sheet without introducing separate mobile-only shell chrome.
51. As a mobile `User`, I want page identity to remain clear after the sidebar sheet closes, so that smaller screens still preserve destination context through the page body.
52. As a mobile `User`, I want selecting any main navigation item in the sidebar sheet to close the sheet first and then navigate, so that transient navigation UI does not linger over the destination page.
53. As a mobile `User`, I want tapping the clickable sidebar header in the sheet to close the sheet and then navigate to `/app`, so that the header follows the same route-changing rule as other navigation actions.
54. As a mobile `User`, I want tapping `Log Out` in the sheet flow to dismiss the sheet before sign-out and redirect, so that transient shell behavior stays consistent even for session exit.
55. As a mobile `User`, I want the same popover-based user menu behavior inside the sidebar sheet, so that the bottom account control behaves like the desktop shell rather than switching patterns.
56. As a developer, I want the authenticated shell to be implemented at the highest practical seam, so that layout, auth, navigation, and page identity can be tested mostly through route-level behavior.
57. As a developer, I want each authenticated page to own its visible header content within the page body, so that page identity does not depend on shell-level metadata plumbing.
58. As a developer, I want navigation labels and page identity surfaces to remain independently configurable, so that short sidebar labels do not constrain fuller page composition over time.
59. As a developer, I want the first shell slice to keep the same navigation for `Admin` and `Operator`, so that role display can ship without prematurely turning shell work into authorization design.

## Implementation Decisions

- The feature will replace the current single protected `/app` page with a shared authenticated shell rooted at `/app`, with real child routes for `Home`, `Products`, `Materials`, `Inventory`, `Bills of Materials`, and `User Settings`.
- The auth check moves to the `/app` layout boundary so every authenticated child route inherits the same protected-entry behavior, including direct navigation and reload recovery on deep links.
- The existing current-session bootstrap remains the source of truth for protected access. A valid stored bearer token continues to be revalidated before authenticated routes render, and invalid or missing sessions continue to redirect to `/sign-in`.
- The current protected screen stops being the place where account actions, route protection, and placeholder content are mixed together. Those responsibilities are separated into shell-level layout and route-owned page bodies.
- The shell owns the persistent sidebar, the shared content backdrop, the mobile sheet behavior, and the shared account menu placement.
- Each authenticated page owns its page body and any visible header content rendered within that body.
- Navigation labels and page identity surfaces are intentionally decoupled. They may match today, but they are not the same concept.
- The main navigation order is `Home`, `Products`, `Materials`, `Inventory`, `Bills of Materials`.
- The route path for bills of materials is the full canonical term, not an abbreviation.
- `User Settings` lives at `/app/user-settings` and is not part of the main navigation list. It is accessed through the bottom account menu.
- The clickable `Guardiola Bridal` sidebar header routes to `/app`.
- The `Home` navigation item remains interactive but never shows an active state, both in the expanded sidebar and in the collapsed icon rail.
- Other main navigation items do show active state for the matching current route.
- Selecting the currently active main navigation destination still behaves like navigation and resets the content region to the top.
- `User Settings` in the account popover does not show an active visual state, even when the current route is `/app/user-settings`.
- Selecting `User Settings` from the popover still closes the menu, navigates, and resets the content region to the top, even when the user is already on the settings route.
- The shell uses the existing collapsible sidebar primitive and keeps its browser-local persisted collapse state.
- Sidebar collapse is browser-local only; it is not user-specific server-backed preference data.
- On desktop, collapse behavior uses the icon rail pattern, not full off-canvas hiding.
- On desktop, collapse/expand is driven by the existing sidebar rail interaction and the existing keyboard shortcut. The first slice does not add a visible shell-level title bar toggle button.
- The authenticated content region uses one stable full-width app surface across all authenticated pages.
- Scroll behavior is unified: the authenticated content region scrolls as one surface within the shared shell.
- Navigation between authenticated routes resets the content region to the top rather than attempting per-page scroll restoration.
- `Home`, `Products`, `Materials`, `Inventory`, and `Bills of Materials` use a shared neutral placeholder surface with centered `Work in progress…` copy.
- Those placeholder pages do not repeat their titles between visible page-header content and the page body.
- `Home` uses the same neutral empty-state surface as the other placeholder routes, rather than a separate dashboard-like treatment.
- `User Settings` does not stay empty. It combines a small read-only account summary with the existing `Password Change` flow.
- The account summary shows only `Email` and `Role`, not internal identifiers.
- Role values remain the same in stored/authenticated data, but are presented in human-friendly form in the shell.
- The `Password Change` flow keeps the exact current field set, validation, error-handling behavior, and sign-out-after-success behavior; only its placement changes.
- The existing logout behavior remains route-independent: signing out from any authenticated page clears the current session and returns the user to `/sign-in`.
- The bottom account menu is anchored to the bottom of the sidebar and opens as a floating popover above its trigger.
- In the expanded sidebar, the account trigger is a full-width control showing fallback avatar, `Email Address`, and human-readable role.
- The fallback avatar uses the first letter of the `Email Address`.
- In the collapsed rail, the account trigger becomes avatar-only while still opening the same conceptual menu.
- The expanded account popover matches the expanded trigger width. In collapsed or mobile contexts, it uses a compact fixed width and remains anchored to the trigger.
- The account popover closes on outside interaction and on any item selection.
- The account popover structure is split into user-related actions first and `Log Out` as the final standalone action.
- On mobile, the shell keeps the same conceptual model: the sidebar becomes a sheet, page identity remains route-owned within the destination page, and route-changing actions dismiss the sheet before navigation.
- Mobile route-changing behavior applies equally to main navigation items, the clickable sidebar header, and logout.
- The user menu remains a popover-above-trigger interaction even within the mobile sidebar sheet, rather than becoming a different full-width inline section.
- `Admin` and `Operator` use the same first-shell navigation and layout. Role-based navigation differences are intentionally deferred.
- The prototype route used to explore shell variants should be removed once the real shell replaces it.
- The preferred implementation seam is the authenticated route boundary: one shared shell layout for `/app` and its children, rather than duplicating auth checks and shell wrappers per page.

## Testing Decisions

- Good tests for this feature should verify observable user behavior: protected-entry redirects, authenticated deep-link rendering, current-route page identity within the page body, navigation highlighting, sidebar persistence, menu dismissal, route transitions, logout redirection, and the relocated `Password Change` flow. They should not assert implementation details like internal component decomposition, local state shape, or styling internals that are not user-observable.
- The highest preferred seam is the authenticated route boundary. Most coverage should come from route-level web tests that mount the real router and assert shell behavior through navigation and rendered outcomes.
- The shared `/app` shell is the primary testing seam. It should verify route protection, direct landing on child routes, page identity rendering inside the authenticated page body, main navigation ordering and active-state rules, `Home`’s no-active exception, click-to-navigate behavior for current and non-current destinations, and reset-to-top behavior on navigation.
- The account menu should be tested through the same route seam, including expanded and collapsed trigger behavior, menu dismissal on outside interaction, `User Settings` navigation, route-independent logout, and menu-close-before-navigation behavior.
- The `User Settings` page should be tested as an authenticated route that renders the account summary plus the existing `Password Change` behavior, including unchanged validation and post-success sign-out behavior.
- Mobile-specific behavior should be tested through the shell seam by exercising the sidebar sheet, confirming that navigation actions dismiss the sheet before route changes, and verifying that page identity remains clear after the sheet closes.
- The existing protected-route and sign-out/password-change route tests in the web app are the main prior art. They already exercise the current auth gate, current-session bootstrap, logout flow, invalid-session redirect, and password-change redirect behavior through route-level integration rather than low-level component tests.
- Prior art also includes the current current-session bootstrap tests and sign-in route tests, which reinforce the existing protected-route seam and should continue to anchor session-oriented behavior.
- New lower seams should be introduced only if a shell behavior cannot be verified cleanly at the route boundary. If that happens, the fallback seam should still stay high, such as a shared app-shell module rather than many page-specific helpers.

## Out of Scope

- New business functionality for `Products`, `Materials`, `Inventory`, or `Bills of Materials`
- Role-based navigation differences between `Admin` and `Operator`
- Global search
- Notifications
- Breadcrumbs
- Fixed shell-level page-title bars
- Shell-consumed route metadata contracts for page identity
- Browser document-title management
- User profile data beyond existing session identity
- Real avatar uploads or persisted profile avatars
- User-specific server-backed shell preferences
- Scroll-restoration memory per route
- Redesigning the `Password Change` form fields or validation rules
- Changing post-success password-change session policy
- Additional account-management actions beyond `User Settings` and `Log Out`
- Alternative mobile-only navigation patterns
- Keeping the throwaway shell prototype once the real shell exists

## Further Notes

- The domain language settled during design should be preserved in the PRD and implementation: `Product`, `Material`, `Inventory`, `Warehouse Position`, and `Bill of Materials` are the chosen terms, and `Inventory` refers to current on-hand stock positions for `Material` in physical warehouse positions.
- This slice intentionally establishes a shared authenticated shell contract before filling in actual business screens. The goal is to make the product feel structurally real without prematurely inventing `Products`, `Materials`, `Inventory`, or `Bills of Materials` functionality.
- The shell contract is intentionally split between shared persistent behavior and independently owned route bodies. That boundary should remain visible in implementation decisions so future pages can evolve without re-opening auth, navigation, or shell-state concerns.
