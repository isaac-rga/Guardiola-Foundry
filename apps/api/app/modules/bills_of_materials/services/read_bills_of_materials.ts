import Material from '#models/material'
import MaterialSource from '#models/material_source'
import Product from '#models/product'
import BillOfMaterial from '#modules/bills_of_materials/models/bill_of_material'
import type BillOfMaterialLine from '#modules/bills_of_materials/models/bill_of_material_line'
import {
  calculateBomCostProjection,
  preferredSourceFor,
  sourceNeedsAttention,
} from '#modules/bills_of_materials/services/bom_cost_projection'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type {
  BillOfMaterialsDetail,
  BillOfMaterialsLine,
  BillOfMaterialsLineCostProjection,
  BillOfMaterialsLinePreferredSource,
  BillOfMaterialsSummary,
  ListBillsOfMaterialsResponse,
} from '@guardiola-foundry/shared-types'

export async function listBillsOfMaterials(): Promise<ListBillsOfMaterialsResponse> {
  const billsOfMaterials = await BillOfMaterial.query()
    .preload('createdBy')
    .preload('product', (productQuery) => Product.includeDeleted(productQuery))
    .orderBy('updatedAt', 'desc')

  return { billsOfMaterials: billsOfMaterials.map(serializeBillOfMaterials) }
}

export async function getBillOfMaterials(publicId: string): Promise<BillOfMaterialsDetail | null> {
  const billOfMaterials = await loadBillOfMaterials(publicId)
  return billOfMaterials ? serializeBillOfMaterialsDetail(billOfMaterials) : null
}

export async function loadBillOfMaterialsDetail(publicId: string, trx: TransactionClientContract) {
  const billOfMaterials = await loadBillOfMaterials(publicId, trx)
  if (!billOfMaterials) throw new Error(`Bill of Materials ${publicId} could not be reloaded.`)
  return serializeBillOfMaterialsDetail(billOfMaterials)
}

function serializeBillOfMaterials(billOfMaterials: BillOfMaterial): BillOfMaterialsSummary {
  return {
    id: billOfMaterials.publicId,
    kind: billOfMaterials.kind,
    name: billOfMaterials.name,
    description: billOfMaterials.description,
    product:
      billOfMaterials.productId === null
        ? null
        : {
            id: billOfMaterials.product.publicId,
            name: billOfMaterials.product.name,
            availability:
              billOfMaterials.product.deletedAt === null &&
              billOfMaterials.product.productStatus === 'active'
                ? 'available'
                : 'unavailable',
          },
    createdBy: {
      id: billOfMaterials.createdBy.id,
      email: billOfMaterials.createdBy.email,
    },
    createdAt: billOfMaterials.createdAt.toISO()!,
    updatedAt: billOfMaterials.updatedAt.toISO()!,
  }
}

function serializeBillOfMaterialsDetail(billOfMaterials: BillOfMaterial): BillOfMaterialsDetail {
  const projection = calculateBomCostProjection(billOfMaterials.lines)
  const lines = billOfMaterials.lines.map((line, index) =>
    serializeBillOfMaterialsLine(line, projection.lines[index])
  )

  return {
    ...serializeBillOfMaterials(billOfMaterials),
    lines,
    attentionCount: lines.filter((line) => line.attention.length > 0).length,
    costProjection: projection.summary,
  }
}

function serializeBillOfMaterialsLine(
  line: BillOfMaterialLine,
  costProjection: BillOfMaterialsLineCostProjection
): BillOfMaterialsLine {
  const hasValidQuantity = line.materialQuantity !== null && line.materialQuantity > 0
  const preferredLink = preferredSourceFor(line)

  return {
    id: line.publicId,
    constructionPiece: line.constructionPiece,
    material:
      line.materialId === null
        ? null
        : {
            id: line.material.publicId,
            name: line.material.name,
            preferredSource: preferredLink ? serializeLinePreferredSource(preferredLink) : null,
          },
    materialQuantity: line.materialQuantity,
    patternSet:
      line.patternSetId === null
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
    attention: [
      ...(line.materialId !== null && line.material.deletedAt !== null
        ? (['material-needs-attention'] as const)
        : []),
      ...(sourceNeedsAttention(line) ? (['source-needs-attention'] as const) : []),
      ...(line.patternSetId !== null && line.patternSet.status === 'retired'
        ? (['pattern-needs-attention'] as const)
        : []),
    ],
    costProjection,
  }
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

async function loadBillOfMaterials(publicId: string, trx?: TransactionClientContract) {
  return BillOfMaterial.query(trx ? { client: trx } : undefined)
    .where('publicId', publicId)
    .preload('createdBy')
    .preload('product', (productQuery) => Product.includeDeleted(productQuery))
    .preload('lines', (lines) => {
      lines
        .preload('material', (materialQuery) => {
          Material.includeDeleted(materialQuery)
          materialQuery.preload('sourceLinks', (sourceLinkQuery) => {
            sourceLinkQuery
              .where('isPreferred', true)
              .preload('materialSource', (materialSourceQuery) => {
                MaterialSource.includeDeleted(materialSourceQuery)
              })
              .preload('vendorShade')
          })
        })
        .preload('verifiedBy')
        .preload('patternSet', (patternSetQuery) => {
          patternSetQuery.preload('quantityProposals')
        })
        .orderBy('displayOrder', 'asc')
    })
    .first()
}
