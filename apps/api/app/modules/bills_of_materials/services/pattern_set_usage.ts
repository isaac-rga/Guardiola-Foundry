import db from '@adonisjs/lucid/services/db'
import type { PatternSetUsageImpact } from '@guardiola-foundry/shared-types'

export async function countPatternSetUsage(patternSetId: number): Promise<PatternSetUsageImpact> {
  const result = await db
    .from('bill_of_materials_lines')
    .where('pattern_set_id', patternSetId)
    .count('* as line_count')
    .countDistinct('bill_of_materials_id as bill_of_materials_count')
    .first()

  return {
    billOfMaterialsLineCount: Number(result?.line_count ?? 0),
    billOfMaterialsCount: Number(result?.bill_of_materials_count ?? 0),
  }
}
