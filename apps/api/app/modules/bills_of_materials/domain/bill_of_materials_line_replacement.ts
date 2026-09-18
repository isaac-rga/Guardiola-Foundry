import type { UpdateBillOfMaterialsLineRequest } from '@guardiola-foundry/shared-types'

export interface ExistingBillOfMaterialsLineState {
  publicId: string
  constructionPiece: string
  materialId: number | null
  materialQuantity: number | null
  patternSetId: number | null
  verified: boolean
}

export interface UpdateReferenceState {
  databaseId: number
  available: boolean
}

export interface PlannedBillOfMaterialsLine {
  requested: UpdateBillOfMaterialsLineRequest
  existingPublicId: string | null
  materialDatabaseId: number | null
  patternSetDatabaseId: number | null
  preserveVerification: boolean
}

export interface BillOfMaterialsLineReplacementPlan {
  lines: PlannedBillOfMaterialsLine[]
  retainedLineIds: Set<string>
}

export function planBillOfMaterialsLineReplacement(
  requestedLines: UpdateBillOfMaterialsLineRequest[],
  existingLines: ExistingBillOfMaterialsLineState[],
  materials: Map<string, UpdateReferenceState>,
  patternSets: Map<string, UpdateReferenceState>
): BillOfMaterialsLineReplacementPlan {
  const existingByPublicId = new Map(existingLines.map((line) => [line.publicId, line]))
  const retainedLineIds = new Set<string>()

  const lines = requestedLines.map((requested, index) => {
    const existing = requested.id ? existingByPublicId.get(requested.id) : undefined
    if (requested.id && (!existing || retainedLineIds.has(requested.id))) {
      throw new BillOfMaterialsUpdateValidationError(
        `lines.${index}.id`,
        'Select a valid existing BOM Line.'
      )
    }
    if (requested.id) retainedLineIds.add(requested.id)

    // A BOM Line can keep an unavailable Material or Retired Pattern Set only if
    // it already uses that record. The Operator can then edit or remove the BOM Line.
    const material = requested.materialId ? materials.get(requested.materialId) : undefined
    if (
      requested.materialId &&
      (!material || (!material.available && existing?.materialId !== material.databaseId))
    ) {
      throw new BillOfMaterialsUpdateValidationError(
        `lines.${index}.materialId`,
        'The selected Material is no longer available.'
      )
    }

    const patternSet = requested.patternSetId ? patternSets.get(requested.patternSetId) : undefined
    if (
      requested.patternSetId &&
      (!patternSet || (!patternSet.available && existing?.patternSetId !== patternSet.databaseId))
    ) {
      throw new BillOfMaterialsUpdateValidationError(
        `lines.${index}.patternSetId`,
        'The selected Pattern Set is no longer available.'
      )
    }

    // BOM Line Verification applies to Construction Piece, Material, and Material Quantity.
    // A change to Line Note or Pattern Set does not reset it.
    const constructionFactsChanged =
      existing !== undefined &&
      (existing.constructionPiece !== requested.constructionPiece ||
        existing.materialId !== (material?.databaseId ?? null) ||
        existing.materialQuantity !== requested.materialQuantity)

    return {
      requested,
      existingPublicId: existing?.publicId ?? null,
      materialDatabaseId: material?.databaseId ?? null,
      patternSetDatabaseId: patternSet?.databaseId ?? null,
      preserveVerification:
        requested.verified && existing?.verified === true && !constructionFactsChanged,
    }
  })

  return { lines, retainedLineIds }
}

export class BillOfMaterialsUpdateValidationError extends Error {
  constructor(
    readonly field: string,
    message: string
  ) {
    super(message)
  }
}
