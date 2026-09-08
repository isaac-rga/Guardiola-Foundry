import Product from '#models/product'
import { SoftDelete } from '#mixins/soft_delete'
import { compose } from '@adonisjs/core/helpers'
import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { ProductVariantStatus } from '@guardiola-foundry/shared-types'

export default class ProductVariant extends compose(BaseModel, SoftDelete) {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'public_id' })
  declare publicId: string

  @column({ columnName: 'product_id' })
  declare productId: number

  @column({
    prepare: (value: string) => value.trim(),
  })
  declare name: string

  @column()
  declare status: ProductVariantStatus

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Product, {
    foreignKey: 'productId',
  })
  declare product: BelongsTo<typeof Product>
}
