import Material from '#models/material'
import MaterialSource from '#models/material_source'
import Product from '#models/product'
import BillOfMaterial from '#modules/bills_of_materials/models/bill_of_material'
import BillOfMaterialLine from '#modules/bills_of_materials/models/bill_of_material_line'
import {
  calculateBomCostProjection,
  preferredSourceFor,
  sourceNeedsAttention,
} from '#modules/bills_of_materials/services/bom_cost_projection'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type {
  BillOfMaterialsDetail,
  BillOfMaterialsLine,
  BillOfMaterialsLineCostProjection,
  BillOfMaterialsLinePreferredSource,
  BillOfMaterialsSummary,
  CreateBillOfMaterialsTemplateRequest,
  ListBillsOfMaterialsResponse,
} from '@guardiola-foundry/shared-types'
import { DateTime } from 'luxon'
import { randomBytes } from 'node:crypto'

const BILL_OF_MATERIALS_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const BILL_OF_MATERIALS_ID_LENGTH = 6
const BILL_OF_MATERIALS_LINE_ID_PREFIX = 'BML-'

export async function listBillsOfMaterials(): Promise<ListBillsOfMaterialsResponse> {
  const billsOfMaterials = await BillOfMaterial.query()
    .preload('createdBy')
    .preload('product', (productQuery) => Product.includeDeleted(productQuery))
    .orderBy('updatedAt', 'desc')

  return { billsOfMaterials: billsOfMaterials.map(serializeBillOfMaterials) }
}

export async function createBillOfMaterialsTemplate(
  createdByUserId: number,
  payload: CreateBillOfMaterialsTemplateRequest
): Promise<BillOfMaterialsDetail> {
  return db.transaction(async (trx) => {
    const product =
      payload.productId === null ? null : await lockEligibleProduct(payload.productId, trx)

    if (product === 'not-found' || product === 'unavailable') {
      throw new BillOfMaterialsValidationError(
        'productId',
        'BOM Templates can only be associated with an active Product.'
      )
    }

    const conflictingTemplate = product ? await findAssociatedTemplate(product.id, trx) : null
    if (conflictingTemplate) {
      throw new BillOfMaterialsProductConflictError(conflictingTemplate)
    }

    const materialPublicIds = payload.lines.flatMap((line) =>
      line.materialId === null ? [] : [line.materialId]
    )
    const materials =
      materialPublicIds.length === 0
        ? []
        : await Material.query({ client: trx }).whereIn('publicId', [...new Set(materialPublicIds)])
    const materialByPublicId = new Map(materials.map((material) => [material.publicId, material]))
    const unavailableMaterialIndex = payload.lines.findIndex(
      (line) => line.materialId !== null && !materialByPublicId.has(line.materialId)
    )

    if (unavailableMaterialIndex !== -1) {
      throw new BillOfMaterialsValidationError(
        `lines.${unavailableMaterialIndex}.materialId`,
        'The selected Material is no longer available.'
      )
    }

    const billOfMaterials = await BillOfMaterial.create(
      {
        publicId: await generateBillOfMaterialsId(trx),
        kind: 'template',
        name: payload.name,
        description: payload.description,
        createdByUserId,
        productId: product?.id ?? null,
      },
      { client: trx }
    )

    const reservedLineIds = new Set<string>()
    if (payload.lines.length > 0) {
      const verifiedAt = DateTime.utc()
      const linePublicIds: string[] = []
      for (let index = 0; index < payload.lines.length; index += 1) {
        linePublicIds.push(await generateBillOfMaterialsLineId(trx, reservedLineIds))
      }

      await BillOfMaterialLine.createMany(
        payload.lines.map((line, displayOrder) => ({
          publicId: linePublicIds[displayOrder],
          billOfMaterialsId: billOfMaterials.id,
          constructionPiece: line.constructionPiece,
          materialId: line.materialId === null ? null : materialByPublicId.get(line.materialId)!.id,
          materialQuantity: line.materialQuantity,
          lineNote: line.lineNote,
          displayOrder,
          verifiedByUserId: line.verified ? createdByUserId : null,
          verifiedAt: line.verified ? verifiedAt : null,
        })),
        { client: trx }
      )
    }

    return await loadBillOfMaterialsDetail(billOfMaterials.publicId, trx)
  })
}

export type AssociateTemplateProductResult =
  | BillOfMaterialsDetail
  | 'template-not-found'
  | 'template-already-associated'
  | 'product-unavailable'
  | { conflict: { id: string; name: string } }

export async function associateBillOfMaterialsTemplateProduct(
  billOfMaterialsPublicId: string,
  productPublicId: string
): Promise<AssociateTemplateProductResult> {
  return db.transaction(async (trx) => {
    const billOfMaterials = await BillOfMaterial.query({ client: trx })
      .where('publicId', billOfMaterialsPublicId)
      .where('kind', 'template')
      .forUpdate()
      .first()

    if (!billOfMaterials) return 'template-not-found'
    if (billOfMaterials.productId !== null) return 'template-already-associated'

    const product = await lockEligibleProduct(productPublicId, trx)
    if (product === 'not-found' || product === 'unavailable') return 'product-unavailable'

    const conflictingTemplate = await findAssociatedTemplate(product.id, trx)
    if (conflictingTemplate) return { conflict: conflictingTemplate }

    billOfMaterials.productId = product.id
    await billOfMaterials.save()
    return loadBillOfMaterialsDetail(billOfMaterials.publicId, trx)
  })
}

export async function getBillOfMaterials(publicId: string): Promise<BillOfMaterialsDetail | null> {
  const billOfMaterials = await loadBillOfMaterials(publicId)
  return billOfMaterials ? serializeBillOfMaterialsDetail(billOfMaterials) : null
}

export class BillOfMaterialsValidationError extends Error {
  constructor(
    readonly field: string,
    message: string
  ) {
    super(message)
    this.name = 'BillOfMaterialsValidationError'
  }
}

export class BillOfMaterialsProductConflictError extends Error {
  constructor(readonly conflictingTemplate: { id: string; name: string }) {
    super(`Product is already associated with ${conflictingTemplate.name}.`)
    this.name = 'BillOfMaterialsProductConflictError'
  }
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

  return {
    ...serializeBillOfMaterials(billOfMaterials),
    lines: billOfMaterials.lines.map((line, index) =>
      serializeBillOfMaterialsLine(line, projection.lines[index])
    ),
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

async function loadBillOfMaterialsDetail(publicId: string, trx: TransactionClientContract) {
  const billOfMaterials = await loadBillOfMaterials(publicId, trx)
  if (!billOfMaterials) throw new Error(`Bill of Materials ${publicId} could not be reloaded.`)
  return serializeBillOfMaterialsDetail(billOfMaterials)
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
        .orderBy('displayOrder', 'asc')
    })
    .first()
}

async function lockEligibleProduct(publicId: string, trx: TransactionClientContract) {
  const query = Product.query({ client: trx }).where('publicId', publicId).forUpdate()
  Product.includeDeleted(query)
  const product = await query.first()

  if (!product) return 'not-found' as const
  if (product.deletedAt !== null || product.productStatus !== 'active')
    return 'unavailable' as const
  return product
}

async function findAssociatedTemplate(productId: number, trx: TransactionClientContract) {
  const template = await BillOfMaterial.query({ client: trx })
    .where('productId', productId)
    .where('kind', 'template')
    .first()

  return template ? { id: template.publicId, name: template.name } : null
}

async function generateBillOfMaterialsId(trx: TransactionClientContract) {
  while (true) {
    const bytes = randomBytes(BILL_OF_MATERIALS_ID_LENGTH)
    const token = Array.from(
      bytes,
      (byte) => BILL_OF_MATERIALS_ID_ALPHABET[byte % BILL_OF_MATERIALS_ID_ALPHABET.length]
    ).join('')
    const candidate = `BOM-${token}`
    if (!(await BillOfMaterial.query({ client: trx }).where('publicId', candidate).first())) {
      return candidate
    }
  }
}

async function generateBillOfMaterialsLineId(
  trx: TransactionClientContract,
  reservedIds: Set<string>
) {
  while (true) {
    const bytes = randomBytes(BILL_OF_MATERIALS_ID_LENGTH)
    const token = Array.from(
      bytes,
      (byte) => BILL_OF_MATERIALS_ID_ALPHABET[byte % BILL_OF_MATERIALS_ID_ALPHABET.length]
    ).join('')
    const candidate = `${BILL_OF_MATERIALS_LINE_ID_PREFIX}${token}`
    if (
      !reservedIds.has(candidate) &&
      !(await BillOfMaterialLine.query({ client: trx }).where('publicId', candidate).first())
    ) {
      reservedIds.add(candidate)
      return candidate
    }
  }
}
