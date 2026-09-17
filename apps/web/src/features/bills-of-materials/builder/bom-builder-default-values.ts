import type { z } from 'zod'
import type {
  BillOfMaterialsDetail,
  BillOfMaterialsLine,
  ProductVariantCandidate,
} from '@guardiola-foundry/shared-types'
import { createBillOfMaterialsRequestSchema } from '@guardiola-foundry/shared-validation'

export type BomBuilderFormValues = z.input<
  typeof createBillOfMaterialsRequestSchema
>

export type BomBuilderContext =
  | { kind: 'template'; sourceBillOfMaterials?: BillOfMaterialsDetail }
  | {
      kind: 'implementation'
      productVariant: Pick<ProductVariantCandidate, 'id' | 'name' | 'product'>
      sourceTemplate?: BillOfMaterialsDetail
    }

export function resolveBomBuilderDefaultValues({
  context,
  existing,
}: {
  context: BomBuilderContext
  existing?: BillOfMaterialsDetail
}): BomBuilderFormValues {
  if (existing) {
    const lines = existing.lines.map((line) => mapLineDefaultValues(line, true))

    if (existing.kind === 'template') {
      return {
        kind: 'template',
        name: existing.name,
        description: existing.description,
        productId: existing.product?.id ?? null,
        lines,
      }
    }

    return {
      kind: 'implementation',
      name: existing.name,
      description: existing.description,
      productVariantId: existing.productVariant!.id,
      lines,
    }
  }

  if (context.kind === 'template') {
    if (!context.sourceBillOfMaterials) {
      return {
        kind: 'template',
        name: '',
        description: null,
        productId: null,
        lines: [],
      }
    }

    return {
      kind: 'template',
      name: `${context.sourceBillOfMaterials.name} — copy`,
      description: context.sourceBillOfMaterials.description,
      productId: context.sourceBillOfMaterials.product?.id ?? null,
      lines: context.sourceBillOfMaterials.lines.map((line) =>
        mapLineDefaultValues(line, false),
      ),
    }
  }

  if (!context.sourceTemplate) {
    return {
      kind: 'implementation',
      name: '',
      description: null,
      productVariantId: context.productVariant.id,
      lines: [],
    }
  }

  return {
    kind: 'implementation',
    name: '',
    description: context.sourceTemplate.description,
    productVariantId: context.productVariant.id,
    lines: context.sourceTemplate.lines.map((line) =>
      mapLineDefaultValues(line, false),
    ),
  }
}

function mapLineDefaultValues(
  line: BillOfMaterialsLine,
  preserveVerification: boolean,
) {
  return {
    constructionPiece: line.constructionPiece,
    materialId: line.materialId,
    materialQuantity: line.materialQuantity,
    patternSetId: line.patternSetId,
    lineNote: line.lineNote,
    verified: preserveVerification && line.verification.status === 'verified',
  }
}
