# 10 — Create manual BOM Implementations

**What to build:** Let Users create concrete Bills of Materials for eligible Product Variants without requiring a Template. The Variant is selected before entering the shared Builder, remains immutable context, and is kept distinct from the manually assigned BOM Typification.

**Blocked by:** 01 — Register and maintain Product Variants; 09 — Use Pattern Sets in BOM Lines.

**Status:** ready-for-agent

- [ ] Starting manual Implementation creation opens a searchable Product Variant candidate dialog before the Builder.
- [ ] A Variant is eligible only when it and its Product are available and it has no non-deleted BOM Implementation.
- [ ] In-scope ineligible candidates remain visible but non-selectable with one canonical reason and existing Implementation identity when occupied.
- [ ] The selected Product Variant is required before Builder entry and appears there as immutable commercial context.
- [ ] The Implementation requires a manually assigned BOM Typification separate from the live Product Variant name.
- [ ] BOM Typification is case-insensitively unique among non-deleted Implementations of the same Product and may repeat for different Products.
- [ ] The shared Construction Board supports the same line, Material, Pattern Set, verification, attention, and cost-projection behavior for an Implementation.
- [ ] A manual Implementation has no BOM Origin and may be saved with no lines or with Incomplete or Unverified lines.
- [ ] Save atomically revalidates Product and Variant availability, Variant occupancy, and typification uniqueness without preflight reservation.
- [ ] If eligibility changes before Save, creation fails without a partial record and preserves the local draft with an actionable conflict.
- [ ] The Product Variant's Product relationship is used for scope but is not duplicated as an independently editable Implementation relationship.
- [ ] Focused API functional and Builder-route tests cover candidate eligibility, immutable context, progressive save, typification scope, concurrent occupancy, validation recovery, and manual origin absence.
