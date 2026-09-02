# Edit Source Data and Vendor Shades

This slice completes Sources issue 07. Admins and Operators can now correct an existing Source's commercial, technical, future-costing, manual Landed Unit Cost, and Vendor Shade data without changing application identity or import provenance.

## Start With the Issue

Read [.scratch/sources/issues/07-edit-source-and-vendor-shades.md](.scratch/sources/issues/07-edit-source-and-vendor-shades.md). The implementation is limited to authenticated Source editing through `PUT /sources/:sourceId` and `/app/sources/$sourceId/edit`.

## Follow the Shared Update Contract

[packages/shared-types/src/sources.ts](packages/shared-types/src/sources.ts) and [packages/shared-validation/src/sources.ts](packages/shared-validation/src/sources.ts) reuse the existing complete Source write contract for editing.

The contract includes the required commercial core plus optional technical data, manual Landed Unit Cost, future-costing inputs, and Vendor Shade names or codes. It does not include Source ID, legacy Source ID, Source Status, Normalized Unit, or Material relationships, so those values cannot be changed through editing.

The same Zod rules used during creation trim text, normalize blank optional fields to `null`, enforce controlled values, require positive quantities, reject negative cent amounts, validate ISO Price Date, bound IGI from 0 through 100, and reject blank or duplicate Vendor Shades.

## Trace the Authenticated Update

[apps/api/start/routes.ts](apps/api/start/routes.ts) registers `PUT /sources/:sourceId` behind the existing bearer-authentication middleware. [apps/api/app/modules/sources/controllers/sources_controller.ts](apps/api/app/modules/sources/controllers/sources_controller.ts) validates the request, returns field-keyed `422` errors, applies the same role-aware visibility as Source detail, and delegates the update.

[apps/api/app/modules/sources/services/sources_service.ts](apps/api/app/modules/sources/services/sources_service.ts) saves the Source and reconciles Vendor Shades in one database transaction:

1. Existing shade names remain unchanged and keep their stable row IDs.
2. A changed shade name reuses an unmatched existing shade when possible, preserving linked Material context.
3. New shade names create new rows.
4. Removed shades are deleted. If a Material relationship referenced a removed shade, only that optional shade reference is cleared; the Material-Source relationship remains intact.

The service never merges public ID, legacy provenance, status, normalized unit, or relationship data. It reloads the updated Source through the existing detail serializer, so attention states and linked-Material context come from one authoritative path.

## Edit From Source Detail

[apps/web/src/features/sources/source-detail-page.tsx](apps/web/src/features/sources/source-detail-page.tsx) now links to the typed `/app/sources/$sourceId/edit` route. [apps/web/src/features/sources/source-edit-page.tsx](apps/web/src/features/sources/source-edit-page.tsx) loads the same role-aware Source detail and then uses the established Source form.

[apps/web/src/features/sources/source-create-page.tsx](apps/web/src/features/sources/source-create-page.tsx) now supports both create and edit modes without duplicating field definitions. Edit mode initializes the form from the Source detail, displays Source ID and legacy Source ID as read-only metadata, preserves user input when the server returns field errors, and shows a confirmation after a successful save.

Create and edit now present Commercial data, Technical data, Future costing inputs, and Vendor Shades as separate sibling cards matching the Source detail view. Commercial and Technical data share a two-column row on wide screens and stack on narrower screens; the remaining cards stay full width.

The form continues to state that future-costing inputs do not calculate or update Landed Unit Cost. A USD Source can be edited without consulting or requiring the later global Currency Conversion Rate setting.

## Refresh Detail and Catalog Data

[apps/web/src/features/sources/api/endpoints.ts](apps/web/src/features/sources/api/endpoints.ts) validates update requests and responses and retains field-level server errors. [apps/web/src/features/sources/api/queries.ts](apps/web/src/features/sources/api/queries.ts) replaces the cached detail with the successful update response and invalidates Source list queries so returning to the catalog reloads current names, prices, costs, and attention states.

## Read the Tests as Specifications

[apps/api/tests/functional/sources/update_source.spec.ts](apps/api/tests/functional/sources/update_source.spec.ts) proves both-role editing, immutable identity and provenance, complete field persistence, Vendor Shade rename/add/remove behavior, safe removal of a referenced shade, attention-state changes, no automatic Landed Unit Cost calculation, field-level validation, authentication, and permission-safe not-found behavior.

[apps/web/src/routes/-source-edit.test.tsx](apps/web/src/routes/-source-edit.test.tsx) proves read-only identity display, form initialization, Source and Vendor Shade editing, money conversion, successful detail replacement, catalog refresh, attention display, field-level server errors, and preservation of unsaved values. Existing create, detail, and catalog route tests protect the shared form and navigation seams.

## Verification

Passed:

- focused Source editing API suite: 3 tests;
- focused Sources edit, detail, create, and catalog web route suites: 13 tests across 4 files;
- workspace lint across API, web, shared types, and shared validation;
- workspace strict typechecking across API, web, shared types, and shared validation;
- complete API suite: 69 tests;
- complete web suite: 50 tests across 11 files;
- production builds for the API, web, shared types, and shared validation packages;
- whitespace validation with `git diff --check`.

## Scope Boundaries

Issue 07 does not add Source retirement or restoration, global Currency Conversion Rate display or editing, Material relationship dialogs, Source link/unlink behavior, Preferred Source replacement, automatic Landed Unit Cost calculation, or Vendor Shade lifecycle state. Those remain assigned to later Sources issues.

## What Comes Next

Issue 08 is the next incomplete slice: display the database-managed global Currency Conversion Rate and Effective Date above the Sources catalog without using it to calculate Landed Unit Cost.
