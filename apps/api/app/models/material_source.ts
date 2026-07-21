import MaterialSourceLink from '#models/material_source_link'
import { SoftDelete } from '#mixins/soft_delete'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import type { MaterialUnit } from '@guardiola-foundry/shared-types'

export default class MaterialSource extends compose(BaseModel, SoftDelete) {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'public_id' })
  declare publicId: string

  @column({ columnName: 'legacy_source_id' })
  declare legacySourceId: string

  @column({
    prepare: (value: string) => value.trim(),
  })
  declare name: string

  @column({
    prepare: (value: string) => value.trim(),
  })
  declare provider: string

  @column({ columnName: 'textile_family' })
  declare textileFamily: string

  @column({ columnName: 'purchase_unit' })
  declare purchaseUnit: string

  @column({ columnName: 'normalized_unit_cost_cents' })
  declare normalizedUnitCostCents: number

  @column({ columnName: 'normalized_unit' })
  declare normalizedUnit: MaterialUnit

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => MaterialSourceLink, {
    foreignKey: 'materialSourceId',
  })
  declare materialLinks: HasMany<typeof MaterialSourceLink>
}
