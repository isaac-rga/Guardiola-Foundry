import Material from '#models/material'
import MaterialSource from '#models/material_source'
import VendorShade from '#modules/sources/models/vendor_shade'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class MaterialSourceLink extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'material_id' })
  declare materialId: number

  @column({ columnName: 'material_source_id' })
  declare materialSourceId: number

  @column({ columnName: 'sort_order' })
  declare sortOrder: number

  @column({ columnName: 'is_preferred' })
  declare isPreferred: boolean

  @column({ columnName: 'vendor_shade_id' })
  declare vendorShadeId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Material, {
    foreignKey: 'materialId',
  })
  declare material: BelongsTo<typeof Material>

  @belongsTo(() => MaterialSource, {
    foreignKey: 'materialSourceId',
  })
  declare materialSource: BelongsTo<typeof MaterialSource>

  @belongsTo(() => VendorShade, {
    foreignKey: 'vendorShadeId',
  })
  declare vendorShade: BelongsTo<typeof VendorShade>
}
