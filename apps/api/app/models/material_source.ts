import MaterialSourceLink from '#models/material_source_link'
import VendorShade from '#modules/sources/models/vendor_shade'
import { SoftDelete } from '#mixins/soft_delete'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import type {
  MaterialUnit,
  PurchasePresentation,
  PurchaseUnit,
  SourceStatus,
  TextileFamily,
  VendorCurrency,
} from '@guardiola-foundry/shared-types'

export default class MaterialSource extends compose(BaseModel, SoftDelete) {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'public_id' })
  declare publicId: string

  @column({ columnName: 'legacy_source_id' })
  declare legacySourceId: string | null

  @column({
    prepare: (value: string) => value.trim(),
  })
  declare name: string

  @column({
    prepare: (value: string) => value.trim(),
  })
  declare vendor: string

  @column({ columnName: 'textile_family' })
  declare textileFamily: TextileFamily

  @column({ columnName: 'purchase_unit' })
  declare purchaseUnit: PurchaseUnit

  @column({ columnName: 'purchase_presentation' })
  declare purchasePresentation: PurchasePresentation | null

  @column({
    columnName: 'fixed_piece_length',
    consume: (value: string | null) => (value === null ? null : Number(value)),
  })
  declare fixedPieceLength: number | null

  @column({
    columnName: 'minimum_purchase_quantity',
    consume: (value: string | null) => (value === null ? null : Number(value)),
  })
  declare minimumPurchaseQuantity: number | null

  @column({ columnName: 'purchase_price_cents' })
  declare purchasePriceCents: number | null

  @column.date({ columnName: 'price_date' })
  declare priceDate: DateTime | null

  @column({ columnName: 'vendor_currency' })
  declare vendorCurrency: VendorCurrency | null

  @column({ columnName: 'landed_unit_cost_cents' })
  declare landedUnitCostCents: number | null

  @column({ columnName: 'source_status' })
  declare sourceStatus: SourceStatus

  @column({ columnName: 'normalized_unit' })
  declare normalizedUnit: MaterialUnit

  @column({ columnName: 'vendor_sku' })
  declare vendorSku: string | null

  @column()
  declare url: string | null

  @column()
  declare description: string | null

  @column()
  declare manufacturer: string | null

  @column()
  declare fiber: string | null

  @column()
  declare composition: string | null

  @column({
    columnName: 'gsm_grams_per_square_meter',
    consume: (value: string | null) => (value === null ? null : Number(value)),
  })
  declare gsmGramsPerSquareMeter: number | null

  @column({
    columnName: 'width_centimeters',
    consume: (value: string | null) => (value === null ? null : Number(value)),
  })
  declare widthCentimeters: number | null

  @column()
  declare finish: string | null

  @column()
  declare weave: string | null

  @column({ columnName: 'presentation_notes' })
  declare presentationNotes: string | null

  @column({ columnName: 'country_of_origin' })
  declare countryOfOrigin: string | null

  @column()
  declare comments: string | null

  @column({ columnName: 'estimated_shipping_usd_per_kilogram_cents' })
  declare estimatedShippingUsdPerKilogramCents: number | null

  @column({
    columnName: 'igi_percentage',
    consume: (value: string | null) => (value === null ? null : Number(value)),
  })
  declare igiPercentage: number | null

  @column({
    columnName: 'source_import_snapshot',
    serializeAs: null,
    prepare: (value) => (value === null ? null : JSON.stringify(value)),
  })
  declare sourceImportSnapshot: Record<string, unknown> | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => MaterialSourceLink, {
    foreignKey: 'materialSourceId',
  })
  declare materialLinks: HasMany<typeof MaterialSourceLink>

  @hasMany(() => VendorShade, {
    foreignKey: 'materialSourceId',
  })
  declare vendorShades: HasMany<typeof VendorShade>
}
