# Define how BOM Lines resolve from Template to Implementation

Type: grilling
Status: resolved
Blocked by: 01

## Question

Which construction context, default Material choices, resolved Material choices, quantities, units, ordering, and notes belong to a BOM Line in a Template versus an Implementation, and how are repeated uses of the same Material represented without ambiguity?

## Answer

- BOM Templates and BOM Implementations use the same BOM Line model. Each line has its own stable identity, belongs exclusively to one Bill of Materials, and is copied with a new identity rather than shared or linked to its source line.
- Every BOM Line requires a free-text Construction Piece describing the Product part or construction placement to which it applies. Construction Piece is contextual to the line and is distinct from the Material's catalog-level Material Use.
- A BOM Line may select zero or one Material. It does not contain alternative Material choices, and the same Material or Construction Piece may appear in any number of independently identified lines, including otherwise identical-looking lines.
- Material and Material Quantity may both be absent, and Material may be selected before its quantity is known. Material Quantity cannot exist without a selected Material.
- Material Quantity is a positive meter quantity with up to three decimal places. Zero and negative values are invalid; no editable line-level unit is stored because Materials use Meter as their normalized unit.
- In a BOM Template, the selected Material and Material Quantity are configured suggestions. In a BOM Implementation, they are the current concrete decisions. The same fields represent both meanings according to the permanent kind of the owning Bill of Materials.
- Changing or removing a line's Material clears its existing Material Quantity because relevant characteristics such as textile width can change the required linear meters. The first delivery does not calculate a replacement quantity automatically.
- BOM Line Completeness is derived rather than stored. A line is Complete when it has its required Construction Piece, a selected Material, and a valid Material Quantity; otherwise it is Incomplete. Incomplete lines may be saved and do not block use of the Bill of Materials.
- Each line has one optional Line Note. It is copied during derivation and may then evolve independently.
- Lines have an explicit, user-reorderable logical display order. Order is not identity and does not assert a mandatory manufacturing sequence.
- Deriving any Bill of Materials copies each line's Construction Piece, Material, Material Quantity, Line Note, and relative order into new independently owned lines. Copied values immediately become the current values of the destination BOM and do not require separate confirmation.
- A copied line does not retain line-level lineage or preserve its former Material or quantity for comparison. BOM Origin records only the immediate source Bill of Materials; historical comparisons and audit reconstruction are out of scope.
- BOM Line Verification is manual and exists only per line, never as an aggregate Bill of Materials status. Both Template and Implementation lines may be verified independently.
- Only a Complete line may be marked Verified. Verification records the current Operator and verification timestamp, remains informational, and never blocks saving, editing, copying, applying, or otherwise using the Bill of Materials.
- Changing Construction Piece, Material, or Material Quantity resets that line to Unverified and clears its current verifier and timestamp. Changing Line Note, display order, or Bill of Materials metadata does not.
- An Operator may manually return a line to Unverified without changing its data. Every copied line starts Unverified, regardless of the source line's verification.
- Automatic meter calculation remains out of scope. Pattern Set quantity proposals are resolved in issue 05, while Source, width, availability, and cost behavior are resolved in issue 06.
