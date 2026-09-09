import type {
  BillOfMaterialsCostProjection,
  BillOfMaterialsLineCostProjection,
  MaterialSearchItem,
} from '@guardiola-foundry/shared-types'
import { calculateBomCostProjection } from '@guardiola-foundry/bom-cost-projection'

interface DraftBomCostLine {
  materialId?: string | null
  materialQuantity?: number | null
}

export function calculateDraftBomCostProjection(
  lines: DraftBomCostLine[],
  materialsById: Record<string, MaterialSearchItem>,
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
          material?.preferredSource.landedUnitCostCents ?? null,
        sourceUsable:
          material !== undefined &&
          !material.attention.includes('source-needs-attention') &&
          material.preferredSource.landedUnitCostCents !== null,
      }
    }),
  )
}
