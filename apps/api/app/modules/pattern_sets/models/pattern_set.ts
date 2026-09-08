import PatternSetQuantityProposal from '#modules/pattern_sets/models/pattern_set_quantity_proposal'
import User from '#models/user'
import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { PatternSetStatus } from '@guardiola-foundry/shared-types'

export default class PatternSet extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'public_id' })
  declare publicId: string

  @column({ prepare: (value: string) => value.trim() })
  declare name: string

  @column({
    prepare: (value: string | null) => value?.trim() || null,
  })
  declare description: string | null

  @column()
  declare status: PatternSetStatus

  @column({ columnName: 'created_by_user_id' })
  declare createdByUserId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'createdByUserId' })
  declare createdBy: BelongsTo<typeof User>

  @hasMany(() => PatternSetQuantityProposal, { foreignKey: 'patternSetId' })
  declare quantityProposals: HasMany<typeof PatternSetQuantityProposal>
}
