# Inspect Source Detail and Linked Materials

This slice completes Sources issue 05. Authenticated users can open a Source from the catalog and inspect its complete record at a stable app-owned route. The detail remains an inspection surface: it explains the Source and its Material usage without introducing Source editing or relationship mutations.

## Start With the Issue

Read [.scratch/sources/issues/05-inspect-source-detail.md](.scratch/sources/issues/05-inspect-source-detail.md). It defines two public seams: authenticated `GET /sources/:sourceId` and `/app/sources/$sourceId`. The implementation and tests stay within those boundaries.

## Follow the Detail Contract

Open [packages/shared-types/src/sources.ts](packages/shared-types/src/sources.ts), then [packages/shared-validation/src/sources.ts](packages/shared-validation/src/sources.ts).

The shared Source contract now describes:

- every commercial field already owned by the Source, including stable and legacy identity, presentation, quantity, price, date, currency, and manual Landed Unit Cost;
- optional technical fields and Vendor Shades;
- the stored future-costing inputs together with the fixed 16 percent IVA rule;
- Source Status and both derived attention conditions;
- read-only linked Material summaries, including relationship role, Vendor Shade, and whether the relationship is Active or historical.

The response exposes app-owned IDs and business vocabulary. It does not expose database foreign keys, action metadata, or mutation contracts.

## Trace the Authenticated Detail Endpoint

[apps/api/start/routes.ts](apps/api/start/routes.ts) registers `GET /sources/:sourceId` behind the existing bearer-authentication middleware. [apps/api/app/modules/sources/controllers/sources_controller.ts](apps/api/app/modules/sources/controllers/sources_controller.ts) remains a thin HTTP boundary: it passes the current role to the service, returns the detail, or responds with `Source not found.`

[apps/api/app/modules/sources/services/sources_service.ts](apps/api/app/modules/sources/services/sources_service.ts) loads the Source with Vendor Shades and Material relationships in one detail query. It deliberately includes soft-deleted Materials so historical usage remains visible. Active Sources are available to Admins and Operators; the service excludes Retired Sources for Operators before serialization. A missing Source and an unauthorized Retired Source therefore produce the same 404 response and do not disclose whether the Retired record exists.

The serializer carries the fixed `IVA_PERCENTAGE` business rule from the Source catalog module and reuses the existing attention derivation. Future-costing inputs are returned as stored facts only; no calculation changes the manual Landed Unit Cost.

## Open a Source From the Catalog

In [apps/web/src/features/sources/components/sources-table.tsx](apps/web/src/features/sources/components/sources-table.tsx), each Source ID is now a typed link to `/app/sources/$sourceId`. The link passes the Source ID through TanStack Router path parameters rather than string interpolation.

The Sources route is now a small layout with an index child and a detail child:

- [apps/web/src/routes/app.sources.tsx](apps/web/src/routes/app.sources.tsx) owns the shared Sources search validation and outlet;
- [apps/web/src/routes/app.sources.index.tsx](apps/web/src/routes/app.sources.index.tsx) keeps the existing URL-synchronized catalog filters;
- [apps/web/src/routes/app.sources.$sourceId.tsx](apps/web/src/routes/app.sources.$sourceId.tsx) reads the stable Source ID and renders the detail feature.

This preserves `/app/sources` as the catalog URL while making `/app/sources/S-0001` directly refreshable and shareable.

## Walk Through the Detail Page

[apps/web/src/features/sources/api/endpoints.ts](apps/web/src/features/sources/api/endpoints.ts) fetches and validates the detail response. [apps/web/src/features/sources/api/queries.ts](apps/web/src/features/sources/api/queries.ts) owns the Source-ID-specific TanStack Query key.

[apps/web/src/features/sources/source-detail-page.tsx](apps/web/src/features/sources/source-detail-page.tsx) presents four read-only areas:

1. **Commercial data** shows Vendor, Textile Family, stable provenance, presentation, purchase terms, Vendor Price, Price Date, and manual Landed Unit Cost.
2. **Technical data** shows description, manufacturer, fiber, composition, GSM, width, finish, weave, notes, origin, comments, and Vendor Shades.
3. **Future costing inputs** explicitly says the fields do not recalculate Landed Unit Cost. Estimated shipping and IGI are displayed beside IVA as the fixed 16 percent business rule.
4. **Linked Materials** shows Material identity, color and use, Preferred or alternate relationship, selected Vendor Shade, and Active or historical relationship status. A retained link is historical when either the Source is Retired or the Material itself is historical.

The page contains no edit, link, unlink, Preferred Source, or Material-field controls. Loading is explicit, missing and permission-safe 404 responses retain a route back to the catalog, and service errors offer an in-place retry.

## Read the Tests as Specifications

[apps/api/tests/functional/sources/show_source.spec.ts](apps/api/tests/functional/sources/show_source.spec.ts) proves the full response contract, historical Material visibility, authenticated access, Admin-only Retired access, and identical missing/unauthorized responses.

[apps/web/src/routes/-sources.test.tsx](apps/web/src/routes/-sources.test.tsx) proves stable list-to-detail routing. [apps/web/src/routes/-source-detail.test.tsx](apps/web/src/routes/-source-detail.test.tsx) proves the complete read-only presentation, fixed IVA and no-calculation language, active and historical relationships, lack of mutation controls, loading, permission-safe missing state, service errors, and retry recovery.

## Verification

Focused verification passed:

- Source detail API suite: 3 tests;
- Sources list and detail web route suites: 8 tests;
- strict typechecks for the API, web, shared types, and shared validation packages.

The complete repository gate also passed:

- lint and strict typechecking across all four packages;
- 63 API tests and 45 web tests across 9 web test files;
- production builds for the API, web, shared types, and shared validation packages;
- whitespace validation with `git diff --check`;
- independent Standards and Spec reviews with no remaining findings.

The reviews caught two issues before the final gate: duplicated Material enum knowledge in the Source response schema and an Active label on a Retired Source's otherwise-active Material relationship. The schema now composes the authoritative Material schemas, and relationship history now follows both sides of the relationship. Regression coverage protects the latter case.

## Scope Boundaries

Issue 05 does not add Source creation, editing, lifecycle actions, currency-rate display, Material dialogs, relationship mutations, Preferred Source replacement, or Landed Unit Cost calculation. Those remain assigned to later Sources issues.

## What Comes Next

Issue 06 is the next incomplete slice: create a Source from the authoritative Sources catalog while preserving stable identity, validation, attention derivation, and the no-calculation boundary.
