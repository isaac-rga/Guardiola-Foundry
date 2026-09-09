import type BillOfMaterialLine from '#modules/bills_of_materials/models/bill_of_material_line'
import { calculateBomCostProjection as calculateProjection } from '@guardiola-foundry/bom-cost-projection'

export function calculateBomCostProjection(lines: BillOfMaterialLine[]) {
  return calculateProjection(
    lines.map((line) => {
      const preferredSource = preferredSourceFor(line)?.materialSource

      return {
        hasMaterial: line.materialId !== null,
        materialQuantity: line.materialQuantity,
        landedUnitCostCents: preferredSource?.landedUnitCostCents ?? null,
        sourceUsable: isPreferredSourceUsable(preferredSource),
      }
    })
  )
}

export function preferredSourceFor(line: BillOfMaterialLine) {
  return line.materialId === null
    ? undefined
    : line.material.sourceLinks.find((sourceLink) => sourceLink.isPreferred)
}

export function sourceNeedsAttention(line: BillOfMaterialLine) {
  return (
    line.materialId !== null && !isPreferredSourceUsable(preferredSourceFor(line)?.materialSource)
  )
}

function isPreferredSourceUsable(
  source: BillOfMaterialLine['material']['sourceLinks'][number]['materialSource'] | undefined
) {
  return (
    source !== undefined &&
    source.deletedAt === null &&
    source.sourceStatus === 'active' &&
    source.landedUnitCostCents !== null
  )
}
