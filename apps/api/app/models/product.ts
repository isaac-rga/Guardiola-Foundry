import Collection from '#models/collection'
import User from '#models/user'
import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { ProductLifecycleStatus, ProductStatus } from '@guardiola-foundry/shared-types'

export default class Product extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'public_id' })
  declare publicId: string

  @column({
    prepare: (value: string) => value.trim(),
  })
  declare name: string

  @column({ columnName: 'lifecycle_status' })
  declare lifecycleStatus: ProductLifecycleStatus

  @column({ columnName: 'product_status' })
  declare productStatus: ProductStatus

  @column({ columnName: 'collection_id' })
  declare collectionId: number | null

  @column({ columnName: 'created_by_user_id' })
  declare createdByUserId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Collection, {
    foreignKey: 'collectionId',
  })
  declare collection: BelongsTo<typeof Collection>

  @belongsTo(() => User, {
    foreignKey: 'createdByUserId',
  })
  declare createdBy: BelongsTo<typeof User>
}
