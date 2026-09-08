# 03 — Manage the Pattern Set catalog

**What to build:** Give Users an independent catalog for reusable Pattern Sets and their width-based Quantity Proposals. Users can record proposal evidence, keep names stable across retirement, and retire or restore unused Pattern Sets without turning proposals into automatic meter calculations.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Authenticated Users can browse Pattern Sets and distinguish Active from Retired records according to their role.
- [ ] An Admin or Operator can create a Pattern Set with a required unique name, optional description, and zero or more Quantity Proposals.
- [ ] Each Pattern Set receives a stable system identity plus immutable Created By and Created At metadata and defaults to Active.
- [ ] Pattern Set names are unique across Active and Retired records after ignoring letter case and surrounding whitespace.
- [ ] Each Quantity Proposal pairs a positive assumed width in centimeters with a positive meter quantity to at most three decimal places and may include an evidence note.
- [ ] A Pattern Set rejects duplicate assumed widths and presents proposals in ascending width order.
- [ ] An Admin or Operator can rename an unused Active Pattern Set and edit its description and Quantity Proposals.
- [ ] An Admin or Operator can retire an unused Active Pattern Set, and an Admin can restore a Retired Pattern Set with its identity, description, and proposals preserved.
- [ ] Retired Pattern Sets cannot be edited or returned by ordinary new-selection queries until restored.
- [ ] The workflow does not model pattern files, geometry, grading, sizes, Product ownership, Material compatibility, or automatic meter calculation.
- [ ] Focused API and catalog-route tests cover validation, normalized uniqueness, proposal ordering, editing, retirement, restoration, authentication, and role boundaries.
