# Delete and Restore Product Variants Safely

Issue 02 adds a recoverable Product Variant lifecycle without weakening the permanent Product ownership established in issue 01. Admins and Operators can remove a Variant from ordinary work after a specific confirmation, while only Admins can inspect deleted Variant records and restore them.

The reviewed issue checklist is marked `done`. This implementation remains deliberately inside the existing Product Variant slice; it does not add BOM behavior, new-work catalog search, or a new persistence abstraction.

## Lifecycle API

Two bearer-protected Product-scoped routes extend the existing Variant API:

| Route | Behavior | Authorization and constraints |
| --- | --- | --- |
| `DELETE /products/:productId/variants/:variantId` | Soft-deletes the addressed non-deleted Variant and returns `204`. | Admins and Operators may delete. The nested Product scope prevents addressing a Variant through another Product. |
| `POST /products/:productId/variants/:variantId/restore` | Restores the deleted Variant and returns the recovered record. | Admin only. Restoration returns `422` when a non-deleted Variant under the same Product has taken the case-insensitive name. |

`GET /products/:productId/variants` remains the ordinary list and excludes deleted records. An Admin may request `?includeDeleted=true` to inspect both current and deleted Variants. The same query from an Operator still returns only ordinary records, so a caller cannot bypass the Product-route role boundary by constructing the URL directly.

The shared Product Variant response now carries a nullable deletion timestamp. That timestamp gives the Product route an explicit recovery-state signal while leaving identity, Product ID, commercial name, Active/Inactive status, and creation time intact.

## Safe Restoration

Restoration resolves both the Product and Variant through their stable IDs, includes soft-deleted rows explicitly, and keeps the original internal Product foreign key unchanged. It never accepts replacement ownership or replacement name data.

The service locks the Product and deleted Variant inside a transaction before checking the name. This coordinates restoration with the Product-locked Variant creation path. The existing partial unique index remains the final concurrency safeguard: only non-deleted Variant names participate, and any database race is translated into the same actionable name conflict.

An unavailable parent Product does not erase or reassign a deleted Variant. The Admin recovery list can still inspect it, and the same restoration name constraint applies while the Product is Inactive or deleted. Restoration changes only the deletion timestamp; the preserved Variant status and ownership remain untouched.

## Product Detail Experience

The Product Variants card adds lifecycle actions without changing the existing create/edit dialog:

- Every non-deleted row has a Delete action for Admins and Operators.
- Delete opens a confirmation that names both the Product Variant and its Product before any request is sent.
- After deletion, the ordinary list refreshes and the Variant disappears from normal work.
- Admins receive an `Include deleted` control that loads preserved records from Product context.
- Deleted rows are visibly marked `Deleted`, cannot be edited, and expose Restore only to Admins.
- A successful restore refreshes the Product-specific Variant lists and returns the row to its preserved Active/Inactive state.
- A restoration name conflict leaves the deleted row intact and displays the API's corrective message.

The server-state hook keeps ordinary and include-deleted lists in separate query keys. Delete and restore invalidate only the current Product's Variant query family, so both projections refresh without affecting unrelated Product data.

## Focused Coverage

The API tests cover:

- Operator deletion and ordinary-list exclusion;
- direct-query protection that prevents Operators from including complete deleted records;
- Admin inspection of preserved identity, name, status, ownership, and deletion state;
- Admin-only restoration and preserved Product ownership;
- case-insensitive restoration conflicts with neither record overwritten;
- preservation and conflict enforcement while the parent Product is Inactive;
- bearer authentication on both lifecycle routes.

The Product-route tests cover:

- confirmation text identifying the Variant and Product before deletion;
- deletion from the ordinary view;
- Admin include-deleted inspection and successful restoration;
- absence of history and recovery controls for Operators;
- an actionable restoration conflict that leaves the deleted row visible.

## Focused Verification

- Nine focused API tests pass across the Product Variant and protected-route files.
- Six focused Product-route tests pass.
- Lint passes for API, web, shared-types, and shared-validation.
- Strict TypeScript checks pass for API, web, shared-types, and shared-validation.
- Shared types and validation were rebuilt before the API checks.
- `git diff --check` passes.
- The implementation was checked against current AdonisJS v7 route/controller guidance and TanStack Query mutation-cache guidance.

The focused web test retains the existing React/Radix `act(...)` warnings around the issue-01 status Select interaction; all assertions pass. Complete test suites and `pnpm quality` were not run, per the requested review boundary. The reviewed implementation is ready to commit.
