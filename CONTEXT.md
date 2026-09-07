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
The User who initially registers a Product or creates a Bill of Materials. Created By is immutable after creation and is distinct from any future change-history authorship.
_Avoid_: Owner, Last Editor

**Created At**:
The timestamp when a Product or Bill of Materials is initially created. Created At is immutable and is displayed as read-only metadata.
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
A vendor-specific offering used to purchase a Material or Supply. A Source captures one stable commercial and technical specification; differences in vendor SKU, purchase presentation, price basis, or relevant technical specification identify separate Sources, while one Source may offer multiple Vendor Shades that supply separate single-color Materials.
_Avoid_: Sourcing, Material, Supply, Vendor

**Source ID**:
The app-owned stable sequential identifier used to route and operate on a Source, currently using the `S-0001` convention independently of spreadsheet order. It is distinct from optional legacy spreadsheet provenance; the prefix may be revisited if Source later separates into Material Source and Supply Source concepts.
_Avoid_: Legacy Source ID, Vendor SKU, Material ID

**Vendor**:
The organization that offers a Source for purchase. Vendor is distinct from the Source offering itself, even while Vendor identity is recorded by name rather than managed as a separate catalog.
_Avoid_: Source, Provider, Manufacturer

**Source Status**:
The purchasing availability of a Source, limited to `Active` or `Retired`. A Retired Source is unavailable for new purchasing decisions but remains part of historical Material relationships and may be restored.
_Avoid_: Deleted Source, Source Lifecycle

**Unlinked Source**:
An otherwise valid Source that is not currently linked to a Material. Unlinked describes the Source's relationship state, not its completeness or Source Status.
_Avoid_: Draft Source, Inactive Source

**Vendor Shade**:
A vendor-defined color name or code offered by a Source. A Source may offer multiple Vendor Shades, and each Material–Source relationship may identify the applicable Vendor Shade when the Vendor provides one.
_Avoid_: Material Color, Source Color, Color Variant

**Purchase Presentation**:
The physical form in which a Source is purchased, such as a Roll or Piece. A fixed piece length is recorded separately when the presentation has one.
_Avoid_: Purchase Unit, Minimum Purchase Quantity, Package Size

**Purchase Unit**:
The unit in which a Vendor prices and sells a Source, currently Meter or Yard. It is distinct from the Source's Purchase Presentation and the Material's normalized Meter unit.
_Avoid_: Material Unit, Purchase Presentation

**Minimum Purchase Quantity**:
The smallest quantity of a Source that the Vendor permits in one purchase, measured in the Source's Purchase Unit. It is distinct from a fixed piece length or the quantity eventually ordered.
_Avoid_: Piece Length, Order Quantity, Purchase Presentation

**Vendor Currency**:
The USD or MXN currency in which a Vendor quotes a Source's purchase price. Vendor Currency is preserved even when the Source is converted to a common cost basis.
_Avoid_: Base Currency, Display Currency

**Currency Conversion Rate**:
The single global `USD:MXN` rate used as the application's common currency-conversion assumption; the reciprocal provides the `MXN:USD` rate. It has an Effective Date and is shared across Sources rather than owned by an individual Source.
_Avoid_: Source Exchange Rate, Vendor Rate

**Landed Unit Cost**:
The MXN cost per meter of acquiring a Source after applicable shipping, import duties, and taxes. It is distinct from the Vendor purchase price and provides the Material cost basis through the Preferred Source.
_Avoid_: Purchase Price, Vendor Price, Material Cost

**Cost needs attention**:
The condition of an Active Source whose Landed Unit Cost is not yet recorded. The Source remains a valid catalog record but cannot become a Preferred Source until the cost is supplied.
_Avoid_: Draft Source, Invalid Source, Unknown Vendor Price

**Data needs attention**:
The non-blocking condition of a Source with missing optional catalog information. It signals that the Source can be enriched without making the record invalid or preventing Material relationships.
_Avoid_: Invalid Source, Draft Source, Cost needs attention

**Textile Family**:
The controlled textile classification for a Source, such as tulle, mesh, crepe, satin, organza, or interfacing. Textile Family belongs to the Source rather than the Material.
_Avoid_: Material Use, Source Subcategory, Material Category

**Preferred Source**:
The one linked Active Source with a recorded Landed Unit Cost selected as the default purchasing and cost basis for an Active Material. Selecting a new Preferred Source makes the former one an alternate; an Active Material always has exactly one Preferred Source.
_Avoid_: Primary Vendor, Default Supplier

**Inventory**:
The current on-hand stock position for Material. Inventory is tracked as physical positions in the warehouse.
_Avoid_: Stock, Availability

**Warehouse Position**:
A physical location in the warehouse where Inventory for a Material is held. A Warehouse Position describes where stock is, not what Product it belongs to.
_Avoid_: Bin, Slot, Shelf

**Bill of Materials**:
A named, independently identified, ordered definition of inputs and construction context used to build a Product. A Bill of Materials has a permanent kind—BOM Template or BOM Implementation—and belongs to Product structure rather than Inventory.
_Avoid_: Recipe, Formula, BOM Sheet

**BOM Template**:
A reusable Bill of Materials configuration that may be associated permanently with one Product, while each Product may have at most one non-deleted associated BOM Template. It may be created independently or by copying another Bill of Materials; the copy preserves its origin but evolves independently.
_Avoid_: BOM Configuration, Shared Product Template

**BOM Implementation**:
A concrete Bill of Materials that belongs permanently to one Product Variant and is identified by a BOM Typification distinct from the Variant's commercial name. It may be saved progressively before its BOM Lines are resolved, and a Product Variant may have at most one non-deleted BOM Implementation.
_Avoid_: BOM Instance, Implemented Template

**BOM Typification**:
The user-assigned construction-oriented name of a BOM Implementation, such as Jackie - Blush - Chapel Train. It is distinct from the current commercial name of its Product Variant and is unique among that Product's non-deleted BOM Implementations.
_Avoid_: Product Variant Name, SKU, Automatic Typification

**BOM Origin**:
The immediate Bill of Materials from which another Bill of Materials was copied. A BOM Origin is optional, singular, remains fixed after creation, and preserves the derivation chain even when an origin is soft-deleted.
_Avoid_: Live Parent BOM, Inherited BOM, BOM History

**BOM Derivation**:
The one-time creation of a new Bill of Materials from the current state of an existing one. It records an informational immediate BOM Origin while the result receives its own identity and otherwise behaves and evolves independently.
_Avoid_: Untracked Duplicate, BOM Inheritance, BOM Synchronization

**BOM Line**:
An independently identified, ordered construction occurrence within a Bill of Materials. It requires a Construction Piece, may select zero or one Material, and may repeat the same Material or Construction Piece in other BOM Lines; Template and Implementation lines share this model while their selected values serve configuration and concrete-resolution purposes respectively.
_Avoid_: BOM Lane, Material Use

**Construction Piece**:
The part or placement in a Product's construction to which a BOM Line applies, such as an outer skirt or a corset side reinforcement. It belongs to the BOM Line and is distinct from the catalog-level Material Use.
_Avoid_: Construction Context, Material Use, BOM Group

**Material Quantity**:
The positive meter quantity recorded for the Material selected by a BOM Line, with precision up to one millimeter. It cannot exist without a selected Material and is cleared when that Material changes; it is a configured suggestion in a BOM Template and the concrete decided quantity in a BOM Implementation.
_Avoid_: Purchase Quantity, Pattern Set Proposal

**BOM Cost Projection**:
The current estimated MXN cost of a BOM Line or Bill of Materials, derived from its Material Quantity and the Landed Unit Cost available through the Material's current or retained Preferred Source relationship. It is neither stored by the Bill of Materials nor historical evidence, so it may change when current sourcing information changes.
_Avoid_: BOM Cost, Historical Cost, Quoted Cost, Purchase Cost

**BOM Cost Projection Availability**:
The derived classification of a Bill of Materials cost projection as `Complete` when every line is calculable, `Partial` when only some lines are calculable, or `Unavailable` when none are. It is not persisted as Bill of Materials state; a future materialized projection may cache it without becoming its source of truth.
_Avoid_: BOM Status, Cost Approval, Persisted Projection Status

**Material needs attention**:
The non-blocking condition of a BOM Line whose selected Material is no longer available in the active Material catalog. The line retains the reference as existing construction information, may remain Complete and Verified, and may still contribute to the BOM Cost Projection without making the Material available for new selection.
_Avoid_: Incomplete BOM Line, Invalid Material, Source needs attention

**Source needs attention**:
The non-blocking condition of a BOM Line whose selected Material has no usable current or retained Preferred Source relationship with Landed Unit Cost. The line retains its Material, quantity, completeness, and verification while its BOM Cost Projection remains unavailable until the sourcing condition is corrected.
_Avoid_: Cost needs attention, Material needs attention, Incomplete BOM Line

**Line Note**:
Optional construction guidance or context owned by a BOM Line. It is copied when deriving a Bill of Materials and may then evolve independently.
_Avoid_: BOM Description, Change History

**BOM Line Completeness**:
The derived condition indicating whether a BOM Line has its required Construction Piece, selected Material, and valid Material Quantity. An Incomplete line may be saved and is distinct from whether an Operator has verified its correctness.
_Avoid_: Verification Status, Resolved Line

**BOM Line Verification**:
The manual indication, with current Operator and timestamp, that an Operator has reviewed one Complete BOM Line; it applies independently to Template and Implementation lines and never blocks their use. Changing its Construction Piece, Material, or Material Quantity resets verification, and copied lines begin Unverified, while Pattern Set, notes, order, and Bill of Materials metadata do not affect verification; no aggregate BOM verification exists.
_Avoid_: BOM Verification, BOM Approval, BOM Line Completeness

**Pattern Set**:
An independently identified, globally reusable reference with a unique name that represents a configuration of one or more construction patterns. A BOM Line may optionally retain one Pattern Set and its current catalog information without making it belong to a Product, Construction Piece, or Material; the line stores no proposal or proposal history.
_Avoid_: Product Pattern, Material Pattern, Final Material Quantity, Automatic Meter Calculation

**Pattern Set Quantity Proposal**:
A live catalog suggestion pairing a positive assumed Material width in centimeters with a positive meter quantity within a Pattern Set. Each Pattern Set has at most one proposal per width, may have none, and presents its proposals by ascending width without associating them with a Material or Source.
_Avoid_: Calculated Quantity, Final Material Quantity, Material-specific Proposal, Source-specific Proposal

**Pattern Set Status**:
The business availability of a Pattern Set, limited to `Active` or `Retired`. A Retired Pattern Set remains usable by BOM Lines that already reference it and is copied during BOM Derivation, but it is unavailable for new manual selections until restored and is not deleted.
_Avoid_: Deleted Pattern Set, Archived Pattern, Pattern Lifecycle

**Pattern needs attention**:
The non-blocking condition of a BOM Line whose selected Pattern Set is Retired. It is shown only on that line, does not affect completeness or verification, and clears when the Pattern Set is restored, removed, or replaced.
_Avoid_: Incomplete BOM Line, Pattern Error, BOM Status

**Product Variant**:
A commercially named, constructively distinct realization that belongs permanently to one Product, such as Jackie Showroom. Its name is unique among that Product's non-deleted Variants; it may exist without a BOM Implementation and is not a historical revision.
_Avoid_: Product Version, Product Revision, SKU

**Product Variant Status**:
The independent availability state of a Product Variant, limited to `Active` or `Inactive` and defaulting to `Active`. An Inactive Variant retains its BOM Implementation but cannot receive one, while an unavailable parent Product also makes the Variant unavailable for new BOM work.
_Avoid_: Product Status, Lifecycle Status, Draft Variant
