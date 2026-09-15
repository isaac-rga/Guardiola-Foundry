import Material from '#models/material'
import MaterialSource from '#models/material_source'
import Product from '#models/product'
import ProductVariant from '#models/product_variant'
import BillOfMaterial from '#modules/bills_of_materials/models/bill_of_material'
import type BillOfMaterialLine from '#modules/bills_of_materials/models/bill_of_material_line'
import PatternSet from '#modules/pattern_sets/models/pattern_set'
import { calculateBomCostProjection } from '#modules/bills_of_materials/services/bom_cost_projection'
import {
  resolveBillOfMaterialsLineAttention,
  serializeBillOfMaterialsLine,
  type BillOfMaterialsLineReferenceIds,
} from '#modules/bills_of_materials/services/bill_of_materials_line_serializer'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type {
  BillOfMaterialsDetail,
  BillOfMaterialsSummary,
  BillsOfMaterialsCatalogSummary,
  ListBillsOfMaterialsQuery,
  ListBillsOfMaterialsResponse,
} from '@guardiola-foundry/shared-types'

export async function listBillsOfMaterials(
  filters: ListBillsOfMaterialsQuery = {}
): Promise<ListBillsOfMaterialsResponse> {
  const query = BillOfMaterial.query()
    .preload('createdBy')
    .preload('product', (productQuery) => Product.includeDeleted(productQuery))
    .preload('productVariant', (variantQuery) => {
      ProductVariant.includeDeleted(variantQuery)
      variantQuery.preload('product', (productQuery) => Product.includeDeleted(productQuery))
    })
    .preload('origin', (originQuery) => BillOfMaterial.includeDeleted(originQuery))
    .preload('lines', (linesQuery) => {
      linesQuery.preload('patternSet')
      linesQuery.preload('material', (materialQuery) => {
        Material.includeDeleted(materialQuery)
        materialQuery.preload('sourceLinks', (sourceLinkQuery) => {
          sourceLinkQuery.where('isPreferred', true).preload('materialSource', (sourceQuery) => {
            MaterialSource.includeDeleted(sourceQuery)
          })
        })
      })
    })
    .orderBy('updatedAt', 'desc')

  if (filters.includeDeleted) BillOfMaterial.includeDeleted(query)
  const billsOfMaterials = await query
  const descendantCounts = await loadDescendantCounts()
  const summaries = billsOfMaterials.map((billOfMaterials) =>
    serializeBillOfMaterials(billOfMaterials, descendantCounts.get(billOfMaterials.id) ?? 0)
  )
  const availableSummaries = summaries.filter((billOfMaterials) => !billOfMaterials.deletedAt)

  return {
    billsOfMaterials: summaries.filter((billOfMaterials) =>
      matchesCatalogFilters(billOfMaterials, filters)
    ),
    summary: summarizeAvailableCatalog(availableSummaries),
  }
}

export async function getBillOfMaterials(
  publicId: string,
  options?: { includeDeleted?: boolean }
): Promise<BillOfMaterialsDetail | null> {
  const billOfMaterials = await loadBillOfMaterials(publicId, undefined, options?.includeDeleted)
  if (!billOfMaterials) return null
  const descendantCounts = await loadDescendantCounts()
  return await serializeBillOfMaterialsDetail(
    billOfMaterials,
    descendantCounts.get(billOfMaterials.id) ?? 0
  )
}

export async function loadBillOfMaterialsDetail(publicId: string, trx: TransactionClientContract) {
  const billOfMaterials = await loadBillOfMaterials(publicId, trx)
  if (!billOfMaterials) throw new Error(`Bill of Materials ${publicId} could not be reloaded.`)
  const descendantCounts = await loadDescendantCounts(trx)
  return await serializeBillOfMaterialsDetail(
    billOfMaterials,
    descendantCounts.get(billOfMaterials.id) ?? 0,
    trx
  )
}

function serializeBillOfMaterials(
  billOfMaterials: BillOfMaterial,
  descendantCount: number
): BillOfMaterialsSummary {
  const product =
    billOfMaterials.productId === null
      ? billOfMaterials.productVariant?.product
      : billOfMaterials.product
  const costProjection = calculateBomCostProjection(billOfMaterials.lines)

  return {
    id: billOfMaterials.publicId,
    kind: billOfMaterials.kind,
    name: billOfMaterials.name,
    description: billOfMaterials.description,
    product: !product
      ? null
      : {
          id: product.publicId,
          name: product.name,
          availability:
            product.deletedAt === null && product.productStatus === 'active'
              ? 'available'
              : 'unavailable',
        },
    productVariant:
      billOfMaterials.productVariantId === null
        ? null
        : {
            id: billOfMaterials.productVariant.publicId,
            name: billOfMaterials.productVariant.name,
            availability:
              billOfMaterials.productVariant.deletedAt === null &&
              billOfMaterials.productVariant.status === 'active' &&
              product?.deletedAt === null &&
              product.productStatus === 'active'
                ? 'available'
                : 'unavailable',
          },
    origin:
      billOfMaterials.originBillOfMaterialsId === null
        ? null
        : {
            id: billOfMaterials.origin.publicId,
            name: billOfMaterials.origin.name,
            kind: billOfMaterials.origin.kind,
            availability: billOfMaterials.origin.deletedAt === null ? 'available' : 'unavailable',
          },
    deletedAt: billOfMaterials.deletedAt?.toISO() ?? null,
    descendantCount,
    readOnlyReason: resolveReadOnlyReason(billOfMaterials, product),
    lineCount: billOfMaterials.lines.length,
    verifiedLineCount: billOfMaterials.lines.filter((line) => line.verifiedAt !== null).length,
    attentionCount: billOfMaterials.lines.filter(
      (line) => resolveBillOfMaterialsLineAttention(line).length > 0
    ).length,
    costProjection: costProjection.summary,
    createdBy: {
      id: billOfMaterials.createdBy.id,
      email: billOfMaterials.createdBy.email,
    },
    createdAt: billOfMaterials.createdAt.toISO()!,
    updatedAt: billOfMaterials.updatedAt.toISO()!,
  }
}

function summarizeAvailableCatalog(
  billsOfMaterials: BillOfMaterialsSummary[]
): BillsOfMaterialsCatalogSummary {
  return {
    totalAvailable: billsOfMaterials.length,
    templateCount: billsOfMaterials.filter((item) => item.kind === 'template').length,
    implementationCount: billsOfMaterials.filter((item) => item.kind === 'implementation').length,
    withoutProductVariantCount: billsOfMaterials.filter((item) => item.productVariant === null)
      .length,
    withUnverifiedLinesCount: billsOfMaterials.filter(
      (item) => item.verifiedLineCount < item.lineCount
    ).length,
  }
}

function matchesCatalogFilters(
  billOfMaterials: BillOfMaterialsSummary,
  filters: ListBillsOfMaterialsQuery
) {
  if (filters.kind && billOfMaterials.kind !== filters.kind) return false
  if (!filters.search) return true

  const search = normalizeCatalogSearch(filters.search)
  return [
    billOfMaterials.name,
    billOfMaterials.id,
    billOfMaterials.product?.name,
    billOfMaterials.product?.id,
    billOfMaterials.productVariant?.name,
    billOfMaterials.productVariant?.id,
    billOfMaterials.origin?.name,
    billOfMaterials.origin?.id,
  ].some((value) => value !== undefined && normalizeCatalogSearch(value).includes(search))
}

function normalizeCatalogSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase()
}

function resolveReadOnlyReason(
  billOfMaterials: BillOfMaterial,
  product: Product | undefined
): BillOfMaterialsSummary['readOnlyReason'] {
  if (billOfMaterials.deletedAt) return 'bom-deleted'
  if (product?.deletedAt) return 'product-deleted'
  if (billOfMaterials.productVariant?.deletedAt) return 'product-variant-deleted'
  return null
}

async function serializeBillOfMaterialsDetail(
  billOfMaterials: BillOfMaterial,
  descendantCount: number,
  trx?: TransactionClientContract
): Promise<BillOfMaterialsDetail> {
  const projection = calculateBomCostProjection(billOfMaterials.lines)
  const referenceIds = await loadLineReferenceIds(billOfMaterials.lines, trx)
  const lines = billOfMaterials.lines.map((line, index) =>
    serializeBillOfMaterialsLine(line, projection.lines[index], referenceIds)
  )

  return {
    ...serializeBillOfMaterials(billOfMaterials, descendantCount),
    lines,
    attentionCount: lines.filter((line) => line.attention.length > 0).length,
    costProjection: projection.summary,
  }
}

async function loadLineReferenceIds(
  lines: BillOfMaterialLine[],
  trx?: TransactionClientContract
): Promise<BillOfMaterialsLineReferenceIds> {
  const materialIds = [
    ...new Set(lines.flatMap((line) => (line.materialId === null ? [] : [line.materialId]))),
  ]
  const patternSetIds = [
    ...new Set(lines.flatMap((line) => (line.patternSetId === null ? [] : [line.patternSetId]))),
  ]
  const materialQuery = Material.query(trx ? { client: trx } : undefined)
    .select('id', 'publicId')
    .whereIn('id', materialIds)
  Material.includeDeleted(materialQuery)
  const materials = materialIds.length > 0 ? await materialQuery : []
  const patternSets =
    patternSetIds.length > 0
      ? await PatternSet.query(trx ? { client: trx } : undefined)
          .select('id', 'publicId')
          .whereIn('id', patternSetIds)
      : []

  return {
    material: new Map(materials.map((material) => [material.id, material.publicId])),
    patternSet: new Map(patternSets.map((patternSet) => [patternSet.id, patternSet.publicId])),
  }
}

async function loadBillOfMaterials(
  publicId: string,
  trx?: TransactionClientContract,
  includeDeleted = false
) {
  const query = BillOfMaterial.query(trx ? { client: trx } : undefined)
    .where('publicId', publicId)
    .preload('createdBy')
    .preload('product', (productQuery) => Product.includeDeleted(productQuery))
    .preload('productVariant', (variantQuery) => {
      ProductVariant.includeDeleted(variantQuery)
      variantQuery.preload('product', (productQuery) => Product.includeDeleted(productQuery))
    })
    .preload('origin', (originQuery) => BillOfMaterial.includeDeleted(originQuery))
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
  if (includeDeleted) BillOfMaterial.includeDeleted(query)
  return query.first()
}

async function loadDescendantCounts(trx?: TransactionClientContract) {
  const lineageQuery = BillOfMaterial.query(trx ? { client: trx } : undefined).select(
    'id',
    'originBillOfMaterialsId'
  )
  BillOfMaterial.includeDeleted(lineageQuery)
  const lineage = await lineageQuery
  const originById = new Map(lineage.map((item) => [item.id, item.originBillOfMaterialsId]))
  const counts = new Map<number, number>()

  for (const item of lineage) {
    const visited = new Set([item.id])
    let ancestorId = item.originBillOfMaterialsId
    while (ancestorId !== null && !visited.has(ancestorId)) {
      counts.set(ancestorId, (counts.get(ancestorId) ?? 0) + 1)
      visited.add(ancestorId)
      ancestorId = originById.get(ancestorId) ?? null
    }
  }

  return counts
}
