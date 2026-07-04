import Collection from '#models/collection'
import User from '#models/user'
import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type {
  ProductCategory,
  ProductLifecycleStatus,
  ProductStatus,
} from '@guardiola-foundry/shared-types'

export default class Product extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'public_id' })
  declare publicId: string

  @column({
    prepare: (value: string) => value.trim(),
  })
  declare name: string

  @column({
    columnName: 'short_description',
    prepare: (value: string | null) => {
      if (value === null) {
        return null
      }

      const normalizedValue = value.trim()

      return normalizedValue.length > 0 ? normalizedValue : null
    },
  })
  declare shortDescription: string | null

  @column({ columnName: 'lifecycle_status' })
  declare lifecycleStatus: ProductLifecycleStatus

  @column({ columnName: 'product_status' })
  declare productStatus: ProductStatus

  @column({ columnName: 'product_category' })
  declare productCategory: ProductCategory | null

  @column({ columnName: 'collection_id' })
  declare collectionId: number | null

  @column({ columnName: 'created_by_user_id' })
  declare createdByUserId: number

  @column({ columnName: 'product_image_file_name' })
  declare productImageFileName: string | null

  @column({ columnName: 'product_image_storage_key' })
  declare productImageStorageKey: string | null

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
