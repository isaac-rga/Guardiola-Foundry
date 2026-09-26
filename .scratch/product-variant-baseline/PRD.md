# Product Variant Baseline and Product Availability Actions

Status: ready-for-agent

## Problem Statement

Products and Product Variants are already operational, but their current workflows allow states that no longer match the domain. A Product can be registered without a Product Variant, the last Product Variant can be soft-deleted, and existing Products may therefore have no concrete realization for later construction work. Product Status is also treated as editable Product content in create and edit forms, even though changing availability is an operational action with consequences for Product Variants and Bill of Materials workflows.

Users need every available Product to retain a concrete Product Variant, while still keeping Product and Product Variant availability independent. They also need deliberate, consistent availability actions from both the Product page and Product list without accidentally saving or discarding unrelated Product edits.

## Solution

Register every new Product atomically with an Active Product Variant initially named `Base`. Treat `Base` as a normal, renamable Product Variant rather than a permanent role, regularize existing non-deleted Products that have no Product Variant, and prevent direct deletion of the last non-deleted Product Variant. Preserve Product Variants and Bills of Materials when a Product is soft-deleted, and create `Base` only as recovery when an empty Product is restored.

Remove Product Status from Product create and edit forms. Expose dedicated Activate and Inactivate actions on the Product page and in a trailing Product-table action menu. Inactivation lets the User affect only the Product or also every currently Active Product Variant in one atomic operation; activation changes only the Product. Availability actions remain independent from unsaved Product-detail edits.

## User Stories

1. As a User, I want every new Product to begin with a Product Variant, so that the Product always has a concrete realization for construction work.
2. As a User, I want the initial Product Variant to be named `Base`, so that Product registration requires no additional naming decision.
3. As a User, I want the initial `Base` Variant to start Active, so that it is immediately available when its Product is available.
4. As a User, I want `Base` to be a normal Product Variant that I can rename, so that the initial convenience does not become a permanent classification.
5. As a User, I want Product and `Base` registration to succeed or fail together, so that I never encounter a newly created Product without a Variant.
6. As a User, I want new Products to start Active without choosing Product Status during registration, so that the create flow remains fast and consistent.
7. As a User, I want Product Lifecycle Status to remain independent from Product Status, so that lifecycle progress does not silently change availability.
8. As a User, I want an existing Product that already has Product Variants to remain unchanged during regularization, so that established identities and names are preserved.
9. As a User, I want an existing non-deleted Product without any Product Variant to receive an Active `Base` Variant, so that old records satisfy the new invariant.
10. As an Admin, I want deleted Products excluded from bulk regularization, so that historical records are not changed merely by deployment.
11. As an Admin, I want restoring a Product with no non-deleted Variant to create an Active `Base` atomically, so that restoration cannot produce an invalid available Product.
12. As a User, I want restoring a Product that already has a non-deleted Variant to preserve its Variants unchanged, so that recovery does not invent duplicate context.
13. As a User, I want a Product Variant to remain valid without a BOM Implementation, so that Variant registration does not imply construction readiness.
14. As a User, I want the last non-deleted Product Variant to be protected from direct deletion, so that a Product cannot lose all of its Variants through ordinary maintenance.
15. As a User, I want the last Variant's Delete action to remain visible but disabled with an explanation, so that I understand how to make deletion possible.
16. As a User, I want to create another Product Variant before deleting the previous last Variant, so that the Product invariant remains explicit.
17. As a maintainer, I want the server to reject deletion of the last Product Variant, so that direct clients and concurrent operations cannot bypass the invariant.
18. As a User, I want soft-deleting a Product to preserve its Product Variants, so that their identities and relationships survive recovery.
19. As a User, I want soft-deleting a Product to preserve its Bills of Materials, so that construction records and lineage are not cascaded away.
20. As a User, I want Product Variants under a soft-deleted Product to be unavailable for new work without being marked deleted themselves, so that parent availability remains distinct from Variant identity.
21. As a User, I want existing BOM Implementations related to a soft-deleted Product or Variant to remain preserved and read-only according to the existing lifecycle rules, so that deletion does not destroy construction history.
22. As a User, I want Product Status removed from the Product creation form, so that availability is not presented as registration content.
23. As a User, I want Product Status removed from the Product edit form, so that availability changes are not mixed with editable Product details.
24. As a User, I want Product Status shown in Record metadata, so that the current availability remains visible on the Product page.
25. As a User, I want an `Inactivate Product` action in the Product-page header, so that I can change availability without submitting the edit form.
26. As a User, I want an `Activate Product` action in the Product-page header when the Product is Inactive, so that the available transition is explicit.
27. As a User, I want the Product table to end with an actions column, so that common Product operations are available without opening each Product.
28. As a User, I want the Product-table actions to use the same compact menu pattern as Bills of Materials, so that operational tables behave consistently.
29. As a User, I want an available Product's menu to contain Edit, Activate or Inactivate as appropriate, and Delete, so that its valid operations are grouped together.
30. As an Admin, I want a deleted Product's menu to contain View and Restore, so that exceptional recovery remains available from the list.
31. As an Operator, I want deleted Product recovery omitted from my actions, so that the existing permission boundary remains intact.
32. As a User, I want the Product name to remain a navigation link even after the actions menu is added, so that the existing direct path remains convenient.
33. As a User, I want inactivating a Product to open a dialog, so that I can deliberately choose its effect on Product Variants.
34. As a User, I want the default inactivation choice to affect only the Product, so that Variant statuses are not changed implicitly.
35. As a User, I want an alternative to inactivate the Product and every currently Active Product Variant, so that I can retire the whole available Product structure in one action.
36. As a User, I want the inactivation dialog to omit the Variant option when no Variant is Active, so that it does not offer a meaningless choice.
37. As a User, I want Product-only inactivation to preserve every Product Variant status, so that reactivation can recover the previous availability naturally.
38. As a User, I want Product-and-Variant inactivation to leave already Inactive Variants unchanged, so that the operation only performs the requested transition.
39. As a User, I want Product-and-Variant inactivation to use the current Variant state when the operation executes, so that a stale dialog cannot leave a newly Active Variant behind.
40. As a User, I want Product-and-Variant inactivation to be atomic, so that a failure cannot leave the Product and its Variants partially transitioned.
41. As a User, I want activation to change only the Product, so that previously deliberate Variant statuses are preserved.
42. As a User, I want activation to execute without a dialog, so that a transition with no secondary choice remains efficient.
43. As a User, I want a Product to be allowed to remain Active while all of its Product Variants are Inactive, so that Product and Variant availability stay independent.
44. As a User, I want status actions to execute independently from `Save changes`, so that availability is not coupled to Product-detail editing.
45. As a User, I want pending Product-detail edits preserved when I activate or inactivate the Product, so that the availability action does not discard my work.
46. As a User, I want an availability action to avoid saving pending Product-detail edits, so that only the action I selected reaches the server.
47. As a User, I want a failed availability action to preserve both the prior Product Status and my pending form values, so that I can recover without re-entering data.
48. As a User, I want visible success feedback after activation or inactivation, so that I know the independent action completed.
49. As a User, I want visible action-specific error feedback after activation or inactivation fails, so that I do not confuse it with a Product-detail save failure.
50. As a User, I want status controls disabled while their request is pending, so that I cannot submit the transition twice.
51. As an Admin, I want to activate or inactivate Products from either supported surface, so that availability maintenance is efficient.
52. As an Operator, I want the same activate and inactivate actions, so that ordinary Product operations preserve the existing role model.
53. As an Admin, I want Product restoration to remain admin-only, so that availability actions do not broaden deleted-record permissions.
54. As a User, I want Product-list filters and status presentation to reflect a completed status action immediately, so that the working view remains trustworthy.
55. As a User, I want Product Variant candidate results invalidated after relevant Product or Variant availability changes, so that stale candidates cannot remain selectable.
56. As a maintainer, I want the new Product and Variant rules enforced through concrete domain services and transactions, so that the implementation matches the existing Product module without speculative architecture.
57. As a maintainer, I want shared request and response contracts to distinguish Product-detail updates from availability actions, so that clients cannot accidentally couple them again.
58. As a maintainer, I want focused behavior tests at the API, route, and migration boundaries, so that the new invariant and workflows remain auditable.

## Implementation Decisions

- This is a new implementation slice. The completed Product Management and Bills of Materials Builder PRDs remain historical sources and are not retroactively rewritten.
- The current domain language in the glossary and the accepted Product Variant and availability ADR govern this work.
- The Product module remains layered and concrete. The interacting lifecycle rules require transactions and locks, but do not justify new ports, repositories, or a broader architectural rewrite.
- Every non-deleted Product must own at least one non-deleted Product Variant.
- Product registration creates the Product and one Active Product Variant named `Base` in one transaction. Failure to persist either record leaves neither record persisted.
- `Base` is only the initial name. It has no special flag, role, permanent identity, or protected name and may be renamed through the existing Product Variant workflow.
- New Product registration always uses Product Status `Active`. Product Status is removed from the create request and create-form choices; Lifecycle Status remains independently editable according to existing rules.
- A data migration creates one Active `Base` Variant for each non-deleted Product that has no non-deleted Product Variant. Products that already have at least one non-deleted Variant are unchanged, and deleted Products are skipped.
- Migration-created Product Variant identities use the existing Product Variant public-ID format and collision rules. The migration is safe to run once through the normal migration system and does not create duplicate Variants when its target condition is absent.
- Restoring a Product checks for a non-deleted Product Variant inside the restoration transaction. If none exists, it creates an Active `Base`; otherwise it leaves all Variants unchanged.
- Direct Product Variant soft deletion locks the owning Product and evaluates the current non-deleted Variant count in the transaction. Deletion is rejected when the target is the last non-deleted Variant, including when the Product itself is soft-deleted.
- The Product Variant UI keeps the last Variant's Delete action visible but disabled and explains that another Variant must be created first. Server enforcement remains authoritative.
- Product soft deletion continues to preserve Product Variants, Bills of Materials, and their relationships. It does not cascade soft deletion.
- Product Status is removed from Product-detail update ownership and from the edit form. It is displayed in the Record metadata section.
- Product availability uses dedicated authenticated actions rather than the Product-detail save operation. Activation changes only the Product. Inactivation accepts an explicit choice whose default is Product-only and whose alternative includes every currently Active Variant.
- The availability action contract represents the Variant choice explicitly. Omitting the choice has Product-only semantics.
- Inactivation locks the Product before evaluating and changing its Product Variants, following the established Product-to-Variant lock order. Product and selected Variant transitions commit atomically.
- Product-only inactivation preserves every Variant status. Product-and-Variant inactivation changes every Variant that is Active when the transaction executes and leaves already Inactive Variants unchanged.
- Activation changes only Product Status to Active. It never activates Product Variants automatically and is valid when no Variant is Active.
- Status actions use current persisted state and are idempotent from the User's perspective. Repeating an already satisfied transition does not corrupt state or broaden its effect.
- Admin and Operator may activate and inactivate Products. Deleted-record browsing and Product restoration remain admin-only.
- The Product page exposes one status-aware action in its header, independent from `Save changes`. Availability success, error, and pending states are distinct from Product-detail save state.
- Availability actions neither submit nor reset the Product edit form. Query and cache updates must preserve pending form values while updating the visible Product Status metadata.
- The Product list adds a narrow trailing actions column using the established Bills of Materials menu behavior and accessible action labels.
- For non-deleted Products, the menu exposes Edit, the valid Activate or Inactivate action, and Delete. For deleted Products, it exposes View and admin-only Restore.
- Inactivation from either Product surface uses the same dialog and mutation behavior. When no Product Variant is Active, the dialog presents only Product confirmation.
- Product-list and Product-detail caches update or invalidate after availability actions. Product Variant lists and Product Variant candidate searches are invalidated whenever the action can change their availability.
- Product-detail update contracts no longer require or own Product Status. Existing editable Product fields and image behavior remain unchanged.
- Existing soft-delete, restoration, BOM read-only, Product Variant uniqueness, BOM occupancy, and Lifecycle Status rules remain in force unless this PRD explicitly changes them.

## Testing Decisions

- Tests assert external behavior and persisted outcomes rather than transaction helpers, lock calls, component state, or cache implementation details.
- API functional tests use authenticated HTTP requests and the real test database as the primary server seam.
- Product creation tests verify that the response is Active, that an Active `Base` Variant is persisted, and that a failed Variant creation leaves no Product.
- Product creation tests verify that clients cannot override initial Product Status and that existing Lifecycle Status behavior remains available.
- Product availability tests verify Product-only inactivation, Product-and-Variant inactivation, activation without Variant changes, permissions, idempotent repeats, and failure atomicity.
- Concurrency coverage verifies that inactivation evaluates the current Variant set and that competing last-Variant deletions cannot leave a Product without a non-deleted Variant.
- Product deletion and restoration tests verify that Product soft deletion preserves Variants and Bills of Materials and that restoring an empty Product creates `Base` atomically without changing Products that retain Variants.
- Migration coverage uses the real persistence boundary, following the existing migration/import test precedent. It covers eligible empty Products, Products with existing Variants, deleted Products, generated Variant identity, and the absence of duplicate work when no target remains.
- Web route tests cover both the Product list and Product edit route using Testing Library and visible, accessible behavior.
- Product creation route coverage verifies that Product Status is absent and the created Product appears Active.
- Product edit coverage verifies Product Status in Record metadata, status-aware header actions, independence from pending edits, action-specific feedback, and preservation of form values after success or failure.
- Product-list coverage verifies the trailing accessible action menu, role-sensitive actions, activation, both inactivation choices, Delete, View, Restore, and immediate row/filter updates.
- Product Variant route coverage verifies the visible disabled Delete action and explanation for the last non-deleted Variant, plus normal deletion after another Variant exists.
- Shared contracts are exercised through the API and web seams. Add isolated schema tests only if a schema contains branching behavior that those higher seams cannot express clearly.
- Focused Product, Product Variant, Product-route, and migration checks are the implementation verification target. The repository-wide quality gate remains outside agent execution unless explicitly requested.

## Out of Scope

- Renaming Product Variant to Product Version or introducing historical Product revisions.
- Giving `Base` a permanent role, special database flag, protected name, or automatic synchronization with Product name.
- Requiring a BOM Implementation, commercial specification, or readiness state before a Product Variant may exist.
- Automatically activating Product Variants when their Product is activated.
- Remembering or restoring the exact Variant status set that existed before bulk inactivation.
- Selecting individual Product Variants inside the Product inactivation dialog.
- Cascading Product soft deletion into Product Variants, Bills of Materials, origins, or descendants.
- Hard deletion of Products, Product Variants, or Bills of Materials.
- Changing Product Lifecycle Status values or adding lifecycle transition rules.
- Adding new roles or changing existing deleted-record permissions.
- Adding audit history, status-change history, Updated By, undo, or scheduled availability changes.
- Generalizing the Product-table action menu into a repository-wide menu abstraction.
- Refactoring unrelated Product, Product Variant, or Bills of Materials modules.

## Further Notes

- The completed Product Management and Bills of Materials Builder work provide the existing UI, API, persistence, and testing precedents for this feature.
- The Product glossary and accepted ADR define the current domain language. When an older completed PRD or decision conflicts with this PRD, this PRD and the ADR govern the additional implementation.
- The Product Variant invariant is application-enforced through the approved mutation paths and transactions; the migration establishes the invariant for existing non-deleted records.
- After approval, this PRD should be split into independently implementable tracer-bullet issues with explicit blocking relationships.
