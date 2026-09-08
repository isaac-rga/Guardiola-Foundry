# 05 — Compose Template BOM Lines with Materials

**What to build:** Let Users compose a persisted BOM Template through the approved Construction Board. They can add repeated construction occurrences, focus one line at a time, choose Materials through remote search, decide meter quantities, reorder or remove lines, and save incomplete work without flattening BOM Lines into Material rows.

**Blocked by:** 04 — Create and browse unassociated BOM Templates.

**Status:** ready-for-agent

- [ ] A create-Template Builder presents an ordered Construction Board and one focused BOM Line editor rather than the rejected dense Composition Table.
- [ ] A User can add, focus, repeat, reorder, and remove independently identified BOM Lines before saving.
- [ ] Each line belongs exclusively to one Bill of Materials and requires a free-text Construction Piece while allowing Material and Material Quantity to remain unresolved.
- [ ] The same Construction Piece or Material may appear on any number of independently identified lines, including otherwise identical-looking lines.
- [ ] Material selection uses an authenticated, bounded remote-search contract and does not require loading the entire Material catalog.
- [ ] Material results identify the Material and show useful color, Material Use, and Preferred Source context without storing Source data on the line.
- [ ] A line selects zero or one Material and accepts only a positive Material Quantity in meters with at most three decimal places.
- [ ] Changing or removing Material clears the prior Material Quantity; Material Quantity cannot exist without Material.
- [ ] Each line accepts an optional Line Note, and order remains an explicit logical display order rather than identity or mandatory manufacturing sequence.
- [ ] BOM Line Completeness is derived from Construction Piece, Material, and valid quantity; Incomplete lines remain valid saved data.
- [ ] Drag handles support pointer reordering and Arrow Up or Arrow Down provide the keyboard fallback.
- [ ] Explicit Save atomically creates the Template, its independently identified lines, and their order; any structural validation failure creates nothing.
- [ ] Focused API functional and Builder-route tests cover repeated lines, incomplete lines, Material selection, quantity clearing, precision validation, notes, ordering, removal, atomic creation, and reload.
