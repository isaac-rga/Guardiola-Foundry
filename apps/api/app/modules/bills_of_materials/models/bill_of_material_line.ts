import Material from '#models/material'
import User from '#models/user'
import BillOfMaterial from '#modules/bills_of_materials/models/bill_of_material'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class BillOfMaterialLine extends BaseModel {
  static table = 'bill_of_materials_lines'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'public_id' })
  declare publicId: string

  @column({ columnName: 'bill_of_materials_id' })
  declare billOfMaterialsId: number

  @column({ columnName: 'construction_piece', prepare: (value: string) => value.trim() })
  declare constructionPiece: string

  @column({ columnName: 'material_id' })
  declare materialId: number | null

  @column({
    columnName: 'material_quantity',
    consume: (value: string | null) => (value === null ? null : Number(value)),
  })
  declare materialQuantity: number | null

  @column({ columnName: 'line_note', prepare: (value: string | null) => value?.trim() || null })
  declare lineNote: string | null

  @column({ columnName: 'display_order' })
  declare displayOrder: number

  @column({ columnName: 'verified_by_user_id' })
  declare verifiedByUserId: number | null

  @column.dateTime({ columnName: 'verified_at' })
  declare verifiedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => BillOfMaterial, { foreignKey: 'billOfMaterialsId' })
  declare billOfMaterials: BelongsTo<typeof BillOfMaterial>

  @belongsTo(() => Material, { foreignKey: 'materialId' })
  declare material: BelongsTo<typeof Material>

  @belongsTo(() => User, { foreignKey: 'verifiedByUserId' })
  declare verifiedBy: BelongsTo<typeof User>
}
