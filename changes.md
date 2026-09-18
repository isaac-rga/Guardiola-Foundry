# One Destination Seam for BOM Implementation Rules

Candidate search, manual creation, BOM Template application, rename, and restore now use one focused destination seam. This is a structural refactor. It does not change domain relationships, HTTP contracts, the database schema, or Web Application behavior.

## Advisory Search and Authoritative Reservation

The [destination seam](apps/api/app/modules/bills_of_materials/services/implementation_destination/index.ts) gives each caller a specific operation. Candidate search asks for an advisory eligibility outcome. Manual creation and BOM Template application ask the seam to reserve a destination before they write.

The [candidate search service](apps/api/app/modules/bills_of_materials/services/search_product_variant_candidates.ts) keeps the existing search, ranking, and 25-result limit. It classifies each visible Product Variant in this order:

1. `implementation-exists`
2. `product-unavailable`
3. `variant-inactive`
4. `eligible`

Search does not reserve a Product Variant. An ineligible Product Variant remains a normal search result with its current outcome.

The write service starts and owns the transaction. It passes the same Lucid transaction to destination reservation. The destination seam does not start a nested transaction.

Reservation locks the Product first and the Product Variant second. It then repeats the authoritative checks. The Product and Product Variant must be active and not deleted. A BOM Template application must select a Product Variant that belongs to the BOM Template Product. The Product Variant must not have a non-deleted BOM Implementation. The BOM Typification must be unique, without case sensitivity, across non-deleted BOM Implementations for the Product.

If a check fails, the existing typed business error leaves the transaction. The caller rolls back. No BOM Implementation or BOM Line is created. If all checks pass, the caller creates the complete result and commits once.

## Existing Implementation Rename, Restore, and Lifecycle

The [whole-BOM update service](apps/api/app/modules/bills_of_materials/services/update_bill_of_materials.ts) uses the same Product-scoped BOM Typification rule for rename. A case-insensitive duplicate name is rejected before line or metadata changes. The complete saved BOM Implementation remains unchanged.

An existing BOM Implementation remains editable when its Product or Product Variant is inactive. It becomes read-only when its Product or Product Variant is deleted. These lifecycle rules are separate from the active-record rules for a new destination.

The [restore service](apps/api/app/modules/bills_of_materials/services/delete_and_restore_bill_of_materials.ts) can restore a BOM Implementation when its related Product or Product Variant is deleted. The restored BOM Implementation then remains read-only. Restore uses the same Product-to-Product Variant lock order. It repeats Product Variant occupancy and Product-scoped, case-insensitive BOM Typification checks. Concurrent restore attempts still allow only one valid winner.

## Architecture Views

Domain relationships did not change. Therefore, this walkthrough omits a UML domain relationship view.

### C4 Level 3 — API Application

```mermaid
flowchart LR
    client["HTTP Client"]
    database[("PostgreSQL")]

    subgraph api["API Application · AdonisJS"]
        controller["BOM HTTP Controller<br/>Validates requests and maps responses"]
        search["Candidate Search<br/>Reads, matches, ranks, and limits results"]
        eligibility["Candidate Eligibility<br/>Returns advisory outcomes"]
        create["Manual Creation<br/>Transaction owner"]
        apply["BOM Template Application<br/>Transaction owner"]
        update["Whole-BOM Update<br/>Transaction owner"]
        restore["BOM Restore<br/>Transaction owner"]
        reservation["Destination Reservation<br/>Locks and repeats final checks"]
        existing["Existing Implementation Rules<br/>Checks rename, edit, and restore"]
        lucid["Lucid Persistence<br/>Queries, locks, and writes"]

        controller --> search
        controller --> create
        controller --> apply
        controller --> update
        controller --> restore
        search --> eligibility
        search --> lucid
        create --> reservation
        apply --> reservation
        update --> existing
        restore --> existing
        reservation --> lucid
        existing --> lucid
    end

    client --> controller
    lucid --> database
```

### C4 Dynamic — Advisory Search and Final Save

```mermaid
sequenceDiagram
    actor Client as HTTP Client
    participant Controller as BOM HTTP Controller
    participant Search as Candidate Search
    participant Eligibility as Candidate Eligibility
    participant Write as Create or Apply Service<br/>Transaction owner
    participant Destination as Destination Reservation
    participant DB as Lucid / PostgreSQL

    Client->>Controller: Search for a Product Variant
    Controller->>Search: Send normalized search and scope
    Search->>DB: Read Product, Product Variant, and occupancy data
    DB-->>Search: Return current matches
    Search->>Search: Rank and limit results
    Search->>Eligibility: Classify each candidate
    Eligibility-->>Search: Return advisory outcomes
    Search-->>Controller: Return candidates without reservation
    Controller-->>Client: Show current choices

    Client->>Controller: Save a manual or Template-derived BOM Implementation
    Controller->>Write: Send validated Save request
    Write->>DB: Begin transaction
    Write->>Destination: Reserve destination with the same transaction
    Destination->>DB: Lock Product
    Destination->>DB: Lock Product Variant
    Destination->>DB: Repeat availability, Product, occupancy, and typification checks

    alt Destination conflict or validation failure
        DB-->>Destination: Return current conflicting state
        Destination-->>Write: Return typed business error
        Write->>DB: Roll back transaction
        Write-->>Controller: Return existing HTTP error
        Controller-->>Client: Nothing was created
    else Destination remains valid
        Destination-->>Write: Return reserved destination
        Write->>DB: Create BOM Implementation and BOM Lines
        Write->>DB: Commit transaction
        Write-->>Controller: Return complete BOM Implementation
        Controller-->>Client: Save succeeded
    end
```

## Focused Coverage

These three behavior-characterization cases were added. Each case passed against the baseline implementation, so there was no behavioral red state.

- Manual BOM Implementation creation rejects an inactive Product and persists nothing.
- Direct BOM Template application rejects a Product Variant from another Product and persists nothing.
- Rename rejects a case-insensitive duplicate BOM Typification in the same Product and preserves the complete saved BOM Implementation.

## Focused Verification

- Focused BOM functional tests — 42 of 42 passed, including concurrency and forced rollback coverage.
- API typecheck — passed.
- Full API lint — passed.
- `git diff --check` — passed.
- Standards review — PASS with no findings.
- Spec review — PASS with no findings.

The first focused test attempt could not bind `0.0.0.0:3333` in the sandbox. The same test passed when test access was enabled. This was an environment limit, not a product failure.

The complete `pnpm quality` gate and full repository test suites did not run.

## Scope Boundaries

- Domain relationships did not change.
- HTTP contracts, database schema, and Web Application behavior did not change.
- This refactor does not add new behavior.
- Candidate search remains advisory and does not reserve a destination.
- The destination seam does not own transactions.
- Existing unrelated working-tree changes remain preserved.

## Commit State

The feature is uncommitted and ready for review.
