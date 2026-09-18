import type {
  BillOfMaterialsCostProjection,
  BillOfMaterialsLineCostProjection,
} from '@guardiola-foundry/shared-types'
import { calculateBomCostProjection } from '@guardiola-foundry/bom-cost-projection'

interface DraftBomCostLine {
  materialId?: string | null
  materialQuantity?: number | null
}

interface DraftMaterialProjection {
  preferredSource: { landedUnitCostCents: number | null } | null
  attention: string[]
}

export function calculateDraftBomCostProjection(
  lines: DraftBomCostLine[],
  materialsById: Record<string, DraftMaterialProjection>,
): {
  lines: BillOfMaterialsLineCostProjection[]
  summary: BillOfMaterialsCostProjection
} {
  return calculateBomCostProjection(
    lines.map((line) => {
      const material = line.materialId
        ? materialsById[line.materialId]
        : undefined

      return {
        hasMaterial: Boolean(line.materialId),
        materialQuantity: line.materialQuantity ?? null,
        landedUnitCostCents:
          material?.preferredSource?.landedUnitCostCents ?? null,
        sourceUsable:
          material !== undefined &&
          !material.attention.includes('source-needs-attention') &&
          material.preferredSource?.landedUnitCostCents !== null,
      }
    }),
  )
}
