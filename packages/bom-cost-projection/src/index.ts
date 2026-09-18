import type {
  BillOfMaterialsCostProjection,
  BillOfMaterialsLineCostProjection,
} from '@guardiola-foundry/shared-types'

export interface BomCostProjectionInput {
  hasMaterial: boolean
  materialQuantity: number | null
  landedUnitCostCents: number | null
  sourceUsable: boolean
}

export function calculateBomCostProjection(lines: BomCostProjectionInput[]): {
  lines: BillOfMaterialsLineCostProjection[]
  summary: BillOfMaterialsCostProjection
} {
  const lineProjections = lines.map(calculateLineCostProjection)
  const calculableAmounts = lineProjections.flatMap((projection) =>
    projection.amountCents === null ? [] : [projection.amountCents],
  )
  const excludedLineCount = lineProjections.length - calculableAmounts.length

  return {
    lines: lineProjections,
    summary: {
      availability:
        calculableAmounts.length === 0
          ? 'unavailable'
          : excludedLineCount === 0
            ? 'complete'
            : 'partial',
      amountCents:
        calculableAmounts.length === 0
          ? null
          : calculableAmounts.reduce((total, amount) => total + amount, 0),
      excludedLineCount,
    },
  }
}

function calculateLineCostProjection(
  line: BomCostProjectionInput,
): BillOfMaterialsLineCostProjection {
  if (!line.hasMaterial) {
    return { amountCents: null, exclusionReason: 'missing-material' }
  }

  if (line.materialQuantity === null) {
    return {
      amountCents: null,
      exclusionReason: 'missing-material-quantity',
    }
  }

  if (!line.sourceUsable || line.landedUnitCostCents === null) {
    return {
      amountCents: null,
      exclusionReason: 'no-usable-landed-unit-cost',
    }
  }

  const quantityInThousandthsOfMeter = Math.round(line.materialQuantity * 1000)

  return {
    amountCents: Math.round(
      (quantityInThousandthsOfMeter * line.landedUnitCostCents) / 1000,
    ),
    exclusionReason: null,
  }
}
