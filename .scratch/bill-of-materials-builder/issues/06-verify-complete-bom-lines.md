# 06 — Verify complete BOM Lines

**What to build:** Let Operators record that they reviewed individual Complete BOM Lines without inventing aggregate BOM approval. Verification remains informational, follows the facts it reviewed, and resets only when those construction facts change.

**Blocked by:** 05 — Compose Template BOM Lines with Materials.

**Status:** ready-for-agent

- [ ] The focused line editor presents BOM Line Verification as a primary field beside Final meters.
- [ ] Only a Complete BOM Line can be marked Verified.
- [ ] Verifying a line records the current Operator and verification timestamp.
- [ ] An Operator can manually return a Verified line to Unverified without changing its construction data.
- [ ] Changing Construction Piece, Material, or Material Quantity resets the line to Unverified and clears its verifier and timestamp.
- [ ] Changing Line Note, line order, or Bill of Materials name or description preserves verification.
- [ ] Verification never blocks Save, derivation readiness, or other use of the Bill of Materials.
- [ ] The Builder and persisted response distinguish line completeness from line verification and expose no aggregate verification or approval status.
- [ ] The Whole BOM summary shows Complete and Verified counts derived from current lines.
- [ ] Focused domain, API functional, and Builder-route tests cover verification eligibility, evidence, manual withdrawal, reset triggers, preserved triggers, and aggregate counts.
