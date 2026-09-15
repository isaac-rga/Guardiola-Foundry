import type Material from '#models/material'
import type BillOfMaterialLine from '#modules/bills_of_materials/models/bill_of_material_line'
import {
  preferredSourceFor,
  sourceNeedsAttention,
} from '#modules/bills_of_materials/services/bom_cost_projection'
import type {
  BillOfMaterialsLine,
  BillOfMaterialsLineAttention,
  BillOfMaterialsLineCostProjection,
  BillOfMaterialsLinePreferredSource,
} from '@guardiola-foundry/shared-types'

export interface BillOfMaterialsLineReferenceIds {
  material: Map<number, string>
  patternSet: Map<number, string>
}

export function serializeBillOfMaterialsLine(
  line: BillOfMaterialLine,
  costProjection: BillOfMaterialsLineCostProjection,
  referenceIds: BillOfMaterialsLineReferenceIds
): BillOfMaterialsLine {
  const hasValidQuantity = line.materialQuantity !== null && line.materialQuantity > 0
  const preferredLink = preferredSourceFor(line)

  return {
    id: line.publicId,
    constructionPiece: line.constructionPiece,
    materialId:
      line.materialId === null ? null : (referenceIds.material.get(line.materialId) ?? null),
    material:
      line.materialId === null || !line.material
        ? null
        : {
            id: line.material.publicId,
            name: line.material.name,
            preferredSource: preferredLink ? serializeLinePreferredSource(preferredLink) : null,
          },
    materialQuantity: line.materialQuantity,
    patternSetId:
      line.patternSetId === null ? null : (referenceIds.patternSet.get(line.patternSetId) ?? null),
    patternSet:
      line.patternSetId === null || !line.patternSet
        ? null
        : {
            id: line.patternSet.publicId,
            name: line.patternSet.name,
            status: line.patternSet.status,
            quantityProposalCount: line.patternSet.quantityProposals.length,
          },
    lineNote: line.lineNote,
    order: line.displayOrder,
    completeness:
      line.constructionPiece.length > 0 && line.materialId !== null && hasValidQuantity
        ? 'complete'
        : 'incomplete',
    verification:
      line.verifiedAt === null
        ? { status: 'unverified', verifiedBy: null, verifiedAt: null }
        : {
            status: 'verified',
            verifiedBy: { id: line.verifiedBy.id, email: line.verifiedBy.email },
            verifiedAt: line.verifiedAt.toISO()!,
          },
    attention: resolveBillOfMaterialsLineAttention(line),
    costProjection,
  }
}

export function resolveBillOfMaterialsLineAttention(
  line: BillOfMaterialLine
): BillOfMaterialsLineAttention[] {
  return [
    ...(line.material?.deletedAt ? (['material-needs-attention'] as const) : []),
    ...(sourceNeedsAttention(line) ? (['source-needs-attention'] as const) : []),
    ...(line.patternSet?.status === 'retired' ? (['pattern-needs-attention'] as const) : []),
  ]
}

function serializeLinePreferredSource(
  preferredLink: Material['sourceLinks'][number]
): BillOfMaterialsLinePreferredSource {
  const source = preferredLink.materialSource

  return {
    id: source.publicId,
    name: source.name,
    vendor: source.vendor,
    vendorShadeOrDetail: preferredLink.vendorShade?.nameOrCode ?? source.description,
    widthCentimeters: source.widthCentimeters,
    landedUnitCostCents: source.landedUnitCostCents,
  }
}
