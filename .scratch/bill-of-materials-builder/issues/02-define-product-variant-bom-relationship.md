# Define the relationship between Product Variants and Bills of Materials

Type: grilling
Status: resolved
Blocked by: 01

## Question

What are the ownership, cardinality, and existence rules among Product, Product Variant, BOM Template, and BOM Implementation, including whether draft Product Variants or BOM Implementations may exist before their counterpart is complete?

## Answer

- A Product may have zero or many Product Variants. Each Product Variant belongs permanently to exactly one Product and cannot exist independently or be moved to another Product.
- A Product Variant may be created for any Active Product without requiring a particular Product Lifecycle Status. An Inactive Product cannot receive new Product Variants.
- A Product Variant may have zero or one non-deleted BOM Implementation. Each BOM Implementation belongs permanently to exactly one Product Variant and cannot be reassigned. After the previous Implementation is soft-deleted, a new manual or Template-derived Implementation may be created while the deleted record is preserved.
- Once a BOM Template is associated with a Product, that Product association is permanent. An unassociated BOM Template may be associated once.
- A Product Variant may be created for an Active Product with its commercial name as the only Variant-specific prerequisite. It may exist without a BOM Implementation or commercial specification, without introducing a separate Draft state.
- A BOM Implementation may be saved progressively once it has its Product Variant and required BOM Typification, including with no BOM Lines or with unresolved lines. Saveability does not establish production readiness.
- Inactivating or soft-deleting a Product preserves its Product Variants and Bills of Materials without changing their relationships or cascading deletion. While the Product is not Active, it cannot receive new Product Variants, new BOM Template associations, or new BOM Implementations for its Variants.
- A BOM Template permanently associated with a Product remains associated if that Product becomes Inactive or is soft-deleted. It cannot be applied until the Product is Active again.
- A Product Variant has its own Active or Inactive availability state, defaults to Active, and retains its BOM Implementation when made Inactive. An Inactive Variant cannot receive a BOM Implementation, and an unavailable parent Product overrides an Active Variant.
- Product Variant names are case-insensitively unique within their Product and may repeat across different Products.
- Because a Product Variant has at most one BOM Implementation, it does not need a separate primary or default BOM relationship.
- BOM Typification is case-insensitively unique among non-deleted BOM Implementations within the same Product and may repeat across different Products. A deleted Implementation does not reserve its typification.
- Restoring a deleted BOM Implementation is blocked when its Product Variant already has another non-deleted Implementation or its typification conflicts with another non-deleted Implementation in the same Product.
- Applying a BOM Template to a Product Variant that already has a BOM Implementation is blocked rather than overwriting, merging, or changing its origin. After deleting the prior Implementation, the user may apply a Template to create a new one.
- A Product may have zero or one associated BOM Template. Because only one is allowed, the relationship does not require a separate primary or default designation; any number of unassociated BOM Templates may still exist.
- Only a non-deleted BOM Template occupies a Product's single associated-Template slot. After deleting the associated Template, another may be associated; restoring the former Template is blocked while its Product has a replacement.
- Product Variant name uniqueness includes Active and Inactive Variants but excludes deleted Variants. Restoring a deleted Variant is blocked when another non-deleted Variant in the same Product has taken its name.
