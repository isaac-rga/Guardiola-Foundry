# 13 — Derive BOM Templates and preserve lineage

**What to build:** Let Users derive an independent BOM Template from any available Template or Implementation while retaining trustworthy immediate lineage. The destination may reuse the likely Product association without becoming a live child of its origin.

**Blocked by:** 12 — Apply a BOM Template to a Product Variant.

**Status:** done

- [x] A non-deleted Template or Implementation can be the source of a newly derived Template.
- [x] The Builder proposes `<current origin name> — copy` as the editable destination name without requiring Template-name uniqueness.
- [x] Product-bound origins propose their current Product as an editable creation-time association choice.
- [x] The User may remove the proposed association, and an ineligible proposed Product yields an unassociated destination rather than blocking derivation.
- [x] A derived Template may later become permanently associated with any eligible Product, including a different Product.
- [x] Save atomically creates a new Template and line identities, copies current description, ordered line values, Material and Pattern Set references, and Line Notes, and starts all copied lines Unverified.
- [x] The destination records only its immutable immediate BOM Origin and immutable creation metadata for the User and time of derivation.
- [x] Lineage remains acyclic, may grow without an artificial depth limit, and stores no root, depth, duplicated descendants, line correspondence, or historical snapshot.
- [x] Origin display uses the origin's current name, kind, and availability; later source changes never synchronize or propagate.
- [x] A non-deleted Bill of Materials may create an unassociated Template even when its related Product or Variant is inactive or soft-deleted.
- [x] A soft-deleted Bill of Materials cannot be a new origin until restored, while deleting or restoring an existing origin leaves all descendants unchanged.
- [x] Focused domain, API functional, catalog, and Builder tests cover both origin kinds, association suggestion and removal, independent lines, acyclic lineage, current origin projection, unavailable Product context, and no propagation.
