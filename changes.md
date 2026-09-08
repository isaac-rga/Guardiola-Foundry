# Register and Maintain Product Variants

Issue 01 establishes Product Variants as first-class, Product-owned records. A Variant represents a commercially named, constructively distinct realization of a Product. It is not a historical Product revision and it does not yet create a Bill of Materials, a BOM Implementation, or a commercial specification.

This slice gives the team a stable Variant identity and a maintenance workflow now, while leaving the later BOM work a clean reference point. The live issue checklist is marked `implemented — awaiting review`.

## Domain and Persistence Model

The new `product_variants` table stores:

- an internal numeric primary key;
- a stable public identity in the form `PV-XXXXXX`;
- the owning Product foreign key;
- the commercial Variant name;
- an independent `active` or `inactive` status;
- creation, update, and soft-deletion timestamps.

Product ownership is permanent. The foreign key uses `RESTRICT`, and neither the API contract nor the update path accepts a `productId`, so a Variant cannot be moved between Products. The Product model exposes the corresponding one-to-many relationship for later domain work.

New Variants default to Active and do not require a BOM Implementation or specification. Changing a Variant to Inactive only changes its availability: its public identity, name, Product ownership, and timestamps remain intact.

Names are trimmed and limited to 255 characters before they reach persistence. A partial database index enforces case-insensitive uniqueness for every non-deleted Active or Inactive Variant under the same Product. This means `Showroom` and `showroom` conflict within one Product, while another Product may legitimately use the same name. Soft-deleted rows are deliberately excluded from that index in preparation for the separately scoped deletion/restoration issue.

## Shared Contracts

The cross-application contracts live in Product Variant domain files in `shared-types` and `shared-validation`. They define:

- the stable response shape used for a Variant;
- the list response returned from Product context;
- the create request, which accepts only the commercial name;
- the update request, which accepts the name and independent Variant status;
- the shared status vocabulary and maximum name length.

The Zod schemas are used at both boundaries: the API validates incoming requests, while the web client validates form input and parses API responses. This keeps trimming, required-name behavior, length limits, and status values consistent across both applications.

## Protected Product Routes

Three bearer-protected nested routes keep Product ownership explicit:

| Route | Behavior | Important constraints |
| --- | --- | --- |
| `GET /products/:productId/variants` | Lists the Product's non-deleted Variants in creation order. | Returns `404` when the Product identity does not exist. Deleted Variants stay out of ordinary results. |
| `POST /products/:productId/variants` | Registers an Active Variant using its name as the only Variant-specific prerequisite. | The Product must be Active and non-deleted. Duplicate names return a field-level correction. |
| `PUT /products/:productId/variants/:variantId` | Renames a Variant and changes its Active/Inactive status. | The nested Product scope prevents cross-Product access, and Product reassignment is not part of the payload. |

The routes sit inside the existing bearer-authenticated group, so both Admins and Operators use the same established session boundary. The protected-route characterization test now includes all three endpoints and confirms that requests without a bearer token retain the generic `401 Unauthorized` behavior.

## Availability, Ownership, and Concurrency

Variant creation checks Product availability independently from Product Lifecycle Status. An Active Product may receive a Variant whether it is in Concept, Testing, Finished, or any other lifecycle stage. An Inactive or soft-deleted Product cannot receive one.

The availability check and insert run in one database transaction. Creation locks the Product row before evaluating its status, which prevents a concurrent Product inactivation or deletion from slipping between the check and the Variant insert.

Name uniqueness is protected twice:

1. The service performs a friendly preflight check so ordinary conflicts return an actionable `name` error.
2. The partial unique index remains the source of truth under concurrent requests; a database conflict is translated back into the same field-level response.

Updates resolve the Variant through both its stable public ID and the owning Product's internal ID. Attempting to address a Variant through another Product returns `404` and leaves the original record unchanged. Updates remain allowed while a Product is Inactive so existing Variant records can still be maintained, but a soft-deleted Product cannot be changed through this workflow.

## Product Detail Experience

The active Product detail page now includes a Product Variants card below the existing Product information. The card loads through a feature-local React Query hook and presents four pieces of information: Variant name, Active/Inactive status, stable public ID, and an Edit action.

The empty state explains when a Variant should be added instead of presenting an unexplained blank table. Successful creates and edits update the Product-specific query cache immediately, so the user sees the saved Variant without reloading the page.

The create dialog asks only for the commercial Variant name and explains that the new record starts Active. The edit dialog reuses the same name field and adds the Variant status control. Neither workflow exposes Product ownership, BOM state, or speculative configuration.

When the Product is Inactive, the card still shows and permits maintenance of existing Variants, but the Add action is disabled and an inline message explains that the Product must be activated first. This separates Product availability from the independent status of its existing Variants.

Client-side validation catches blank and overlong names before a request is sent. Server-side duplicate-name or Product-availability failures keep the dialog open, retain the entered name and status, and display the API's corrective message. Loading, empty, failed-load, saving, and success states are all represented without introducing a new global state or notification system.

## Files and Responsibilities

- The migration and Lucid model own storage, stable identity, relationships, and soft-delete-aware querying.
- `product_variants_service.ts` owns Product scoping, availability, uniqueness, transactional creation, serialization, and ID generation.
- `product_variants_controller.ts` owns request validation and HTTP status/error mapping.
- Shared Product Variant files own the cross-boundary types, constants, and Zod schemas.
- The web endpoint adapters own transport and response parsing.
- The feature-local Product Variant hook owns server state, cache updates, and mutations.
- `product-variants-card.tsx` receives clean data and actions and owns only the focused maintenance interface.

## Focused Test Coverage

The API coverage exercises the behavior through HTTP and the database:

- registration with whitespace normalization and default Active status;
- stable `PV-…` identity and persisted Product ownership;
- ordinary listing with soft-deleted Variants excluded;
- rename and Active-to-Inactive status changes without identity loss;
- rejection of cross-Product Variant addressing;
- case-insensitive conflicts on create and update;
- reuse of the same name under another Product;
- rejection of creation under Inactive and soft-deleted Products regardless of Lifecycle Status;
- rejection of names beyond the database's 255-character capacity;
- bearer authentication for every new route.

The Product-route coverage exercises the user workflow:

- loading and displaying an existing Variant;
- creating a new Variant and updating the visible cache;
- renaming it and changing its status to Inactive;
- preserving a typed name after an API availability failure;
- preserving an overlong name while displaying the local length correction;
- confirming that invalid input does not send a create request.

## Focused Verification

- Six focused API tests pass across the Product Variant and protected-route files.
- Three focused Product-route tests pass.
- API and web lint pass for the touched files.
- API, web, shared-types, and shared-validation strict TypeScript checks pass.
- Shared types and validation were rebuilt so the API and web consume the new domain exports.
- The Product Variant migration was applied locally and migration status reports it completed.
- `git diff --check` passes.
- The implementation was checked against the current AdonisJS v7 routing/validation, Lucid relationship/migration, and React Hook Form error-preservation guidance.
- Independent standards and specification reviews found no remaining actionable issues after the concurrency, validation, shared-contract organization, and frontend server-state findings were corrected.

The focused web test still emits React `act(...)` warnings around the existing Radix Select interaction, but all assertions pass. The complete test suites and the human/CI-owned `pnpm quality` gate were not run, as requested. All implementation and documentation changes remain uncommitted for review.
