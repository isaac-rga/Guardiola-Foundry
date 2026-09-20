# Products Keep a Required Product Variant Through Delete and Restore

Product Variant deletion and Product restoration now preserve the required Product Variant rule under normal and concurrent use. The change protects the last non-deleted Product Variant, recovers an exceptional empty Product during restoration, and keeps Product soft deletion and Bill of Materials behavior unchanged.

## Protected Product Variant Deletion

The [Product Variant service](apps/api/app/modules/products/product_variants_service.ts) starts a database transaction before direct deletion. It locks the owning Product first. This lock also applies when the Product is soft-deleted. The service then locks and evaluates the current set of non-deleted Product Variants.

The service rejects deletion when the target is the last non-deleted Product Variant. The [Product Variant controller](apps/api/app/modules/products/controllers/product_variants_controller.ts) returns HTTP `422` with an instruction to create another Product Variant. The Product lock serializes Product Variant creation, restoration, and deletion. Concurrent deletion attempts can delete only one of two remaining Product Variants.

The [Product Variants card](apps/web/src/features/products/components/product-variants-card.tsx) keeps the last Product Variant's Delete action visible. The action is disabled, and the card explains that the user must create another Product Variant first. After the user creates a replacement, the existing confirmation and deletion flow becomes available. A successful deletion refreshes Product Variant and Product Variant candidate caches.

## Atomic Product Restoration

The [Product service](apps/api/app/modules/products/products_service.ts) restores a Product in one database transaction. It locks the Product, then checks for and locks one current non-deleted Product Variant. If the Product is empty, the service creates one Active Product Variant named `Base`. If the Product already has a non-deleted Product Variant, the service changes no Product Variant.

The Product restoration and optional `Base` creation commit together. If the `Base` insert fails, the transaction rolls back and the Product remains deleted. A successful restoration refreshes Product detail, Product list, Product Variant, and Product Variant candidate caches.

Product soft deletion still preserves Product Variants, Bills of Materials, and their relationships. The existing read-only rules for Bills of Materials remain in force when a related Product or Product Variant is soft-deleted.

## Architecture Views

### UML — Domain Relationships

```mermaid
classDiagram
    class Product {
        ProductID
        ProductStatus
        deletedAt
    }

    class ProductVariant {
        ProductVariantID
        name
        ProductVariantStatus
        deletedAt
    }

    Product "1" *-- "0..*" ProductVariant : owns

    note for Product "Application invariant: Every non-deleted Product owns at least one non-deleted Product Variant."
    note for ProductVariant "Base is an initial, normal, renamable name. Direct deletion cannot remove the last non-deleted Product Variant."
```

### C4 Level 3 — Product Variant Lifecycle

```mermaid
flowchart LR
    user["Admin or Operator"]
    database[("PostgreSQL")]

    subgraph web["Web Application · React"]
        productPage["Product Page<br/>Shows Product state<br/>Starts Product restoration"]
        variantsCard["Product Variants Card<br/>Shows Product Variants<br/>Guards the last Delete action"]
    end

    subgraph api["API Application · AdonisJS"]
        productsController["Products Controller<br/>Enforces restoration permission<br/>Maps HTTP responses"]
        variantsController["Product Variants Controller<br/>Maps deletion results<br/>Returns 422 for the last Variant"]
        productsService["Product Service<br/>Owns atomic Product restoration"]
        variantsService["Product Variant Service<br/>Owns guarded deletion<br/>Creates recovery Base"]
    end

    user --> productPage
    user --> variantsCard
    productPage -->|"Restore Product and refresh related caches"| productsController
    variantsCard -->|"Delete Product Variant and refresh related caches"| variantsController
    productsController --> productsService
    variantsController --> variantsService
    productsService --> variantsService
    productsService --> database
    variantsService --> database
```

### C4 Dynamic — Guarded Product Variant Deletion

```mermaid
sequenceDiagram
    actor User
    box Web Application
        participant Card as Product Variants Card
    end
    box API Application
        participant Controller as Product Variants Controller
        participant Service as Product Variant Service
    end
    participant DB as PostgreSQL

    User->>Card: Select Delete for a deletable Product Variant
    Card->>Controller: DELETE Product Variant
    Controller->>Service: Request direct soft deletion
    Service->>DB: Begin transaction
    Service->>DB: Lock owning Product
    Service->>DB: Lock current non-deleted Product Variant set

    alt Target is the last non-deleted Product Variant
        Service->>DB: Complete transaction without changes
        Service-->>Controller: Return last-variant result
        Controller-->>Card: Return HTTP 422 and explanation
    else Another non-deleted Product Variant remains
        Service->>DB: Soft-delete target Product Variant
        Service->>DB: Commit transaction
        Service-->>Controller: Return deleted result
        Controller-->>Card: Return HTTP 204
        Card->>Card: Refresh Product Variant and candidate caches
    end
```

### C4 Dynamic — Atomic Product Restoration

```mermaid
sequenceDiagram
    actor Admin
    box Web Application
        participant Page as Product Page
    end
    box API Application
        participant Controller as Products Controller
        participant Products as Product Service
        participant Variants as Product Variant Service
    end
    participant DB as PostgreSQL

    Admin->>Page: Select Restore Product
    Page->>Controller: POST Product restoration
    Controller->>Controller: Confirm Admin permission
    Controller->>Products: Restore Product
    Products->>DB: Begin transaction
    Products->>DB: Lock soft-deleted Product
    Products->>DB: Check for and lock one non-deleted Product Variant

    alt A non-deleted Product Variant exists
        Products->>DB: Restore Product and set Product Status to Inactive
    else Product has no non-deleted Product Variant
        Products->>Variants: Create Active Base Product Variant
        Variants->>DB: Insert Product Variant in the transaction
        Products->>DB: Restore Product and set Product Status to Inactive
    end

    alt Any write fails
        Products->>DB: Roll back transaction
        Products-->>Controller: Return failure
        Controller-->>Page: Show restoration failure
    else All writes succeed
        Products->>DB: Commit transaction
        Products-->>Controller: Return restored result
        Controller-->>Page: Return HTTP 204
        Page->>Page: Refresh Product, Product Variant, and candidate caches
    end
```

## Focused Coverage

The focused tests prove these behaviors:

- A Product Variant can be soft-deleted when another non-deleted Product Variant remains.
- Direct deletion returns HTTP `422` when the target is the last non-deleted Product Variant.
- Last-Variant protection also applies when the Product is soft-deleted.
- Concurrent deletion attempts leave one non-deleted Product Variant.
- An Operator can use ordinary Product Variant deletion, and only an Admin can restore a Product.
- The Product Variant route keeps the last Delete action visible, disabled, and explained.
- The route enables the ordinary confirmation and deletion flow after a replacement exists.
- Restoring an exceptional empty Product creates one Active `Base` Product Variant.
- Restoring a Product with retained Product Variants changes none of them.
- A failure after the recovery `Base` insert leaves the Product deleted and leaves no partial Product Variant.
- Product restoration refreshes Product Variant and Product Variant candidate caches.
- Product and Product Variant soft deletion keep related Bills of Materials preserved and read-only.

## Focused Verification

- API Product/Product Variant — 26/26 passed.
- BOM lifecycle — 9/9 passed.
- Product Variant route + Product cache — 10/10 passed.
- API TypeScript — passed.
- Web TypeScript + route generation — passed.
- Focused API ESLint — passed.
- Focused web Oxlint — passed.
- `git diff --check` — passed.

## Scope Boundaries

- `Base` remains a normal, renamable Product Variant name. It has no permanent role or protected name.
- The required Product Variant rule is application-enforced. It is not a database constraint.
- This change adds no hard deletion and no cascade deletion.
- Product soft deletion still preserves Product Variants, Bills of Materials, and their relationships.
- Bill of Materials read-only and restoration rules are unchanged.
- Product availability actions are unchanged.
- The complete `pnpm quality` gate did not run.
- Existing unrelated working-tree changes remain preserved.

## Commit State

The feature is uncommitted and has not been pushed.
