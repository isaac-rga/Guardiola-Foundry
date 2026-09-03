# Display the Global Currency Conversion Rate

This slice completes Sources issue 08. Authenticated users can now see the application's single database-managed currency assumption above the Sources catalog without implying that Source prices are converted or that the setting can be edited here.

## Start With the Issue

Read [.scratch/sources/issues/08-display-global-currency-rate.md](.scratch/sources/issues/08-display-global-currency-rate.md). The implementation is limited to persisting and reading one optional global Currency Conversion Rate, then presenting it as read-only context on `/app/sources`.

## Persist One Global Assumption

[apps/api/database/migrations/1788394486000_create_currency_conversion_rates.ts](apps/api/database/migrations/1788394486000_create_currency_conversion_rates.ts) creates `currency_conversion_rates` independently from `material_sources`.

The table permits only the singleton ID `1`. Its `usd_to_mxn_rate` and `effective_date` columns are nullable so an absent row represents missing configuration and incomplete or nonpositive database-managed values can be reported as invalid instead of being displayed as trustworthy numbers.

[apps/api/app/modules/sources/models/currency_conversion_rate.ts](apps/api/app/modules/sources/models/currency_conversion_rate.ts) maps the decimal value to a number and the Effective Date to the existing Luxon date convention.

[apps/api/database/seeders/currency_conversion_rate_seeder.ts](apps/api/database/seeders/currency_conversion_rate_seeder.ts) provides the deterministic development assumption `1 USD = 17 MXN`, effective `2026-09-02`. It updates or creates singleton ID `1`, so repeated seed runs converge on the same value.

## Read Through a Dedicated Contract

[packages/shared-types/src/sources.ts](packages/shared-types/src/sources.ts) and [packages/shared-validation/src/sources.ts](packages/shared-validation/src/sources.ts) define one discriminated response contract:

- `configured` includes `usdToMxnRate`, its derived `mxnToUsdRate`, and `effectiveDate`;
- `missing` means no singleton row exists;
- `invalid` means the stored rate or Effective Date cannot be presented safely.

[apps/api/app/modules/sources/services/currency_conversion_rate_service.ts](apps/api/app/modules/sources/services/currency_conversion_rate_service.ts) reads the singleton row. It returns only a positive finite configured rate, derives `MXN:USD` as `1 / USD:MXN`, and serializes the Effective Date without changing any Source value.

[apps/api/start/routes.ts](apps/api/start/routes.ts) and [apps/api/app/modules/sources/controllers/currency_conversion_rates_controller.ts](apps/api/app/modules/sources/controllers/currency_conversion_rates_controller.ts) expose `GET /currency-conversion-rate` behind the existing bearer-authentication middleware. There is no POST, PUT, PATCH, or DELETE contract for this setting.

## Display the Rate Without Blocking Sources

[apps/web/src/features/sources/api/endpoints.ts](apps/web/src/features/sources/api/endpoints.ts) validates the dedicated response, and [apps/web/src/features/sources/api/queries.ts](apps/web/src/features/sources/api/queries.ts) keeps it in an independent TanStack Query cache entry.

[apps/web/src/features/sources/sources-page.tsx](apps/web/src/features/sources/sources-page.tsx) renders a read-only Currency Conversion Rate region above the Source filters and table:

- configured data shows `USD:MXN`, reciprocal `MXN:USD`, and the Effective Date;
- missing, invalid, or unavailable data shows informational copy instead of a numeric value;
- every state says or preserves the fact that Source prices remain unchanged and Landed Unit Cost remains manual;
- Vendor Price displays its original `USD` or `MXN` currency code in both the catalog and Source detail;
- the region contains no editing control.

Because the rate and Source catalog use separate queries, rate absence or failure does not suppress the table, Create Source link, filters, or existing edit workflows.

## Read the Tests as Specifications

[apps/api/tests/functional/sources/currency_conversion_rate.spec.ts](apps/api/tests/functional/sources/currency_conversion_rate.spec.ts) proves singleton persistence, idempotent deterministic seeding, configured serialization, exact reciprocal derivation, missing and invalid states, authenticated access, and the absence of write routes.

[apps/web/src/routes/-sources.test.tsx](apps/web/src/routes/-sources.test.tsx) proves the read-only configured display, formatted reciprocal and Effective Date, explicit Vendor Price currency, missing and invalid informational messages, and continued catalog/Create Source availability. [apps/web/src/routes/-source-detail.test.tsx](apps/web/src/routes/-source-detail.test.tsx) proves the same explicit Vendor Price currency on Source detail.

The existing focused Source creation and editing API tests continue to prove that a USD Source can be created or edited without a configured rate. The Source edit route fixture now supplies the independent missing-rate response while exercising the existing catalog-to-edit journey.

## Verification

Passed:

- focused Currency Conversion Rate API suite: 4 tests;
- focused Source create and edit API regression suites: 6 tests across 2 files;
- focused Sources and Source detail route suites: 11 tests across 2 files;
- complete API suite: 73 tests;
- complete web suite: 53 tests;
- lint for API, web, shared types, and shared validation;
- strict typechecking for API, web, shared types, and shared validation;
- builds for API, web, shared types, and shared validation;
- database seed execution with the configured `17` rate and `2026-09-02` Effective Date;
- local migration application and migration-status verification;
- whitespace validation with `git diff --check`.

The complete suites were run after implementation approval. The first full web run exposed the older Source edit journey's missing mock for the new independent rate request; adding the supported `missing` response restored that regression suite before the final 53-test web pass.

## Scope Boundaries

Issue 08 does not add Currency Conversion Rate management UI or mutation endpoints, Banxico integration, automatic conversion of Purchase Price, Landed Unit Cost calculation, Source retirement/restoration, Material relationship dialogs, link/unlink behavior, or Preferred Source replacement.

## What Comes Next

Issue 09 is the next incomplete Sources slice: open the Material relationship dialog from Source detail while preserving the later link, unlink, and Preferred Source mutation boundaries.
