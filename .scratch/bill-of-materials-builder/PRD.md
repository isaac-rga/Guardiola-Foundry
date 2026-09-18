# Bills of Materials Builder

Status: ready-for-agent

## Problem Statement

Guardiola Foundry has Materials, Sources, and Products, but it does not yet provide an operational way to define the ordered textile composition of a Product or resolve that composition for a concrete Product Variant. The existing Bills of Materials route is a throwaway prototype backed only by in-memory fixtures. Users cannot persist a reusable BOM Template, create a concrete BOM Implementation, maintain BOM Lines progressively, consult Pattern Set quantity proposals, understand current material-cost projections, or safely copy, delete, restore, and edit Bills of Materials under concurrent use.

The business also needs these workflows to preserve distinctions that spreadsheets and naive CRUD models tend to flatten. A BOM Template and BOM Implementation share line behavior but have different Product relationships. A Product Variant's commercial name is not its BOM Typification. A BOM Line selects a Material, not a Source or historical cost. Pattern Set proposals inform a human decision but do not become automatic calculation or stored evidence. Incomplete, Unverified, and attention-bearing lines must remain usable without being misrepresented as ready or cost-complete.

## Solution

Replace the in-memory prototype with a persisted Bills of Materials module and the validated operational catalog and Construction Board Builder. Users will browse Templates and Implementations together, create either kind through contextually valid entry points, edit a complete Bill of Materials through one explicit atomic save, derive independent copies with immutable immediate lineage, and soft-delete or restore records without cascading changes.

The first delivery includes the minimum Product Variant and Pattern Set capabilities needed by the workflow. Product Variants remain permanently owned by Products and can receive at most one available BOM Implementation. Pattern Sets remain a globally reusable catalog with optional width-based quantity proposals. Searchable dialogs query Materials, Pattern Sets, and eligible Product Variants remotely through distinct bounded contracts. BOM Lines retain only their construction data, Material, final Material Quantity, optional Pattern Set, note, order, and line-level verification. Current Source context and BOM Cost Projection are derived live, with explicit partial and unavailable states and non-blocking attention signals.

## User Stories

1. As a User, I want one Bills of Materials catalog, so that I can find Templates and Implementations without switching workspaces.
2. As a User, I want the catalog to distinguish BOM Templates from BOM Implementations, so that I understand how each record may be used.
3. As a User, I want the catalog to search by Bill of Materials name, ID, Product, Product Variant, and BOM Origin, so that I can retrieve a record using the context I know.
4. As a User, I want to filter the catalog by all Bills of Materials, Templates, or Implementations, so that I can narrow the operational list.
5. As an Admin, I want to include soft-deleted Bills of Materials in the catalog, so that I can inspect and recover unavailable records.
6. As an Operator, I want soft-deleted Bills of Materials excluded from ordinary catalog results, so that normal work stays focused on available records.
7. As a User, I want the catalog to show each Bill of Materials name and stable ID, so that human and system identities remain clear.
8. As a User, I want the catalog to show Product and Product Variant context, so that I can distinguish similarly named records.
9. As a User, I want the catalog to show the immediate BOM Origin, so that I can understand where a derived record came from.
10. As a User, I want the catalog to show current BOM Cost Projection and its availability, so that incomplete costing is not presented as a complete total.
11. As a User, I want the catalog to show total and Verified line counts, so that I can scan composition progress.
12. As a User, I want a summary of total available Bills of Materials with Template and Implementation counts, so that I can understand the current workload.
13. As a User, I want a summary of Bills of Materials without an associated Product Variant, so that unresolved concrete work remains visible.
14. As a User, I want a summary of Bills of Materials with at least one Unverified line, so that review work is visible.
15. As a User, I want one Create BOM menu with separate Template and Implementation actions, so that the kind is intentional from creation.
16. As a User, I want to create an unassociated BOM Template, so that reusable construction knowledge can exist before a Product association is decided.
17. As a User, I want to associate a new BOM Template with an eligible Product, so that it can later create Implementations for that Product's Variants.
18. As a User, I want the product experience to strongly recommend associating a Template with a Product without requiring it, so that the relationship is encouraged but early work is not blocked.
19. As a User, I want a Template's Product association to become permanent once assigned, so that its eligibility boundary cannot drift.
20. As a User, I want each Product to have at most one available associated BOM Template, so that there is no ambiguous primary Template.
21. As a User, I want to create a BOM Implementation only after selecting an eligible Product Variant, so that every Implementation has valid permanent ownership.
22. As a User, I want the selected Product Variant to remain immutable context in the Builder, so that an Implementation cannot be reassigned accidentally.
23. As a User, I want BOM Typification entered separately from the Product Variant's commercial name, so that construction identity does not become coupled to merchandising language.
24. As a User, I want BOM Typification to remain editable after creation, so that construction naming can improve without changing the Product Variant.
25. As a User, I want BOM Typification to be unique among available Implementations of the same Product, so that operational references are unambiguous.
26. As a User, I want the same BOM Typification to be allowed for different Products, so that product-local terminology is not needlessly global.
27. As a User, I want to save an Implementation with no lines or unresolved lines, so that composition can be developed progressively.
28. As a User, I want Product Variant availability and BOM readiness to remain separate, so that the system does not invent a Draft or approval state.
29. As a User, I want to derive an Implementation from an associated Template only for an eligible Variant of that Product, so that the Template's permanent scope is enforced.
30. As a User, I want applying a Template to an occupied Product Variant to be blocked, so that no existing Implementation is overwritten or merged.
31. As a User, I want to derive a new Template from an existing Template, so that I can reuse construction knowledge without live inheritance.
32. As a User, I want to derive a new Template from an Implementation, so that proven concrete work can become reusable configuration.
33. As a User, I want Product association proposed when deriving a Template from Product-bound work, so that the likely relationship is convenient.
34. As a User, I want to remove that proposed Product association before creating the Template, so that the copy may become cross-Product reusable.
35. As a User, I want every derived Bill of Materials to receive a new identity and new BOM Line identities, so that source and destination evolve independently.
36. As a User, I want every derived Bill of Materials to record its immediate BOM Origin, so that copied work is not presented as manually authored.
37. As a User, I want BOM Origin to remain immutable, so that lineage remains trustworthy.
38. As a User, I want derivation chains to remain navigable without an artificial depth limit, so that repeated reuse is preserved.
39. As a User, I want deleting or restoring an origin to leave descendants unchanged, so that independent Bills of Materials are not mutated transitively.
40. As a User, I want a deleted origin to remain visible as unavailable lineage, so that the derivation chain is not silently broken.
41. As an Operator, I want only compact metadata for a deleted BOM Origin, so that Admin-only deleted content remains protected.
42. As an Admin, I want to open complete soft-deleted Bills of Materials, so that exceptional recovery work is possible.
43. As a User, I want one Construction Board Builder for Template and Implementation creation and update, so that the editing model stays consistent.
44. As a User, I want the Bill of Materials name to be the Builder heading and directly editable, so that identity remains prominent without duplicating controls.
45. As a User, I want kind, Product, and Product Variant shown as context rather than editable fields when immutable, so that the Builder exposes only valid actions.
46. As a User, I want an optional Bill of Materials description, so that record-level construction context can be preserved.
47. As a User, I want to add any number of independently identified BOM Lines, so that repeated construction occurrences are represented without ambiguity.
48. As a User, I want one focused line editor while retaining the full ordered line navigator, so that a large composition remains scannable.
49. As a User, I want each BOM Line to require a free-text Construction Piece, so that its placement is explicit without inventing a catalog taxonomy.
50. As a User, I want the same Construction Piece or Material to appear on multiple BOM Lines, so that layers and repeated uses remain distinct.
51. As a User, I want to reorder BOM Lines with drag handles, so that the logical display order matches how I review the composition.
52. As a keyboard User, I want Arrow Up and Arrow Down as the ordering fallback, so that reordering does not require pointer input.
53. As a User, I want to remove a BOM Line before saving, so that obsolete construction occurrences are not retained.
54. As a User, I want an unsaved removal to be undoable when the interface offers it, so that local editing mistakes are recoverable.
55. As a User, I want a BOM Line to exist without a selected Material, so that unresolved construction work can be saved.
56. As a User, I want to select at most one Material per BOM Line, so that alternatives are represented as separate decisions rather than hidden choices.
57. As a User, I want Material Quantity recorded in meters with up to three decimal places, so that textile consumption supports millimeter precision.
58. As a User, I want Material Quantity to require a positive value, so that zero and negative consumption are not accepted.
59. As a User, I want changing or removing Material to clear Material Quantity, so that a quantity based on different textile characteristics is not retained accidentally.
60. As a User, I want an optional Line Note, so that construction guidance can travel with the line.
61. As a User, I want BOM Line Completeness derived from Construction Piece, Material, and valid Material Quantity, so that incomplete work is visible without becoming separate mutable status.
62. As a User, I want Incomplete lines to remain saveable, so that completeness does not block progressive authoring.
63. As an Operator, I want to mark a Complete line Verified with my identity and the current time, so that human review is recorded where it occurred.
64. As an Operator, I want to return a Verified line to Unverified manually, so that review state can be withdrawn explicitly.
65. As a User, I want changes to Construction Piece, Material, or Material Quantity to reset verification, so that verification never outlives the facts it reviewed.
66. As a User, I want changes to Line Note, order, Pattern Set, or Bill of Materials metadata to preserve verification, so that unrelated edits do not create unnecessary re-review.
67. As a User, I want copied lines to begin Unverified, so that verification is not inherited across independent records.
68. As a User, I want Material selection through an on-demand searchable dialog, so that the browser does not need to load the whole catalog.
69. As a User, I want Material results to show identity, color, Material Use, and useful Preferred Source context, so that I can choose the intended textile.
70. As a User, I want active Materials with sourcing attention to remain selectable, so that catalog cost gaps do not block construction decisions.
71. As a User, I want unavailable Materials already retained by a line to remain visible, removable, replaceable, and saveable, so that catalog changes do not erase construction information.
72. As a User, I want a retained unavailable Material labeled `Material needs attention`, so that I know it cannot be selected for new work.
73. As a User, I want Material and Source corrections to remain in their owning catalog workflows, so that the Builder does not become a second catalog editor.
74. As a User, I want to select an optional Pattern Set through an on-demand searchable dialog, so that reusable pattern context can be attached without a large inline list.
75. As a User, I want Pattern Set results to show name, stable ID, and proposal count, so that I can identify useful catalog records.
76. As a User, I want to consult current width-based Pattern Set Quantity Proposals, so that documented cutting evidence can inform my quantity decision.
77. As a User, I want an explicit Use proposed quantity action, so that a proposal never changes Final meters without my decision.
78. As a User, I want the copied proposal value to become ordinary editable Material Quantity, so that the final quantity remains human-owned.
79. As a User, I want changing or removing Pattern Set to preserve Material Quantity and verification, so that advisory context does not control line facts.
80. As a User, I want a Retired Pattern Set already retained by a line to remain visible and usable for consultation, so that retirement does not erase existing context.
81. As a User, I want a retained Retired Pattern Set labeled `Pattern needs attention`, so that it is distinguished from available catalog choices.
82. As a User, I want the Builder to show current Preferred Source name, Vendor, Vendor Shade or detail, width, and Landed Unit Cost as read-only Material context, so that sourcing context informs review without becoming BOM-owned data.
83. As a User, I want each calculable line to show Projected material cost, so that I can understand its current contribution.
84. As a User, I want each line projection rounded to MXN cents and the aggregate to sum those visible rounded values, so that line and total amounts reconcile.
85. As a User, I want an explicit zero Landed Unit Cost treated as calculable, so that zero is not confused with missing data.
86. As a User, I want missing Material, quantity, or usable Landed Unit Cost identified as a projection exclusion reason, so that absent cost is not represented as zero.
87. As a User, I want BOM Cost Projection Availability shown as Complete, Partial, or Unavailable, so that the total communicates its evidence boundary.
88. As a User, I want a Partial projection to show the calculable sum and excluded-line count, so that I can use known cost without overlooking gaps.
89. As a User, I want an Unavailable projection shown without an MXN zero, so that lack of cost evidence is not mistaken for a free composition.
90. As a User, I want `Source needs attention` on a line with no usable Preferred Source and Landed Unit Cost, so that sourcing gaps remain visible without blocking the BOM.
91. As a User, I want Material, Source, and Pattern attention conditions to coexist independently, so that one warning does not conceal another.
92. As a User, I want the Whole BOM summary to show line, completeness, verification, attention, cost, exclusion, and origin information, so that aggregate context remains separate from focused editing.
93. As a User, I want an explicit Save action for the complete Bill of Materials, so that I control when a coherent draft becomes persisted.
94. As a User, I want metadata, lines, order, and verification saved atomically, so that structural validation failure cannot persist a partial edit.
95. As a User, I want opening and abandoning a create Builder before its first save to create no record or relationship reservation, so that empty drafts do not occupy catalog slots.
96. As a User, I want a warning before leaving the Builder with unsaved changes, so that I can continue editing or deliberately discard them.
97. As a User, I want a stale save blocked with an option to reload the current record, so that one session cannot overwrite newer work silently.
98. As a User, I want a deleted record opened in another Builder to reject later saves, so that saving never restores it implicitly.
99. As a User, I want server validation conflicts to preserve my local draft, so that I can correct a stale selection or occupied Variant without re-entering work.
100. As a User, I want live Source, cost, and Pattern Set projection changes not to create BOM edit conflicts, so that derived context remains separate from persisted composition.
101. As an Admin or Operator, I want to soft-delete an available Bill of Materials after an explicit contextual confirmation, so that its exclusive relationship slot can be released safely.
102. As a User, I want descendants to remain available when a Bill of Materials is soft-deleted, so that deletion does not cascade through lineage.
103. As an Admin, I want to restore a soft-deleted Bill of Materials when its relationship and typification constraints are still available, so that accidental deletion is recoverable.
104. As an Admin, I want restoration conflicts to identify the current occupying Bill of Materials without overwriting either record, so that I can resolve the conflict deliberately.
105. As an Admin or Operator, I want existing Bills of Materials to remain editable when their Product or Product Variant becomes Inactive, so that availability does not prevent maintenance.
106. As a User, I want a Bill of Materials to become read-only when its related Product or Product Variant is soft-deleted, so that content is not edited outside valid Product structure.
107. As a User, I want contextually invalid actions hidden or explained with a reason and next step, so that I do not need to memorize mutation rules.
108. As a User, I want catalog dialogs to stay idle until I type, so that opening a selector does not issue a broad query.
109. As a User, I want catalog search to ignore case, accents, and insignificant whitespace, so that normal typing variations still find records.
110. As a User, I want multi-word search to match all words in any order across the relevant fields, so that descriptive queries are useful.
111. As a User, I want deterministic ranked search results, so that exact IDs and names appear before looser context matches.
112. As a User, I want up to 25 results and a prompt to refine when more matches exist, so that dialogs remain bounded without pagination controls.
113. As a User, I want Product Variant candidates to show eligibility or one canonical ineligibility reason, so that I understand why a match cannot be selected.
114. As a User, I want ineligible in-scope Product Variants to remain visible but non-selectable, so that an empty result is not confused with a business rule.
115. As a User, I want late search responses ignored after I change the query, so that stale results cannot replace the current search.
116. As a User, I want loading, empty, recoverable failure, authentication, and authorization states communicated clearly, so that selector failures do not clear my existing choice.
117. As a keyboard or assistive-technology User, I want dialog results to support native activation, focus return, and live announcements, so that selection is accessible.
118. As a narrow-screen User, I want the same selector workflow in a near-full-screen stacked dialog, so that the Builder remains usable on small displays.
119. As a User, I want repeated identical catalog searches reused briefly within my session, so that selection feels responsive without persisting stale caches across reloads.
120. As a User, I want a successful save to refresh current catalog context and canonical BOM Cost Projection, so that local previews yield to authoritative current data.
121. As a maintainer, I want Material, Pattern Set, Product Variant, and BOM responsibilities to remain in their owning modules, so that the feature does not collapse distinct domains.
122. As a maintainer, I want database constraints and atomic transactions to enforce relationship, uniqueness, lineage, and concurrency rules, so that concurrent callers cannot create invalid states.
123. As a maintainer, I want public contracts shared and runtime-validated across API and web, so that the Builder cannot drift from server behavior.
124. As a reviewer, I want existing spreadsheet compositions used only as fixtures, so that this delivery is not expanded into an import or migration project.

## Implementation Decisions

- Use one discriminated Bill of Materials model with a permanent `Template` or `Implementation` kind. Shared data includes stable identity, required display name, optional description, immutable Created By and Created At, latest update timestamp, optional immutable immediate BOM Origin, and independently owned ordered BOM Lines.
- Treat Bills of Materials as operationally core domain behavior. Keep its invariants, derivation rules, line transitions, cost-projection rules, and mutation eligibility in a pure domain boundary, with application services coordinating transactions and adapters handling persistence and HTTP. Keep simple Product Variant and Pattern Set catalog CRUD layered and concrete.
- A Template has no Product Variant and may have one Product. A Product association is optional at creation, permanent once assigned, and limited to one available associated Template per Product.
- An Implementation requires one permanent Product Variant and does not store a duplicate Product relationship. Its required display name is the manually assigned BOM Typification, which remains independent from the live commercial Product Variant name.
- A Product owns zero or more permanent Product Variants. Variant names are case-insensitively unique among non-deleted Variants of that Product, Variants default to Active, and a Variant may have at most one non-deleted Implementation.
- An Active Product may receive Variants regardless of Lifecycle Status. Inactive or soft-deleted Products cannot receive new Variants, Template associations, or Implementations. An Inactive Variant cannot receive an Implementation.
- Product and Variant inactivity preserves existing Bills of Materials and permits their maintenance. Soft deletion of the related Product or Variant makes the Bill of Materials read-only until restoration, except that a non-deleted Bill of Materials may still create a new unassociated Template.
- BOM Typification is case-insensitively unique among non-deleted Implementations of one Product. Soft deletion releases both Variant occupancy and typification uniqueness; restoration revalidates both.
- BOM Derivation always creates a new destination and new line identities from the source's current description and ordered lines. It records only the immutable immediate BOM Origin, starts copied lines Unverified, and never shares data or propagates later edits.
- Enforce an acyclic, unbounded lineage graph. Store no root, depth, duplicated descendants, historical snapshot, or line-level lineage. Resolve longer ancestry one immediate origin at a time.
- Suggest `<current origin name> — copy` for a derived Template without requiring unique Template names. Deriving a Template from Product-bound work proposes that Product association but allows removal; an ineligible suggested Product produces an unassociated Template.
- Use one BOM Line model for both kinds. A line has stable identity, exclusive Bill of Materials ownership, explicit order, required free-text Construction Piece, optional Material, optional Material Quantity, optional Pattern Set, optional Line Note, and optional current verification evidence.
- Material Quantity is expressed in meters, must be positive, and supports up to three decimal places. It cannot exist without Material. Changing or removing Material clears quantity and verification.
- Derive BOM Line Completeness rather than storing it. A line is Complete only when it has Construction Piece, Material, and valid Material Quantity; Incomplete lines remain saveable.
- BOM Line Verification is manual, informational, and line-specific. Only Complete lines may be Verified. It records the current Operator and timestamp. Construction Piece, Material, or quantity changes reset it; note, order, Pattern Set, and Bill of Materials metadata changes do not. There is no aggregate verification state.
- Pattern Set is a globally reusable catalog with stable identity, unique normalized name across Active and Retired records, optional description, immutable creation metadata, and Active or Retired status.
- A Pattern Set owns zero or more width-based Quantity Proposals. Each proposal pairs a unique positive assumed width in centimeters with a positive quantity in meters to three decimal places and an optional evidence note; proposals display in ascending width.
- A BOM Line retains only the optional Pattern Set reference and its independent final Material Quantity. It stores no proposal choice, assumed width, evidence, or proposal history. Applying a proposal is an explicit copy into quantity.
- Pattern Set retirement preserves references and proposals. Retired records cannot be edited or newly selected, but retained lines may keep, remove, consult, copy, and use them while deriving `Pattern needs attention`.
- Pattern Set edits or retirement affecting retained lines require a non-blocking confirmation with impacted line and Bill of Materials counts. Restoration preserves identity and references. Physical or soft deletion is not supported.
- A BOM Line persists Material, never Source, Vendor Shade, Source width, cost, currency, Price Date, or effective-date evidence. Preferred Source details and Landed Unit Cost are live read-only projections owned by Materials and Sources.
- Calculate each line's current projected material cost from Material Quantity multiplied only by Landed Unit Cost in MXN per meter. Round each line to MXN cents, then sum the rounded values for the Bill of Materials projection. Explicit zero is calculable; absent cost is unavailable.
- Derive BOM Cost Projection Availability as `Complete`, `Partial`, or `Unavailable`. Partial returns the calculable sum and excluded-line count; Unavailable never renders as zero. Projection eligibility is independent from Construction Piece, completeness, verification, and attention.
- Keep cost calculation and availability behind one small authoritative module interface. The API recalculates the canonical projection on load and save; the web may preview from loaded context and replaces that preview with the server response.
- Existing unavailable Material references remain usable and may continue contributing to cost when retained sourcing data is usable. Derive `Material needs attention` for unavailable Material and `Source needs attention` when the current or retained Preferred Source relationship or its Landed Unit Cost is unusable.
- Allow `Material needs attention`, `Source needs attention`, and `Pattern needs attention` to coexist. They never block save, derivation, verification, or use. Any Bill of Materials-level attention count is a derived summary, not stored status.
- Keep Source and Material correction in their owning workflows. The Builder may navigate to relevant context or replace Material, but cannot restore Materials, change Preferred Source, or edit Source costs.
- Preserve the established Preferred Source invariant in Sources. The BOM handles the current possibility of unusable sourcing defensively without duplicating or redefining Source mutation rules.
- Use reversible soft deletion as the only Bill of Materials availability lifecycle. Do not add Draft, Active, Archived, Published, approval, readiness, or aggregate verification states.
- Soft deletion releases exclusive Product or Product Variant relationships, preserves lineage, and does not cascade. Confirmation identifies the Bill of Materials and its Product context and, when applicable, descendant count and continued lineage.
- Admin and Operator may create, edit, derive, and soft-delete available Bills of Materials. Only Admin may browse complete deleted records and restore them. Operator lineage views of deleted origins expose only compact name, kind, and availability.
- Restore only when association, Variant occupancy, and typification constraints remain available. Conflicts identify the occupying Bill of Materials and never overwrite, delete, or reassign either record.
- Keep identity, permanent kind, origin, creation metadata, Implementation Variant, and assigned Template Product immutable. Bill of Materials name or BOM Typification, description, lines, line order, notes, and verification remain editable where allowed.
- Use explicit, whole-Bill-of-Materials Save for create and update. Persist metadata, lines, removals, order, and verification atomically. Opening a create Builder reserves nothing; leaving before the first successful save creates nothing.
- Use optimistic concurrency through a server-owned update marker. Every persisted Bill of Materials or line change advances it. A stale, deleted, or otherwise conflicting save fails without merging or overwriting and preserves the client draft for recovery.
- Live Material, Source, cost, and Pattern Set projection changes do not advance the Bill of Materials concurrency marker.
- Adopt the validated operational catalog: one searchable and filterable table containing both kinds, Sources-style density and overflow, compact summary metrics, and contextual create, edit, derive, delete, and restore actions.
- Adopt the validated Construction Board Builder: ordered line navigator, one focused editor, drag-handle ordering with keyboard fallback, header-style name and Construction Piece editing, primary verification beside Final meters, and a separate Whole BOM summary.
- Material, Pattern Set, and Product Variant selection use separate remote-search contracts owned by their respective domains. Product Variant candidate search composes Product-owned availability with BOM-owned Implementation occupancy on the server.
- Search requests normalize query whitespace and use case-insensitive, accent-insensitive, order-independent AND matching. Results rank deterministically by exact ID, exact primary name, ID prefix, name prefix, word match, and secondary context, with primary name and stable ID tie-breakers.
- Keep each search response to catalog-specific `items` plus `hasMore`, with a server-fixed limit of 25 determined from at most 26 ordered matches. Do not expose totals, pagination, incremental loading, or virtualization in this delivery.
- Material search covers Material ID, name, color, Material Use, and visible Preferred Source context, with Material identity ranked above Source-only context. Pattern Set search covers ID and name. Product Variant search covers Variant ID and name plus Product ID and name.
- Product Variant candidates return stable identity and Product context plus `selectable`, one canonical outcome, and existing Implementation ID when occupied. Outcome precedence is `implementation-exists`, then `product-unavailable`, then `variant-inactive`; derivation excludes candidates outside the Template's Product.
- Catalog dialogs remain idle for empty text, debounce non-empty input for approximately 250 milliseconds, cancel where possible, ignore superseded responses, and clear back to idle. Same-session identical searches may use a 30-second in-memory cache with mutation-scoped invalidation.
- Persisted Material and Pattern Set references resolve by stable ID. Retained unavailable or unresolved details remain visible by stable ID and saveable unchanged. Newly selected records that become unavailable before save are rejected atomically with field-level errors.
- Implementation creation revalidates Variant eligibility atomically at save. It uses no separate preflight reservation and preserves the draft if another User occupies the Variant first.
- A successful selection closes its dialog, restores trigger focus, and announces the result. Ineligible candidates remain open and announce their reason. Use native interactive controls with Tab, Enter or Space, Escape, and a live region; advanced listbox key navigation is not required.
- Use shared types and runtime schemas as the cross-boundary source of truth for Bill of Materials, BOM Line, Pattern Set, Product Variant, catalog search, projection, attention, conflict, and validation contracts.
- Target catalog-search server-response p95 at or below 500 milliseconds with at least 10,000 active records in each catalog, measured independently from client debounce.
- Existing spreadsheet compositions may supply test fixtures, but no production import or migration behavior belongs to this feature.

## Testing Decisions

- Good tests verify externally observable business outcomes, persisted state, authorization, and user-visible interaction. They should not assert ORM call order, internal component state, private helpers, or the exact arrangement of domain objects.
- Use authenticated database-backed API functional tests as the primary acceptance seam. Exercise the public Bill of Materials operations through HTTP and assert complete response contracts plus resulting persisted relationships.
- Cover Template and Implementation creation, progressive incomplete saves, atomic whole-record updates, line ordering and removal, verification transitions, derivation with independent line identities, immutable relationships, soft deletion, restoration, and authorization.
- Cover database-enforced concurrent conflicts for Product association, Product Variant occupancy, BOM Typification, restore, derivation validity, and stale update markers. Assert that losing operations leave no partial records or line mutations.
- Cover Product and Product Variant availability combinations at the API boundary, including maintenance of existing Bills of Materials, blocked creation, read-only behavior after related soft deletion, and restoration conflicts.
- Cover BOM Cost Projection at the API boundary for explicit zero, rounding, repeated Materials, Complete, Partial, and Unavailable aggregates, every exclusion reason, and independent attention conditions.
- Add focused unit tests only for dense pure rules whose outcome matrix is clearer below HTTP: cost projection and availability, line completeness and verification reset transitions, candidate eligibility precedence, and any lineage-cycle guard not fully expressible through ordinary creation flows.
- Test Material, Pattern Set, and Product Variant search contracts through database-backed API boundaries with at least representative large fixtures. Verify normalization, AND matching, deterministic ranking, the 25-item bound, `hasMore`, retained-reference resolution, role access, and candidate eligibility.
- Verify the catalog-search p95 target with a repeatable performance check against at least 10,000 active records per catalog. Keep this separate from correctness assertions and client debounce timing.
- Use route-level Vitest and Testing Library tests as the web acceptance seam, following the existing Products, Materials, and Sources route tests. Query by roles and visible text and assert user-observable behavior.
- Cover the operational catalog's authentication boundary, loading, error, empty, filters, search, summary metrics, kind distinctions, deleted-record permissions, and contextual actions.
- Cover the Construction Board's create, edit, and derive modes; focused line selection; add, repeat, reorder, and remove interactions; Material and Pattern Set dialogs; proposal application; quantity clearing; verification resets; summary projection; explicit save; field errors; stale conflicts; and unsaved-navigation confirmation.
- Cover catalog-dialog idle, debounce, loading, superseded request, results, `hasMore`, empty, recoverable failure, authentication failure, authorization failure, retained unavailable, and details-unavailable states with controlled endpoint mocks.
- Cover accessibility behavior for dialog labels, native keyboard activation, reorder fallback, focus restoration, live announcements, ineligible candidates, and narrow-screen stacking where observable in jsdom.
- Use the existing Product API functional tests as prior art for CRUD, soft deletion, restoration, authorization, and relationship availability; use Sources functional tests as prior art for catalog search, retained relationships, and attention behavior.
- Use the existing Products, Materials, and Sources web route tests as prior art for authenticated routing, URL-backed catalog state, tables, dialogs, mutations, cache refresh, and accessible assertions.
- Treat prototype files as interaction evidence, not production test targets. Replace in-memory fixtures with production contracts and retain only the approved catalog and Construction Board behaviors.

## Out of Scope

- Supplies and other non-textile inputs. Their units, purchasing, inventory, and future Bill of Materials behavior remain a separate domain concern.
- Importing or migrating spreadsheet compositions. Existing spreadsheets may inform fixtures but are not a production ingestion contract.
- Automatic meter calculation. Pattern Set proposals remain advisory values explicitly copied by a User.
- Persisting proposal selection, assumed width, Pattern evidence, Source, Vendor Shade, Source width, cost, currency, price dates, or effective-date snapshots on BOM Lines.
- Historical Product Variant or Bill of Materials revisions, line-level lineage, snapshots, audit reconstruction, Updated By, change-history UI, comparison, merge, refresh-from-origin, or propagation.
- Product Specification and commercial-specification management beyond preserving the Product Variant seam.
- Inventory allocation, purchasing, production orders, manufacturing execution, labor, waste outside recorded Material Quantity, and complete production costing.
- Cross-Product live Templates, shared BOM Lines, inheritance, or later synchronization from a BOM Origin.
- Construction groups, nested line organization, or inferring groups from Construction Piece. The first delivery uses one flat ordered Construction Board.
- Pattern files, pattern-piece geometry, grading, sizes, attachments, Product-specific Pattern Sets, and Material or Source compatibility validation.
- Inline creation or editing of Products, Product Variants, Materials, Sources, Vendor Shades, or Pattern Sets from a BOM selector.
- Catalog totals, pagination, infinite loading, virtualization, personalized ranking, recent-item ranking, polling, real-time subscriptions, or a persisted cross-session search cache.
- Advanced listbox keyboard behavior such as Arrow navigation, Home, End, or active-descendant management beyond the native controls defined for the first delivery.
- A separate Bill of Materials lifecycle, readiness, approval, publication, archive, or aggregate verification status.
- A separate financial permission for BOM Cost Projection in the first delivery.
- Fixing the existing Sources mutation gap that may remove Landed Unit Cost from a Preferred Source. Sources owns that correction; Bills of Materials only handles the resulting attention condition defensively.
- Physical deletion of Bills of Materials or Pattern Sets.
- Reopening the rejected dense Composition Table, Product-first workspace, or master-detail prototype directions.

## Further Notes

- The approved Builder direction is the Construction Board prototype, and the approved surrounding catalog is the operational mixed Template/Implementation table. Production work should preserve those decisions while replacing all prototype state and fixtures.
- Product Variant, Pattern Set, and Bill of Materials are new persisted concepts in the current application. Materials, Sources, Products, authentication, soft deletion, and role boundaries already provide the closest implementation and testing precedents.
- The first delivery intentionally separates saveability, completeness, verification, attention, availability, and cost-projection availability. Implementers should not collapse any of these into a single status.
- The Bill of Materials model must remain Materials-only even when source spreadsheets classify buttons, trims, or other non-textile inputs alongside fabrics.
- Search projections are purpose-built selection contracts, not permission to move ownership. Materials owns Material and Preferred Source context, Pattern Sets owns proposals, Products owns Product Variant identity and availability, and Bills of Materials owns occupancy and final candidate eligibility.
