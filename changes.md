# Create a Source From the Catalog

This slice completes Sources issue 06. Admins and Operators can now start from the authoritative Sources catalog, enter the commercial core plus any known optional details, and save a new Active Source without fabricating provenance or calculating Landed Unit Cost.

## Start With the Issue

Read [.scratch/sources/issues/06-create-source-from-catalog.md](.scratch/sources/issues/06-create-source-from-catalog.md). It defines two public seams: authenticated `POST /sources` and the `/app/sources/new` catalog workflow. The implementation and tests stay within those boundaries.

## Follow the Shared Create Contract

Open [packages/shared-types/src/sources.ts](packages/shared-types/src/sources.ts), then [packages/shared-validation/src/sources.ts](packages/shared-validation/src/sources.ts).

`CreateSourceRequest` covers:

- the required commercial core: Source Name, Vendor, Textile Family, Purchase Presentation, Purchase Unit, Minimum Purchase Quantity, Purchase Price, Price Date, and Vendor Currency;
- optional fixed-piece length and manual Landed Unit Cost;
- optional commercial and technical details;
- optional future-costing inputs;
- zero or more Vendor Shade names or codes.

The shared Zod schema trims text, normalizes blank optional text to `null`, enforces the controlled Source values, requires positive quantities, rejects negative cent amounts, validates the ISO Price Date, bounds IGI from 0 through 100, and rejects blank or duplicate Vendor Shades. The same schema protects the API boundary and drives field-level validation in the web form.

The response reuses the existing `{ source: SourceDetail }` contract. A successful create therefore returns the same complete, validated representation that the detail route reads.

## Trace the Authenticated Create Endpoint

[apps/api/start/routes.ts](apps/api/start/routes.ts) registers `POST /sources` behind the existing bearer-authentication middleware. [apps/api/app/modules/sources/controllers/sources_controller.ts](apps/api/app/modules/sources/controllers/sources_controller.ts) remains a thin HTTP boundary: it validates the body, returns field-keyed `422` errors, delegates creation, and responds with `201 Created`.

[apps/api/app/modules/sources/services/sources_service.ts](apps/api/app/modules/sources/services/sources_service.ts) owns persistence:

1. It creates the Source and any Vendor Shades in one database transaction.
2. PostgreSQL allocates the next stable `S-` public ID; the service refreshes the row to read that database-owned value.
3. App-created Sources store `legacySourceId: null`, default to Active, and normalize Landed Unit Cost to MXN per meter.
4. Optional fields remain `null` when unknown rather than receiving invented values.
5. The created record is reloaded through the existing detail serializer, so IVA, attention states, Vendor Shades, and linked-Material summaries have one authoritative representation.

There is no Currency Conversion Rate lookup in the create path. A USD Source remains valid when that later global setting is absent because this slice performs no currency conversion.

## Start Creation From the Catalog

[apps/web/src/features/sources/sources-page.tsx](apps/web/src/features/sources/sources-page.tsx) now exposes a typed **Create Source** link. [apps/web/src/routes/app.sources.new.tsx](apps/web/src/routes/app.sources.new.tsx) owns the stable `/app/sources/new` route and post-create navigation; the feature page reports the created Source ID back to that route.

[apps/web/src/features/sources/source-create-page.tsx](apps/web/src/features/sources/source-create-page.tsx) groups the workflow into four readable areas:

1. **Commercial data** captures the required core, optional fixed-piece length, manual Landed Unit Cost, Vendor SKU, and Vendor URL.
2. **Technical data** captures description, manufacturer, fiber, composition, GSM, width, finish, weave, presentation notes, origin, and comments.
3. **Future costing inputs** captures estimated shipping and IGI beside the fixed 16 percent IVA rule. The page states explicitly that these inputs do not calculate or update Landed Unit Cost.
4. **Vendor Shades** accepts one Vendor shade name or code per line.

Money inputs are displayed in normal currency units and converted to integer cents at the request boundary. The form allows Landed Unit Cost to remain blank and explains that the resulting Active Source will show `Cost needs attention`. Missing optional details may produce `Data needs attention`, but neither condition blocks creation.

## Preserve Values Through Validation

[apps/web/src/features/sources/api/endpoints.ts](apps/web/src/features/sources/api/endpoints.ts) validates outbound and inbound payloads. API field errors are retained as structured Source validation errors instead of being collapsed into one generic message.

[apps/web/src/features/sources/api/queries.ts](apps/web/src/features/sources/api/queries.ts) owns the create mutation and invalidates Source queries after success. The form maps server errors back beside the relevant controls without resetting entered values. On success, TanStack Router navigates with the returned `sourceId` path parameter to `/app/sources/$sourceId`.

## Read the Tests as Specifications

[apps/api/tests/functional/sources/create_source.spec.ts](apps/api/tests/functional/sources/create_source.spec.ts) proves:

- authenticated Admin and Operator creation;
- unauthenticated rejection;
- sequential database-owned identity and nullable legacy provenance;
- Active defaults, complete optional-field persistence, and transactional Vendor Shades;
- required-field, controlled-value, numeric-bound, and Price Date validation with no partial record on failure;
- creation without Landed Unit Cost or a Currency Conversion Rate;
- derived cost/data attention without automatic cost calculation.

[apps/web/src/routes/-source-create.test.tsx](apps/web/src/routes/-source-create.test.tsx) proves:

- the complete create route, stable post-create navigation, and both derived attention indicators;
- money-to-cents conversion, optional future inputs, and multiword Vendor Shades;
- the no-calculation explanation;
- client and server field-level validation;
- preservation of the user's entered values after validation failure.

[apps/web/src/routes/-sources.test.tsx](apps/web/src/routes/-sources.test.tsx) also protects the catalog entry point to `/app/sources/new`.

## Verification

Focused verification passed:

- Source creation API suite: 3 tests;
- Sources list, create, and detail web route suites: 11 tests;
- strict typechecks for the API, web, shared types, and shared validation packages.

The complete repository gate also passed:

- lint and strict typechecking across all four packages;
- 66 API tests and 48 web tests across 10 web test files;
- production builds for the API, web, shared types, and shared validation packages;
- whitespace validation with `git diff --check`.

Independent Standards and Spec reviews were rerun after their findings were addressed. Both finished with no remaining findings.

The globally active pnpm 11.9.0 tried to reinstall the repository-pinned pnpm 11.8.0 and then retried blocked registry downloads. Dependency links were restored from the existing local store with an offline frozen-lockfile install, and the same package lint, typecheck, test, and build commands were run directly with the installed workspace binaries. No dependency or lockfile changes are part of this slice.

## Scope Boundaries

Issue 06 does not add Source editing, lifecycle actions, Currency Conversion Rate display, Material dialogs, relationship mutations, Preferred Source replacement, or Landed Unit Cost calculation. Those remain assigned to later Sources issues.

## What Comes Next

Issue 07 is the next incomplete slice: edit Source commercial, technical, shade, future-input, and manual Landed Unit Cost data while preserving Source identity and provenance.
