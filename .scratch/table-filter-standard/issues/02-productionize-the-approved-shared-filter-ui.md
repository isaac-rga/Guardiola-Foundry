# 02 — Productionize the approved shared filter UI

**What to build:** Turn the approved Products Variant A prototype into the controlled app-level table-filter composition and use Products as its first production surface. Preserve the prototype's validated proportions, toolbar/chip treatment, right-aligned popover, criterion hierarchy, two-level navigation, and immediate-apply flow while applying the later decisions in the parent specification. Remove all prototype-only framing, labels, readouts, route gating, and comparison code after the production control replaces it.

**Blocked by:** 01 — Establish remote Product search and URL state.

**Status:** ready-for-agent

- [ ] Implementation begins by reviewing the approved Products Variant A prototype and carries its validated visual and interaction decisions into the production component rather than independently redesigning the UI.
- [ ] Products exposes visible search, a Filter trigger without a count, definition-ordered editable chips, ordinary single-value criteria, locally searchable loaded Collections, and direct activation of Include deleted.
- [ ] Applying a value returns to the criterion list and keeps the popover open; the explicit close control, Escape, and outside interaction close without mutating applied filters.
- [ ] Toolbar Clear all appears for search or criteria, popover Clear all appears for active criteria, both restore defaults, and clearing inside the popover leaves it open.
- [ ] Product historical rows display a Deleted badge, unauthorized controls are omitted, and an unexpected table-level `403` preserves the session and offers Clear all recovery.
- [ ] The no-results message directs users to clear search or filters without adding a second clear button, and the toolbar remains usable through inline wrapping on narrow viewports.
- [ ] A dedicated Products filter integration test file proves the shared observable behavior without adding the full matrix to the existing general Products route test file.
- [ ] Prototype-only URL parameters, conditional rendering, state readouts, framing, labels, and obsolete variant code are removed after the production surface is active.
