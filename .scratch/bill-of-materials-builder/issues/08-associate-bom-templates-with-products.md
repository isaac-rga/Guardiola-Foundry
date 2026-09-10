# 08 — Associate BOM Templates with Products

**What to build:** Let Users give a BOM Template its optional permanent Product scope. Creation should strongly recommend an eligible Product without blocking unassociated work, and the system must prevent two available Templates from claiming the same Product association.

**Blocked by:** 04 — Create and browse unassociated BOM Templates.

**Status:** done

- [x] Template creation clearly recommends choosing a Product while allowing the User to continue unassociated.
- [x] An unassociated Template can be assigned once to an eligible Active, non-deleted Product.
- [x] A Template's assigned Product association is permanent and cannot later be changed or removed.
- [x] A Product has at most one non-deleted associated Template; unassociated Templates do not occupy a Product slot.
- [x] Inactive or soft-deleted Products cannot receive a new Template association.
- [x] Product Lifecycle Status does not otherwise restrict association to an Active Product.
- [x] Competing association or creation requests are enforced atomically so only the first valid operation succeeds and no partial change remains.
- [x] A conflict identifies the current associated Template without overwriting, deleting, or reassigning either record.
- [x] Inactivating or soft-deleting an associated Product preserves the permanent association.
- [x] Template responses and Builder context expose Product identity and availability without making the relationship editable after assignment.
- [x] Focused API functional and Builder-route tests cover recommendation, unassociated creation, one-time association, slot uniqueness, Product availability, concurrency, and immutable context.
