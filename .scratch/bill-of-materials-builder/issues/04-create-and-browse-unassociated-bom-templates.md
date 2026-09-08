# 04 — Create and browse unassociated BOM Templates

**What to build:** Replace the in-memory Bills of Materials entry point with the first persisted tracer bullet. Users can open the operational catalog, create an unassociated BOM Template with its own identity and metadata through the approved Builder direction, and find the saved Template after reloading.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] The authenticated Bills of Materials route reads persisted data rather than prototype fixtures.
- [ ] An Admin or Operator can start Template creation from the `Create BOM` menu and enter the Construction Board Builder.
- [ ] A Template can be created without a Product association, BOM Origin, or BOM Lines.
- [ ] A Template requires an editable display name and accepts an optional description.
- [ ] The Template receives a stable identity, permanent Template kind, immutable Created By and Created At metadata, and a latest update timestamp.
- [ ] Opening a create Builder does not persist or reserve a Bill of Materials; leaving before the first successful Save creates no record.
- [ ] Explicit Save creates the Template atomically and returns it through the canonical shared response contract.
- [ ] The saved Template appears in a simple operational catalog after navigation or reload and is visibly distinguished from an Implementation.
- [ ] Unauthenticated access follows the existing global sign-in behavior, and unauthorized mutation receives the established API and UI treatment.
- [ ] Focused API functional and Bills of Materials route tests cover empty catalog, creation, validation, persistence, reload, authentication, and no abandoned record.
