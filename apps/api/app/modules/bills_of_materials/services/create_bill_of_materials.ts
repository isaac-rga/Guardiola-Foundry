import Material from '#models/material'
import Product from '#models/product'
import ProductVariant from '#models/product_variant'
import BillOfMaterial from '#modules/bills_of_materials/models/bill_of_material'
import BillOfMaterialLine from '#modules/bills_of_materials/models/bill_of_material_line'
import PatternSet from '#modules/pattern_sets/models/pattern_set'
import { loadBillOfMaterialsDetail } from '#modules/bills_of_materials/services/read_bills_of_materials'
import { lockTemplateProductSlot } from '#modules/bills_of_materials/services/template_product_slot'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type {
  BillOfMaterialsDetail,
  CreateBillOfMaterialsRequest,
} from '@guardiola-foundry/shared-types'
import { DateTime } from 'luxon'
import { randomBytes } from 'node:crypto'

const BILL_OF_MATERIALS_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const BILL_OF_MATERIALS_ID_LENGTH = 6
const BILL_OF_MATERIALS_LINE_ID_PREFIX = 'BML-'

export async function createBillOfMaterials(
  createdByUserId: number,
  payload: CreateBillOfMaterialsRequest
): Promise<BillOfMaterialsDetail> {
  return db.transaction(async (trx) => {
    const relationship =
      payload.kind === 'template'
        ? await resolveTemplateRelationship(payload.productId, trx)
        : await resolveImplementationRelationship(payload.productVariantId, payload.name, trx)

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

    const patternSetPublicIds = payload.lines.flatMap((line) =>
      line.patternSetId === null ? [] : [line.patternSetId]
    )
    const patternSets =
      patternSetPublicIds.length === 0
        ? []
        : await PatternSet.query({ client: trx })
            .whereIn('publicId', [...new Set(patternSetPublicIds)])
            .where('status', 'active')
            .forUpdate()
    const patternSetByPublicId = new Map(
      patternSets.map((patternSet) => [patternSet.publicId, patternSet])
    )
    const unavailablePatternSetIndex = payload.lines.findIndex(
      (line) => line.patternSetId !== null && !patternSetByPublicId.has(line.patternSetId)
    )

    if (unavailablePatternSetIndex !== -1) {
      throw new BillOfMaterialsValidationError(
        `lines.${unavailablePatternSetIndex}.patternSetId`,
        'The selected Pattern Set is no longer available.'
      )
    }

    const billOfMaterials = await BillOfMaterial.create(
      {
        publicId: await generateBillOfMaterialsId(trx),
        kind: payload.kind,
        name: payload.name,
        description: payload.description,
        createdByUserId,
        productId: relationship.productId,
        productVariantId: relationship.productVariantId,
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
          patternSetId:
            line.patternSetId === null ? null : patternSetByPublicId.get(line.patternSetId)!.id,
          lineNote: line.lineNote,
          displayOrder,
          verifiedByUserId: line.verified ? createdByUserId : null,
          verifiedAt: line.verified ? verifiedAt : null,
        })),
        { client: trx }
      )
    }

    return loadBillOfMaterialsDetail(billOfMaterials.publicId, trx)
  })
}

async function resolveTemplateRelationship(
  productPublicId: string | null,
  trx: TransactionClientContract
) {
  if (productPublicId === null) return { productId: null, productVariantId: null }

  const productSlot = await lockTemplateProductSlot(productPublicId, trx)
  if (productSlot.status === 'unavailable') {
    throw new BillOfMaterialsValidationError(
      'productId',
      'BOM Templates can only be associated with an active Product.'
    )
  }
  if (productSlot.status === 'occupied') {
    throw new BillOfMaterialsProductConflictError(productSlot.conflictingTemplate)
  }
  return { productId: productSlot.product.id, productVariantId: null }
}

async function resolveImplementationRelationship(
  productVariantPublicId: string,
  name: string,
  trx: TransactionClientContract
) {
  const candidateQuery = ProductVariant.query({ client: trx }).where(
    'publicId',
    productVariantPublicId
  )
  ProductVariant.includeDeleted(candidateQuery)
  const candidate = await candidateQuery.first()
  if (!candidate || candidate.deletedAt) {
    throw new BillOfMaterialsValidationError(
      'productVariantId',
      'The selected Product Variant is no longer available.'
    )
  }

  const productQuery = Product.query({ client: trx }).where('id', candidate.productId).forUpdate()
  Product.includeDeleted(productQuery)
  const product = await productQuery.firstOrFail()
  const variantQuery = ProductVariant.query({ client: trx }).where('id', candidate.id).forUpdate()
  ProductVariant.includeDeleted(variantQuery)
  const variant = await variantQuery.firstOrFail()

  if (product.deletedAt || product.productStatus !== 'active') {
    throw new BillOfMaterialsValidationError(
      'productVariantId',
      'The selected Product is no longer available.'
    )
  }
  if (variant.deletedAt || variant.status !== 'active') {
    throw new BillOfMaterialsValidationError(
      'productVariantId',
      'The selected Product Variant is no longer available.'
    )
  }

  const existingImplementation = await BillOfMaterial.query({ client: trx })
    .where('productVariantId', variant.id)
    .first()
  if (existingImplementation) {
    throw new BillOfMaterialsVariantConflictError({
      id: existingImplementation.publicId,
      name: existingImplementation.name,
    })
  }

  const duplicateTypification = await BillOfMaterial.query({ client: trx })
    .join('product_variants', 'product_variants.id', 'bills_of_materials.product_variant_id')
    .where('product_variants.product_id', product.id)
    .whereRaw('lower(bills_of_materials.name) = lower(?)', [name])
    .select('bills_of_materials.public_id', 'bills_of_materials.name')
    .first()
  if (duplicateTypification) {
    throw new BillOfMaterialsTypificationConflictError({
      id: duplicateTypification.publicId,
      name: duplicateTypification.name,
    })
  }

  return { productId: null, productVariantId: variant.id }
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

export class BillOfMaterialsVariantConflictError extends Error {
  constructor(readonly conflictingImplementation: { id: string; name: string }) {
    super(`Product Variant already has ${conflictingImplementation.name}.`)
    this.name = 'BillOfMaterialsVariantConflictError'
  }
}

export class BillOfMaterialsTypificationConflictError extends Error {
  constructor(readonly conflictingImplementation: { id: string; name: string }) {
    super('Another BOM Implementation in this Product already uses this typification.')
    this.name = 'BillOfMaterialsTypificationConflictError'
  }
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

export async function generateBillOfMaterialsLineId(
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
