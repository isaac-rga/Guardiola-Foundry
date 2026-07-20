# Guardiola Foundry

Core business concepts for the system, captured here so the language stays stable as features are added.

## Language

**User**:
A person who can sign in to the system with credentials. A User may gain one or more roles later, but role assignment is not part of the term itself.
_Avoid_: Account, Member, Actor

**Admin**:
A User role that can create and manage other Users. Admin is an authorization role, not a separate identity type.
_Avoid_: Superuser, Owner

**Operator**:
A User role for authenticated system use without user-management authority. Operator is an authorization role, not a separate identity type.
_Avoid_: Staff, Agent

**Email Address**:
The User identifier used for sign-in. Email Address matching is case-insensitive, and the stored value is normalized for uniqueness and lookup.
_Avoid_: Username, Login

**Active User**:
A User who is allowed to authenticate and use the system. Inactive Users remain as records but cannot sign in.
_Avoid_: Enabled Account, Deleted User

**Password Change**:
An authenticated action where a User replaces their password by presenting their current password and a new password.
_Avoid_: Password Reset, Recovery

**Password Recovery**:
A separate flow for a User who cannot authenticate because they no longer know their password. Password Recovery is distinct from an authenticated Password Change.
_Avoid_: Password Change, Login Help

**Product**:
A bridal design record that moves through the product-development lifecycle from concept to finished manufacturing readiness. A Product is distinct from the Materials consumed to produce it and from any later sellable SKU.
_Avoid_: Item, SKU

**Collection**:
An annual design grouping assigned to a Product as a controlled tag. A Product may exist without a Collection in the initial module scope, and Collections are significant business groupings that are not created casually during ordinary product editing.
_Avoid_: Season Label, Freeform Tag

**Product Category**:
The broad classification of a Product as `Dress`, `Accessory`, or `Other`. Product Category may be left empty during initial product registration and completed later during editing; `Other` is an intentional classification and is distinct from having no category assigned.
_Avoid_: Type, Kind

**Product Image**:
The primary reference image associated with a Product. Product Image is optional and limited to a single image in the initial module scope.
_Avoid_: Gallery, Asset Set

**Product Name**:
The primary human-readable name of a Product. Product Name is required for registration, may repeat across Products, and should warn the user about duplicates rather than blocking creation or editing. Duplicate-name warnings are case-insensitive and ignore soft-deleted Products.
_Avoid_: SKU Name, Unique Code

**Product ID**:
The short system-generated identifier used to route and operate on a Product record. Product ID is stable, read-only to users, and distinct from the editable Product Name.
_Avoid_: Slug, Product Name

**Created By**:
The User who initially registers a Product. Created By is immutable after registration and is distinct from any future change-history authorship.
_Avoid_: Owner, Last Editor

**Created At**:
The timestamp when a Product is initially registered in the system. Created At is immutable after registration and is displayed as read-only metadata.
_Avoid_: Published At, Last Updated

**Lifecycle Status**:
The current stage of a Product within bridal design and manufacturing preparation. Lifecycle Status is one of `Concept`, `Fabric & Trim Selection`, `Design & Prototyping`, `Testing`, `Approved`, `On Documentation`, or `Finished`; it defaults to `Concept` for new Products and can be changed freely by the user during creation or later editing in the initial module scope.
_Avoid_: Progress, Phase Flag

**Product Status**:
The availability state of a Product record for ordinary use in the system. Product Status is limited to `Active` or `Inactive`, defaults to `Active` for new Products, and is distinct from Lifecycle Status.
_Avoid_: Progress, Phase

**Material**:
A stable textile input that can be referenced by a Bill of Materials. A Material may have one or more Sources that provide it, and is distinct from Product, Supply, Tool, and the vendor-specific Source used to purchase it. Materials are not generally interchangeable with each other because color tonality, flow dynamics, textile weight, and similar properties matter.
_Avoid_: Ingredient, Supply, Tool, Source, Item

**Material ID**:
The app-owned public identifier used to route and operate on a Material record. Material ID currently uses an `M-` prefix and is distinct from any legacy spreadsheet ID preserved during import.
_Avoid_: Spreadsheet ID, Source ID, Material Name

**Material Use**:
The controlled role a Material serves in product construction or design, such as base fabric, structure, or lace. Material Use belongs to the Material rather than the Source.
_Avoid_: Usage, Category, Source Subcategory

**Material Color**:
The single controlled canonical color assigned to a Material. Material Color is part of Material identity because changing color can materially change the Product outcome in a Bill of Materials.
_Avoid_: Source Color, Vendor Color

**Material Unit**:
The normalized internal unit used for Material quantities in Bills of Materials and Inventory. Material Unit is fixed to Meter for Materials, even when a Source is purchased in yards, rolls, or another vendor unit.
_Avoid_: Purchase Unit, Vendor Unit

**Supply**:
A non-textile production input that may be referenced by a Bill of Materials, such as boning, thread, zippers, buttons, cups, trims, or similar consumables. Supply is distinct from Material because its units, purchasing process, and inventory handling differ from textiles.
_Avoid_: Material, Tool, Source, Item

**Source**:
A vendor-specific offering used to purchase a Material or Supply. A Source captures purchasing, financial, vendor, and technical information for an offering, and is distinct from the Material or Supply it can provide. Multiple Sources may provide the same Material, and one Source may provide multiple Material Colors when the financial and technical specifications are otherwise the same. Material Sources and Supply Sources may diverge later if their fields or workflows become meaningfully different.
_Avoid_: Sourcing, Material, Supply, Vendor

**Textile Family**:
The controlled textile classification for a Source, such as tulle, mesh, crepe, satin, organza, or interfacing. Textile Family belongs to the Source rather than the Material.
_Avoid_: Material Use, Source Subcategory, Material Category

**Preferred Source**:
The Source selected as the default purchasing and cost basis for a Material. A Material can have alternate Sources, but its Preferred Source provides the cost shown and used for that Material unless changed. Material cost is derived from the Preferred Source rather than copied onto the Material.
_Avoid_: Primary Vendor, Default Supplier

**Inventory**:
The current on-hand stock position for Material. Inventory is tracked as physical positions in the warehouse.
_Avoid_: Stock, Availability

**Warehouse Position**:
A physical location in the warehouse where Inventory for a Material is held. A Warehouse Position describes where stock is, not what Product it belongs to.
_Avoid_: Bin, Slot, Shelf

**Bill of Materials**:
One input definition for building a Product. A Product may have multiple Bills of Materials, and each Bill of Materials belongs to Product structure rather than Inventory.
_Avoid_: Recipe, Formula, BOM Sheet
