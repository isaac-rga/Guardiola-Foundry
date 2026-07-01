# Product Management

Status: ready-for-agent

## Problem Statement

Guardiola Foundry already exposes a `Products` destination inside the authenticated app shell, but it is still a placeholder route with no operational workflow behind it. The business needs a first real Product Management module for bridal design records, not sellable SKUs, so teams can register products quickly, track their lifecycle stage, maintain core product details, and retire or recover records safely. The first slice must stay simple: full CRUD for Product records, a fast registration flow, a table-first working surface, and clear boundaries around what is not included yet, especially collection management, BOM management, lifecycle automation, and change history.

## Solution

Introduce a Product Management module rooted in the existing authenticated `Products` area. A `Product` is a bridal design record that moves through a lifecycle from `Concept` to `Finished`. Users will land on a product list with prominent search and simple filters, create new Products through a lightweight modal, open any Product directly into a dedicated edit page, and manage operational state through `Active`/`Inactive`, soft delete, and admin-only restore behavior. The first slice loads the working Product list in full, filters client-side, uses controlled reference data for `Collection`, and keeps BOMs visible only as deferred context rather than editable nested data.

## User Stories

1. As a `User`, I want to see a table of Products in the authenticated app, so that I can work from a single operational list.
2. As a `User`, I want each row to represent one `Product`, so that the list stays focused on product records rather than nested BOM data.
3. As a `User`, I want to register a Product quickly with only the minimum required information, so that I can capture work early and complete details later.
4. As a `User`, I want new Products to default to `Lifecycle Status = Concept`, so that newly registered records start in a sensible lifecycle state.
5. As a `User`, I want new Products to default to `Product Status = Active`, so that newly registered records are immediately usable unless I choose otherwise.
6. As a `User`, I want the create flow to let me override lifecycle and product status if needed, so that the registration flow remains flexible without becoming heavy.
7. As a `User`, I want the create flow to happen in a modal from the list page, so that I can register Products quickly without leaving the working list.
8. As a `User`, I want the create modal to close and reset after success, so that I can register multiple Products in sequence.
9. As a `User`, I want the new Product to appear in the list immediately after creation, so that I can confirm the record was created.
10. As a `User`, I want to open a Product directly from the list into its dedicated page, so that I can edit and enrich the record in a fuller workspace.
11. As a `User`, I want the Product page itself to be the editable page, so that the first slice avoids a separate read-only details view.
12. As a `User`, I want the edit page to expose core product details and product state clearly, so that the form is understandable at a glance.
13. As a `User`, I want to edit `Product name`, `Product image`, `Product category`, `Short product description`, `Collection`, `Lifecycle Status`, and `Product Status`, so that I can maintain the whole first-slice Product record.
14. As a `User`, I want optional fields to remain optional, so that I can progressively enrich Products over time.
15. As a `User`, I want `Collection` to be optional, so that a Product can exist before it is assigned to an annual collection.
16. As a `User`, I want `Product Category` to be optional initially, so that registration is not blocked by early classification decisions.
17. As a `User`, I want `Product Image` to be optional, so that image handling does not block product registration.
18. As a `User`, I want the first slice to support only one primary Product image, so that image handling stays simple.
19. As a `User`, I want Product image upload to happen on the edit page rather than in the create modal, so that the registration flow stays fast.
20. As a `User`, I want to remove an existing Product image and return the Product to a no-image state, so that optional really means optional.
21. As a `User`, I want `Short product description` to be plain text, so that I can add quick descriptive notes without editor complexity.
22. As a `User`, I want duplicate Product names to warn me but not block me, so that concept-stage naming does not become artificially rigid.
23. As a `User`, I want duplicate warnings to appear while I type on both create and edit, so that the signal arrives early and consistently.
24. As a `User`, I want duplicate warnings to ignore case and deleted records, so that the warning reflects meaningful active working data.
25. As a `User`, I want the list to show Product name, collection context, lifecycle/product status, creation context, and row actions, so that I can scan operationally important information quickly.
26. As a `User`, I want `Collection` to appear as a badge in the Product name column, so that the table stays compact.
27. As a `User`, I want `Lifecycle Status` and `Product Status` shown together, so that state scanning stays compact.
28. As a `User`, I want `Created by` and `Created at` shown together, so that registration context is visible without extra columns.
29. As a `User`, I want search by Product name, so that I can quickly find the Product I want.
30. As a `User`, I want the search input to be prominent and appear before the filters, so that the main retrieval action is visually obvious.
31. As a `User`, I want simple single-select filters for lifecycle status, product status, category, and collection, so that the list stays easy to use.
32. As a `User`, I want filter options for `No collection` and `No category`, so that I can find incomplete records directly.
33. As an `Admin`, I want an extra filter to include deleted Products, so that exceptional recovery data is available when needed.
34. As a non-admin `User`, I want deleted Products hidden completely from normal list use, so that the working list stays focused on live records.
35. As an `Admin`, I want deleted Products hidden by default unless I opt in, so that my normal starting view is still the active working list.
36. As a `User`, I want the first list to load in full and filter client-side, so that the first slice stays technically simple.
37. As a `User`, I want the default list order to show newest Products first, so that recently registered records stay easiest to revisit.
38. As a `User`, I want the list to preserve my current filters and practical position when I return from editing, so that I can continue working through several Products efficiently.
39. As a `User`, I want an empty state when nothing matches the current filters, so that I understand the result and can either clear filters or create a Product.
40. As a `User`, I want to change `Product Status` between `Active` and `Inactive` directly from the list, so that light operational state changes do not require opening the Product page.
41. As a `User`, I want `Inactive` Products to remain editable, so that they can still be corrected or reactivated later.
42. As a `User`, I want `Delete` to remove a Product from normal working views, so that mistaken or disposable records can be retired beyond ordinary inactivity.
43. As a `User`, I want delete to be confirmation-based, so that a destructive action is not triggered accidentally.
44. As a `User`, I want `Delete` available only on the Product edit page, so that the list remains focused on scanning and lightweight state change.
45. As a maintainer, I want delete implemented as soft delete rather than hard delete, so that records can be recovered later.
46. As an `Admin`, I want a `Restore` action for soft-deleted Products, so that recoverable delete is actually operationally useful.
47. As an `Admin`, I want restore available from the deleted Product page, so that deleted-record recovery stays in the deeper workflow surface.
48. As an `Admin`, I want deleted Products to become editable only after restore, so that recovery and normal editing are kept distinct.
49. As an `Admin`, I want restored Products to come back with their previous lifecycle status preserved but `Product Status = Inactive`, so that recovery is safe by default.
50. As a non-admin `User`, I want direct access to a deleted Product to show a removed-record message, so that I understand why it is unavailable and that an admin is required for recovery.
51. As a `User`, I want direct access to a nonexistent Product ID to show a normal not-found error, so that missing data and deleted data remain distinguishable.
52. As a `User`, I want immutable metadata such as `Product ID`, `Created by`, and `Created at` visible on the Product page, so that I can reference the record accurately.
53. As a `User`, I want the internal Product ID to stay visually discreet, so that it is available when needed without dominating the page.
54. As a `User`, I want `Product ID` to be system-generated and stable, so that routing and record operations do not depend on mutable names.
55. As a `User`, I want the edit page to survive direct navigation and browser refresh, so that the Product page behaves like a real operational route.
56. As a `User`, I want explicit save behavior on the Product page, so that I know when changes become persisted.
57. As a `User`, I want a warning before leaving the Product page with unsaved changes, so that explicit save does not create accidental data loss.
58. As a `User`, I want an explicit cancel/back path from the Product page, so that I can abandon edits intentionally.
59. As a `User`, I want form validation errors inline, so that I can correct them where they occur.
60. As a `User`, I want lightweight success feedback after create, save, delete, restore, and status changes, so that the module feels reliable without interrupting me.
61. As a `User`, I want controls that mutate Product state to disable while requests are in flight and show loading feedback, so that accidental double submission is avoided.
62. As a future implementer, I want Product records to acknowledge multiple Bills of Materials without managing them yet in this slice, so that Product CRUD can ship without becoming a nested BOM editor.

## Implementation Decisions

- A `Product` in this module is a bridal design record that moves through the bridal lifecycle. It is not a sellable SKU and not an inventory item.
- A `Product` may have multiple `Bills of Materials`, but BOM management is out of scope for this slice.
- The first slice delivers Product CRUD only. BOM create/edit workflows are deferred.
- The `Products` route becomes a real operational module inside the existing authenticated `/app/products` surface.
- The list is the main working surface. It loads the full visible Product set up front and filters client-side.
- The default list sort is newest first by `Created at`.
- Search applies only to `Product name`.
- The search input should be visually prominent and appear before the filters.
- Filters are single-select only in the first slice.
- The first-slice filters are `Lifecycle Status`, `Product Status`, `Product Category`, and `Collection`, plus an admin-only filter to include deleted Products.
- Filter state remains local page state rather than URL state, but should be preserved when the user opens a Product and returns to the list.
- The list remains text-only. It does not include image thumbnails in the first slice.
- The list row is the primary navigation path into the Product page.
- The row actions surface is intentionally small in the first slice and includes only `Active`/`Inactive` state changes.
- `Delete` does not appear in row actions. It is available only from the Product page.
- Product creation happens in a modal launched from the list page.
- The create modal contains only `Product name`, `Lifecycle Status`, and `Product Status`.
- `Product name` is required.
- `Lifecycle Status` is prefilled to `Concept` but editable.
- `Product Status` is prefilled to `Active` but editable.
- The create modal closes silently on cancel and always clears its input state when closed.
- On successful create, the modal closes, resets, and the list updates immediately with the new row visible.
- The Product page is directly editable. There is no separate read-only details page in the first slice.
- The Product page groups editable fields into two sections:
- core product details: `Product name`, `Product category`, `Short product description`, `Collection`, `Product image`
- product state: `Lifecycle Status`, `Product Status`
- A secondary low-emphasis metadata area shows `Product ID`, `Created by`, and `Created at`.
- `Product ID` is a short system-generated stable identifier used for routing and CRUD. It is read-only to users.
- Product routes use only the short `Product ID` in the URL.
- `Created by` is the authenticated `User` who registered the Product and remains immutable.
- `Created at` is immutable registration metadata.
- `Product name` may repeat. Duplicate-name checks are warnings only, not blockers.
- Duplicate warnings are case-insensitive, ignore leading/trailing whitespace, and ignore soft-deleted Products.
- Duplicate warnings appear live in both the create modal and the Product page.
- Saved `Product name` values are normalized by trimming leading and trailing whitespace only. Internal spacing is preserved.
- `Short product description` is optional plain text and is trimmed at the edges on save if present.
- `Product Category` is a fixed enum with exactly `Dress`, `Accessory`, and `Other`.
- `Other` is an intentional category and is distinct from having no category.
- `Product Category` is optional in the first slice.
- `Collection` is a controlled annual tag chosen from prefilled database reference data.
- `Collection` is optional in the first slice.
- The module does not create or manage `Collection` records. Collection management is out of scope.
- `Product Image` is optional and limited to a single primary image in the first slice.
- `Product Image` is uploaded as a file through the app, not stored as an external URL.
- Image upload and removal are available on the Product page, not in the create modal.
- `Lifecycle Status` and `Product Status` are separate concepts and are edited through separate controls.
- `Lifecycle Status` is one of `Concept`, `Fabric & Trim Selection`, `Design & Prototyping`, `Testing`, `Approved`, `On Documentation`, or `Finished`.
- In the first slice, `Lifecycle Status` is freely editable between the allowed values. Transition rules are out of scope.
- `Product Status` is limited to `Active` and `Inactive`.
- `Inactive` is the normal retirement state for ordinary operational use and does not make the Product read-only.
- User-facing `Delete` is implemented as soft delete under the hood. The UI uses the plain `Delete` label and does not expose a separate hard-delete concept.
- Hard delete is out of scope and not user-facing anywhere in this module.
- Soft-deleted Products are removed from normal working views by default.
- Non-admin users cannot see soft-deleted Products in the list or access them by normal workflow.
- Non-admin users who navigate directly to a deleted Product should see a removed-record message explaining that an admin is required for recovery.
- Direct access to a nonexistent Product ID should show a normal not-found error.
- Admins may opt into viewing deleted Products through an admin-only filter that is off by default.
- Soft-deleted Product pages are read-only until restored.
- A deleted Product page should show `Restore` instead of `Delete`; both actions should never appear simultaneously.
- Restoring a Product keeps its previous `Lifecycle Status`, sets `Product Status = Inactive`, and returns the page to normal editable mode.
- Deleting a Product from the Product page redirects the user back to the main list with confirmation feedback.
- Deleting a Product should also set `Product Status = Inactive`.
- The first slice uses the existing role model: `Admin` and `Operator` can use the Product module, but deleted-record visibility and restore are admin-only.
- The first slice assumes last-write-wins for concurrent edits and does not add record locking or conflict resolution.
- Concurrent save failures are treated as generic save failures with retry guidance, not as rich conflict explanations.
- The module should prefer toast feedback for completed record actions and use inline feedback where field or form context makes more sense.
- Any UI element that mutates record state should disable while its request is in flight and show visible pending feedback.
- The Product page supports direct URL access and browser refresh by reloading Product data from saved state using `Product ID`.

## Testing Decisions

- Good tests for this slice should verify user-visible behavior: list rendering, search and filter behavior, create-modal flow, Product page editing, duplicate-name warnings, state changes, soft delete, restore, access rules, and direct URL behavior.
- The highest preferred seams are the Product API HTTP boundary and the web route boundary around `/app/products` and the Product edit route.
- Web tests should favor route-level behavior over implementation-detail assertions. They should verify navigation from the list to the Product page, preserved working-list context on return, inline validation, pending states, success feedback, and deleted/not-found access messages.
- API tests should verify persisted CRUD behavior, allowed enums, soft-delete visibility rules, restore behavior, immutable creation metadata, short ID lookup, and role-based access around deleted records.
- Duplicate-name warning tests should verify the agreed semantics: warning only, case-insensitive matching, trimmed-edge normalization, and ignoring deleted records.
- Product-list tests should verify the prominent name search, single-select filters, `No collection` and `No category` filtering, newest-first ordering, and the admin-only deleted-record filter behavior.
- Product-page tests should verify explicit save, unsaved-changes warning, cancel/back behavior, image optionality, metadata visibility, and deleted-page read-only behavior.
- Deletion tests should verify that ordinary users never gain deleted-record visibility, that delete redirects back to the list, and that admin restore returns the Product to editable mode with `Inactive` status preserved.

## Out of Scope

- Bill of Materials creation, editing, or nested management
- Collection management
- Category management
- Lifecycle transition rules or lifecycle-driven automation
- Hard delete
- Bulk actions
- Pagination
- User-controlled table sorting
- URL-synced filters
- Rich text descriptions
- Multiple Product images or galleries
- Live collaboration or conflict resolution
- Change history or audit trail UI
- Copy-to-clipboard behavior for `Product ID`
- Thumbnail images in the list
- Separate read-only Product details pages

## Further Notes

- The language fixed during design should remain stable in implementation: `Product`, `Collection`, `Product Category`, `Lifecycle Status`, `Product Status`, `Product Image`, `Created By`, `Created At`, and `Product ID`.
- `Collection` is reference data that already exists in the database for this slice; the Product module only consumes it.
- The first slice intentionally separates normal retirement (`Inactive`) from recoverable removal (`Delete` implemented as soft delete).
- The first slice also preserves a clear difference between unclassified (`No category`) and intentionally classified as `Other`.
- The module is intentionally optimized for simple operational CRUD, not yet for product-structure management, reporting, or workflow automation.
