import MaterialSource from '#models/material_source'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class VendorShade extends BaseModel {
  static table = 'material_source_vendor_shades'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'material_source_id' })
  declare materialSourceId: number

  @column({
    columnName: 'name_or_code',
    prepare: (value: string) => value.trim(),
  })
  declare nameOrCode: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => MaterialSource, {
    foreignKey: 'materialSourceId',
  })
  declare materialSource: BelongsTo<typeof MaterialSource>
}
