import User from '#models/user'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
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
}
