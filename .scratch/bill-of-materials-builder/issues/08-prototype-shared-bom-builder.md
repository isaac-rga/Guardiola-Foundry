# Prototype the shared create and update BOM Builder

Type: prototype
Status: resolved
Blocked by: 07

## Question

How should one Builder let a User create and update BOM Templates and BOM Implementations; add, repeat, group, order, and remove BOM Lines; see Pattern Set proposals; choose final quantities; and understand lineage and lifecycle constraints without exposing the underlying storage model?

## Captured prototype

- Branch: `prototype-bill-of-materials-builder`
- Run: `pnpm prototype:bom`
- Route: `/app/bills-of-materials?variant=B`
- Variant A — Composition table: exposes the whole ordered BOM as a dense inline-editing surface with an aggregate summary rail.
- Variant B — Construction board: keeps line navigation and focused editing together, with a separate aggregate summary card.
- Both variants share the same in-memory draft and can exercise create Template, derive Implementation, and edit Implementation scenarios. No mutation reaches the API.

## Validated direction

- **Winner: Variant B — Construction board.** Its separate line navigator and focused editor keep a large BOM scannable without presenting every editable field at once. The separate Whole BOM summary preserves aggregate context without competing with line editing.
- **Rejected: Variant A — Composition table.** Its dense all-lines-at-once layout is not the direction to carry into the production spec. Its code remains temporarily on this throwaway branch only as comparison evidence until the prototype is captured.
- One Builder supports Template and Implementation creation and update. Scenario differences change contextual data and valid actions rather than the basic editing surface.
- The identity section combines the editable BOM Name, kind and Product Variant context, description, and Save action. The BOM Name is the page H1 and uses a quiet header-input treatment that reveals its edit affordance on hover or focus.
- The `BOM Name` label includes a tooltip explaining that the name should describe construction typification. Product Variant keeps its separate commercial name and is shown as context rather than duplicated into the editable name.
- BOM lineage and aggregate progress are not repeated in the identity section. They remain in the separate Whole BOM summary card.
- The Construction Board is the line navigator. Selecting a line opens one focused editor while preserving awareness of the full ordered composition.
- Construction Board items use drag handles for ordering, with an Arrow Up and Arrow Down keyboard fallback. Dedicated move buttons are not part of the chosen interface.
- Construction Piece is edited only through the header-style input in the focused line editor. A second normal input for the same value is not shown.
- Material and Pattern Set use searchable on-demand catalog dialogs rather than long inline selects. Both dialogs support clearing the selection and an explicit empty-search state.
- A Material result displays its name as the primary label and its subdued Material ID on the same line. Its metadata distinguishes width, the Source's own name, Vendor, and Vendor Shade or other Source detail. Search matches all of those values.
- A Pattern Set result displays its name, identifier, and proposal count. Search matches its name and identifier.
- Pattern Set proposals open in a separate dialog from an action beside the Pattern Set field. The action is visible only when the selected Pattern Set has proposals. Choosing a proposal copies its quantity into Final meters without persisting proposal history.
- Line verification is a primary field beside Final meters. The lower status strip is reserved for completeness, attention, current Material and Source context, and cost projection.
- The Whole BOM summary remains separate from the editor and shows construction-line count, complete and verified counts, attention count, material-cost projection, excluded lines, and origin.
- Construction groups such as `Falda` and `Top` are deferred. The first production direction keeps one flat ordered Construction Board until grouping is investigated as its own domain decision.

## Deferred production decisions

- Grill the data-loading, query, pagination or virtualization, relevance, and stale-selection behavior required to support large Material and Pattern Set catalogs in production.
- Grill construction grouping separately if it returns to scope; do not infer groups from Construction Piece names or introduce them through the Builder implementation ticket.
- Define detailed loading, failure, stale-edit, validation, and responsive behavior in the production specification without reopening the validated layout direction.
