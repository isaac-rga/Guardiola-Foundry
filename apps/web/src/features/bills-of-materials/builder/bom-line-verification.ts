interface BillOfMaterialsLineDraft {
  constructionPiece?: string | null
  materialId?: string | null
  materialQuantity?: number | null
  lineNote?: string | null
  verified?: boolean
}

export function isCompleteBillOfMaterialsLine(line: BillOfMaterialsLineDraft) {
  return Boolean(
    line.constructionPiece?.trim() &&
    line.materialId &&
    line.materialQuantity !== null &&
    line.materialQuantity !== undefined &&
    line.materialQuantity > 0 &&
    Math.abs(
      line.materialQuantity * 1000 - Math.round(line.materialQuantity * 1000),
    ) < 1e-8,
  )
}

export function resolveBillOfMaterialsLineVerification(
  line: BillOfMaterialsLineDraft,
  change: BillOfMaterialsLineDraft,
) {
  const nextLine = { ...line, ...change }

  if (change.verified !== undefined) {
    return change.verified && isCompleteBillOfMaterialsLine(nextLine)
  }

  const reviewedFactChanged =
    ('constructionPiece' in change &&
      normalizeConstructionPiece(change.constructionPiece) !==
        normalizeConstructionPiece(line.constructionPiece)) ||
    ('materialId' in change && change.materialId !== line.materialId) ||
    ('materialQuantity' in change &&
      change.materialQuantity !== line.materialQuantity)

  return reviewedFactChanged ? false : line.verified === true
}

function normalizeConstructionPiece(value: string | null | undefined) {
  return value?.trim() ?? ''
}
