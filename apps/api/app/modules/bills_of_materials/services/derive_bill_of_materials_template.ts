import Product from '#models/product'
import ProductVariant from '#models/product_variant'
import BillOfMaterial from '#modules/bills_of_materials/models/bill_of_material'
import BillOfMaterialLine from '#modules/bills_of_materials/models/bill_of_material_line'
import {
  BillOfMaterialsProductConflictError,
  BillOfMaterialsValidationError,
  generateBillOfMaterialsId,
  generateBillOfMaterialsLineId,
} from '#modules/bills_of_materials/services/create_bill_of_materials'
import { loadBillOfMaterialsDetail } from '#modules/bills_of_materials/services/read_bills_of_materials'
import { deriveBillOfMaterialsCopySnapshot } from '#modules/bills_of_materials/services/template_application_snapshot'
import { lockTemplateProductSlot } from '#modules/bills_of_materials/services/template_product_slot'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type {
  BillOfMaterialsDetail,
  DeriveBillOfMaterialsTemplateRequest,
} from '@guardiola-foundry/shared-types'

export async function deriveBillOfMaterialsTemplate(
  originPublicId: string,
  createdByUserId: number,
  payload: DeriveBillOfMaterialsTemplateRequest
): Promise<BillOfMaterialsDetail> {
  return db.transaction(async (trx) => {
    const origin = await BillOfMaterial.queryWithDeleted()
      .useTransaction(trx)
      .where('publicId', originPublicId)
      .forUpdate()
      .first()

    if (!origin || origin.deletedAt !== null) {
      throw new BillOfMaterialsDerivationOriginNotFoundError()
    }

    const sourceLines = await BillOfMaterialLine.query({ client: trx })
      .where('billOfMaterialsId', origin.id)
      .orderBy('displayOrder', 'asc')
      .forUpdate()
    const snapshot = deriveBillOfMaterialsCopySnapshot({
      description: origin.description,
      lines: sourceLines,
    })
    const sourceProductPublicId = await resolveSourceProductPublicId(origin, trx)
    const productId = await resolveDestinationProductId(
      payload.productId,
      sourceProductPublicId,
      trx
    )

    const template = await BillOfMaterial.create(
      {
        publicId: await generateBillOfMaterialsId(trx),
        kind: 'template',
        name: payload.name,
        description: snapshot.description,
        createdByUserId,
        productId,
        productVariantId: null,
        originBillOfMaterialsId: origin.id,
      },
      { client: trx }
    )

    const reservedLineIds = new Set<string>()
    for (const line of snapshot.lines) {
      await BillOfMaterialLine.create(
        {
          publicId: await generateBillOfMaterialsLineId(trx, reservedLineIds),
          billOfMaterialsId: template.id,
          ...line,
        },
        { client: trx }
      )
    }

    return loadBillOfMaterialsDetail(template.publicId, trx)
  })
}

async function resolveSourceProductPublicId(
  origin: BillOfMaterial,
  trx: TransactionClientContract
) {
  let productId = origin.productId
  if (productId === null && origin.productVariantId !== null) {
    const variantQuery = ProductVariant.query({ client: trx }).where('id', origin.productVariantId)
    ProductVariant.includeDeleted(variantQuery)
    const variant = await variantQuery.first()
    productId = variant?.productId ?? null
  }
  if (productId === null) return null

  const productQuery = Product.query({ client: trx }).where('id', productId)
  Product.includeDeleted(productQuery)
  const product = await productQuery.first()
  return product?.publicId ?? null
}

async function resolveDestinationProductId(
  requestedProductPublicId: string | null | undefined,
  sourceProductPublicId: string | null,
  trx: TransactionClientContract
) {
  if (requestedProductPublicId === null) return null

  const targetProductPublicId = requestedProductPublicId ?? sourceProductPublicId
  if (targetProductPublicId === null) return null

  const productSlot = await lockTemplateProductSlot(targetProductPublicId, trx)
  const isBestEffortSuggestion = targetProductPublicId === sourceProductPublicId
  if (productSlot.status === 'unavailable') {
    if (isBestEffortSuggestion) return null
    throw new BillOfMaterialsValidationError(
      'productId',
      'BOM Templates can only be associated with an active Product.'
    )
  }
  if (productSlot.status === 'occupied') {
    if (isBestEffortSuggestion) return null
    throw new BillOfMaterialsProductConflictError(productSlot.conflictingTemplate)
  }
  return productSlot.product.id
}

export class BillOfMaterialsDerivationOriginNotFoundError extends Error {}
