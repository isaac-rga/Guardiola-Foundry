# Define the Pattern Set boundary for the first delivery

Type: grilling
Status: resolved
Blocked by: 03

## Question

What is the identity, ownership, reuse boundary, input evidence, and quantity-proposal contract of a Pattern Set, and what Pattern Set reference and proposed-versus-final quantity evidence must a BOM Line preserve without implementing automatic meter calculation?

## Answer

- A Pattern Set is an independently identified, globally reusable catalog record representing a configuration of one or more construction patterns. It does not belong to a Product, Product Variant, Construction Piece, Material, Source, or Bill of Materials.
- Each Pattern Set has a stable system-generated identity, a required editable name, an optional description, immutable Created By and Created At metadata, and a Pattern Set Status that defaults to Active.
- Pattern Set names are unique across Active and Retired records. Uniqueness ignores letter case and surrounding whitespace, and retirement does not release a name for reuse.
- Pattern files, individual pattern-piece modeling, geometry, grading, sizes, attachments, and automatic meter calculation are outside the first delivery.
- A BOM Line may reference zero or one Pattern Set, and the same Pattern Set may be reused by any number of lines across Products. Pattern Set remains optional and does not participate in BOM Line Completeness.
- Construction Piece remains free text owned by the BOM Line. A Pattern Set may use a descriptive name such as `Skirt — quarter circle floor length`, but the system does not assign or validate it against a Construction Piece.
- A Pattern Set does not select or belong to a Material or Source. Material and Source compatibility, including the Source width available for a Material, is not inferred or validated by Pattern Set.
- A Pattern Set may contain zero or more exclusively owned Pattern Set Quantity Proposals and remains usable when none have been documented. A proposal has no reusable public identity, creation metadata, or individual change history.
- Each proposal pairs one positive assumed width in centimeters with one positive proposed quantity in meters, using up to three decimal places for quantity, and may include an optional evidence note. A Pattern Set has at most one proposal for each assumed width and displays proposals by ascending width.
- Quantity Proposals are live catalog suggestions for the Builder. They do not calculate, automatically select, validate, or decide a BOM Line's Material Quantity, and the user may consult or use any available proposal regardless of the selected Material or Source.
- The Builder may offer an explicit `Use proposed quantity` action in both Templates and Implementations once the line has a Material. The action copies the proposed number into Material Quantity, after which it is ordinary editable line data with no retained indication of how it was chosen.
- A BOM Line persists only its Pattern Set reference and final Material Quantity. It does not persist a selected proposal, assumed width, evidence note, snapshot, comparison, or proposal-selection history.
- Reopening a line shows the Pattern Set's current name, description, and Quantity Proposals. Later catalog changes are visible immediately while the line's Material Quantity remains unchanged.
- Changing or removing a Pattern Set never changes Material Quantity or resets BOM Line Verification. Using a proposal resets verification only when it changes Material Quantity, following the existing quantity-change rule.
- Deriving a Bill of Materials copies each line's Pattern Set reference and Material Quantity into the independently identified destination line without copying proposal evidence. The destination reads current catalog proposals and begins Unverified.
- Pattern Sets are managed as an independent catalog. The first Builder selects available Pattern Sets rather than creating or editing them inline; exact catalog and navigation interactions remain for the prototype tickets.
- An Active Pattern Set may be renamed and have its description or Quantity Proposals edited. If any retained BOM Lines reference it, saving any edit requires a non-blocking confirmation showing the number of affected BOM Lines and Bills of Materials; their final quantities and verification remain unchanged.
- Pattern Set Status is Active or Retired. Retirement and restoration preserve identity, name, description, proposals, and all existing references; physical deletion and soft deletion are unavailable in the first delivery.
- Retiring a referenced Pattern Set is permitted after the same non-blocking usage confirmation. A Retired Pattern Set cannot be edited or manually selected for another line until restored.
- A line that already references a Retired Pattern Set may retain or remove it, consult and use its proposals, and be copied through BOM derivation. Derivation preserves the unavailable reference as existing information rather than treating it as a new manual selection.
- A BOM Line referencing a Retired Pattern Set derives the non-blocking `Pattern needs attention` condition. It appears only on that line, does not affect completeness, verification, saving, derivation, or use of the Bill of Materials, and clears when the Pattern Set is restored, removed, or replaced.
