import PatternSet from '#modules/pattern_sets/models/pattern_set'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class PatternSetQuantityProposal extends BaseModel {
  public static table = 'pattern_set_quantity_proposals'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'pattern_set_id' })
  declare patternSetId: number

  @column({ columnName: 'assumed_width_cm' })
  declare assumedWidthCm: number

  @column({ columnName: 'quantity_meters' })
  declare quantityMeters: number

  @column({ columnName: 'evidence_note', prepare: (value: string | null) => value?.trim() || null })
  declare evidenceNote: string | null

  @belongsTo(() => PatternSet, { foreignKey: 'patternSetId' })
  declare patternSet: BelongsTo<typeof PatternSet>
}
