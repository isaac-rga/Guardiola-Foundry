# Safe Source Retirement and Restoration

This slice completes Sources issue 12. Admins and Operators can retire unavailable offerings without deleting sourcing history or invalidating an Active Material's Preferred Source. Admins can restore a Retired Source without silently reinstating an old purchasing choice.

## Start With the Issue

Read [.scratch/sources/issues/12-retire-and-restore-sources.md](.scratch/sources/issues/12-retire-and-restore-sources.md). The implementation is limited to Source lifecycle behavior. Import protection remains issue 13; Material-field lifecycle and broader purchasing workflows remain outside this slice.

## Use the Existing Source Detail Workflow

[apps/web/src/features/sources/source-detail-page.tsx](apps/web/src/features/sources/source-detail-page.tsx) adds lifecycle actions to the existing detail page. Retiring an Active Source opens a confirmation Dialog and lists every linked Active Material. Historical Materials remain visible in the underlying relationship table but are excluded from current retirement impact.

If any affected Active Material uses the Source as Preferred, the Dialog identifies it and explains that an eligible replacement is required. A server-side conflict caused by newer relationship data keeps the Dialog open and replaces the impact list with the server's current affected Materials. Unlinked and alternate Sources can be confirmed for retirement.

Admins viewing a Retired Source can restore it in place. Existing Admin editing remains available. Operators return to the Active catalog after a successful retirement because Retired detail remains intentionally hidden from them.

## Keep Server State at the Sources Boundary

[apps/web/src/features/sources/api/endpoints.ts](apps/web/src/features/sources/api/endpoints.ts) owns the retirement and restoration transports and parses structured Preferred-retirement conflicts. [apps/web/src/features/sources/api/queries.ts](apps/web/src/features/sources/api/queries.ts) replaces committed Source detail and invalidates Source and Material queries so catalog membership, relationship status, active alternate counts, and eligibility refetch together.

## Enforce Lifecycle Rules Transactionally

[apps/api/app/modules/sources/services/sources_service.ts](apps/api/app/modules/sources/services/sources_service.ts) implements retirement and restoration as managed transactions:

- retirement locks the Active Source, loads Preferred relationships for Active Materials only, and blocks with every affected Material when replacements are still required;
- allowed retirement changes only Source Status, preserving all Material links and Preferred flags as historical context;
- restoration changes only Source Status back to Active, preserving links without promoting any alternate relationship;
- restored Sources immediately return to Active link choices, while the existing Landed Unit Cost rule continues to determine Preferred eligibility.

The existing Material link and Preferred-replacement operations now lock their selected Source row before checking status. That synchronization prevents a concurrent link or promotion from racing a retirement and leaving an Active Material pointed at a Retired Preferred Source.

[apps/api/app/modules/sources/controllers/sources_controller.ts](apps/api/app/modules/sources/controllers/sources_controller.ts) exposes business-language lifecycle responses through authenticated `DELETE /sources/:sourceId` and `POST /sources/:sourceId/restore`. Restoration rejects Operators before touching lifecycle state. Preferred-retirement conflicts return both guidance and the affected Material IDs and names defined in the shared Source contract.

## Read the Focused Tests as Specifications

[apps/api/tests/functional/sources/retire_restore_source.spec.ts](apps/api/tests/functional/sources/retire_restore_source.spec.ts) covers unauthenticated rejection, both retirement roles, Unlinked and alternate retirement, historical Preferred usage, preserved relationships, active selection exclusions, Preferred blocking with every affected Active Material, exact-one-Preferred protection, Admin-only restoration, no automatic promotion, cost-based eligibility, immediate link availability, and failure states.

[apps/web/src/routes/-source-detail.test.tsx](apps/web/src/routes/-source-detail.test.tsx) covers confirmation, Active Material impact, known Preferred blocking, current server conflict details, Operator navigation, and Admin restoration in the existing Source detail route.

## Verification

Passed with Node 24:

- focused Source lifecycle API suite: 6 tests;
- focused Material relationship API suite: 11 tests;
- focused Source detail API suite: 3 tests;
- focused Source list API suite: 5 tests;
- focused Source detail route web suite: 7 tests;
- lint for API, web, shared types, and shared validation;
- strict typechecking for API, web, shared types, and shared validation;
- shared contract builds required by runtime package resolution;
- whitespace validation with `git diff --check`.

The complete API suite and repository quality gate were not run, per the review boundary. One early web command unintentionally expanded to all web test files during the red phase; that failing red-phase run is not completion evidence, and subsequent web verification used only the focused Source detail route file. A clean complete web suite remains pending approval. The implementation remains uncommitted.

## Scope Boundaries

Issue 12 does not add Source deletion, Material-field editing, automatic Preferred replacement, new Source links from Source detail, importer overwrite protection, Source availability beyond Active/Retired, or a broader authentication refactor.

## What Comes Next

Issue 13 can protect user-managed Source fields, lifecycle status, Landed Unit Cost, links, and Preferred choices from later catalog imports.
