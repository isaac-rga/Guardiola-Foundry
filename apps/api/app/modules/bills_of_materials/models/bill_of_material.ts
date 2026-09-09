import User from '#models/user'
import BillOfMaterialLine from '#modules/bills_of_materials/models/bill_of_material_line'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { BillOfMaterialsKind } from '@guardiola-foundry/shared-types'
import { DateTime } from 'luxon'

export default class BillOfMaterial extends BaseModel {
  static table = 'bills_of_materials'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'public_id' })
  declare publicId: string

  @column()
  declare kind: BillOfMaterialsKind

  @column({ prepare: (value: string) => value.trim() })
  declare name: string

  @column({ prepare: (value: string | null) => value?.trim() || null })
  declare description: string | null

  @column({ columnName: 'created_by_user_id' })
  declare createdByUserId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'createdByUserId' })
  declare createdBy: BelongsTo<typeof User>

  @hasMany(() => BillOfMaterialLine, { foreignKey: 'billOfMaterialsId' })
  declare lines: HasMany<typeof BillOfMaterialLine>
}
