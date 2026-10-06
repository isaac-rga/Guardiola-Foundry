# 02 — Productionize the approved shared filter UI

**What to build:** Turn the approved Products Variant A prototype into the controlled app-level table-filter composition and use Products as its first production surface. Preserve the prototype's validated proportions, toolbar/chip treatment, right-aligned popover, criterion hierarchy, two-level navigation, and immediate-apply flow while applying the later decisions in the parent specification. Remove all prototype-only framing, labels, readouts, route gating, and comparison code after the production control replaces it.

**Blocked by:** 01 — Establish remote Product search and URL state.

**Status:** complete

- [x] Implementation begins by reviewing the approved Products Variant A prototype and carries its validated visual and interaction decisions into the production component rather than independently redesigning the UI.
- [x] Products exposes visible search, a Filter trigger without a count, definition-ordered editable chips, ordinary single-value criteria, locally searchable loaded Collections, and direct activation of Include deleted.
- [x] Applying a value returns to the criterion list and keeps the popover open; the explicit close control, Escape, and outside interaction close without mutating applied filters.
- [x] Toolbar Clear all appears for search or criteria, popover Clear all appears for active criteria, both restore defaults, and clearing inside the popover leaves it open.
- [x] Product historical rows display a Deleted badge, unauthorized controls are omitted, and an unexpected table-level `403` preserves the session and offers Clear all recovery.
- [x] The no-results message directs users to clear search or filters without adding a second clear button, and the toolbar remains usable through inline wrapping on narrow viewports.
- [x] A dedicated Products filter integration test file proves the shared observable behavior without adding the full matrix to the existing general Products route test file.
- [x] Prototype-only URL parameters, conditional rendering, state readouts, framing, labels, and obsolete variant code are removed after the production surface is active.

## Implementation outcome

Products now uses the controlled shared `TableFilters` component and the shadcn Popover primitive. The implementation carries forward the approved Variant A layout and interaction flow. Products owns filter definitions, authorization, URL state, data requests, and local row filtering.

The prototype component, route gating, state display, and `filterPrototype` parameter are removed. Unsupported URL parameters are canonicalized. Clear all also retries a failed default query after a table-level `403`. The later browser adjustment removes the popover subtitle and emphasizes one title: Filters or the selected criterion name.

## Focused verification

- Products filter integration and general route suites: 40 tests passed (8 dedicated and 32 general).
- TypeScript, focused Oxlint, and `git diff --check`: passed during implementation.
- Independent Standards and Spec reviews: passed with no remaining findings. Spec independently reran the 8 dedicated tests.
- After the header adjustment, the 8 dedicated filter tests passed again, and the title was checked in the browser.

The initial complete browser flow review was interrupted by session expiry. The later browser check confirmed the header change; complete flow and narrow-viewport visual review remain pending. Existing React `act` warnings remain in the general route suite. The full `pnpm quality` gate was not run.

Other catalog migrations and API changes remain outside this ticket. See [changes.md](../../../changes.md) for the implementation walkthrough.
