import MaterialSourceLink from '#models/material_source_link'
import { SoftDelete } from '#mixins/soft_delete'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import type { MaterialColor, MaterialUnit, MaterialUse } from '@guardiola-foundry/shared-types'

export default class Material extends compose(BaseModel, SoftDelete) {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'public_id' })
  declare publicId: string

  @column({ columnName: 'legacy_material_id' })
  declare legacyMaterialId: string

  @column({
    prepare: (value: string) => value.trim(),
  })
  declare name: string

  @column({ columnName: 'material_color' })
  declare materialColor: MaterialColor

  @column({ columnName: 'material_use' })
  declare materialUse: MaterialUse

  @column({ columnName: 'material_unit' })
  declare materialUnit: MaterialUnit

  @column({
    prepare: (value: string | null) => {
      if (value === null) {
        return null
      }

      const normalizedValue = value.trim()

      return normalizedValue.length > 0 ? normalizedValue : null
    },
  })
  declare comments: string | null

  @column({
    columnName: 'source_links_import_snapshot',
    serializeAs: null,
    prepare: (value) => (value === null ? null : JSON.stringify(value)),
  })
  declare sourceLinksImportSnapshot: Array<{
    legacySourceId: string
    isPreferred: boolean
    vendorShade: string | null
  }> | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => MaterialSourceLink, {
    foreignKey: 'materialId',
  })
  declare sourceLinks: HasMany<typeof MaterialSourceLink>
}
