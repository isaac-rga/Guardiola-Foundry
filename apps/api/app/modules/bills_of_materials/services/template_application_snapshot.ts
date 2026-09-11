export interface BillOfMaterialsCopySourceLine {
  constructionPiece: string
  materialId: number | null
  materialQuantity: number | null
  patternSetId: number | null
  lineNote: string | null
  displayOrder: number
}

export function deriveBillOfMaterialsCopySnapshot(source: {
  description: string | null
  lines: readonly BillOfMaterialsCopySourceLine[]
}) {
  return {
    description: source.description,
    lines: source.lines.map((line) => ({
      constructionPiece: line.constructionPiece,
      materialId: line.materialId,
      materialQuantity: line.materialQuantity,
      patternSetId: line.patternSetId,
      lineNote: line.lineNote,
      displayOrder: line.displayOrder,
      verifiedByUserId: null,
      verifiedAt: null,
    })),
  }
}

export const deriveTemplateApplicationSnapshot = deriveBillOfMaterialsCopySnapshot
