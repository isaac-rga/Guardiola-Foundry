import Material from '#models/material'
import Product from '#models/product'
import ProductVariant from '#models/product_variant'
import {
  BillOfMaterialsUpdateValidationError,
  planBillOfMaterialsLineReplacement,
} from '#modules/bills_of_materials/domain/bill_of_materials_line_replacement'
import BillOfMaterial from '#modules/bills_of_materials/models/bill_of_material'
import BillOfMaterialLine from '#modules/bills_of_materials/models/bill_of_material_line'
import { generateBillOfMaterialsLineId } from '#modules/bills_of_materials/services/create_bill_of_materials'
import { loadBillOfMaterialsDetail } from '#modules/bills_of_materials/services/read_bills_of_materials'
import PatternSet from '#modules/pattern_sets/models/pattern_set'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type {
  BillOfMaterialsDetail,
  UpdateBillOfMaterialsLineRequest,
  UpdateBillOfMaterialsRequest,
} from '@guardiola-foundry/shared-types'
import { DateTime } from 'luxon'

export async function updateBillOfMaterials(
  billOfMaterialsPublicId: string,
  updatedByUserId: number,
  payload: UpdateBillOfMaterialsRequest
): Promise<BillOfMaterialsDetail> {
  return db.transaction(async (trx) => {
    const billOfMaterials = await BillOfMaterial.queryWithDeleted()
      .useTransaction(trx)
      .where('publicId', billOfMaterialsPublicId)
      .forUpdate()
      .first()

    if (!billOfMaterials) throw new BillOfMaterialsNotFoundError()
    if (billOfMaterials.deletedAt) throw new BillOfMaterialsDeletedConflictError()
    if (billOfMaterials.updatedAt.toISO() !== payload.updatedAt) {
      throw new BillOfMaterialsStaleConflictError(billOfMaterials.updatedAt.toISO()!)
    }

    await assertRelatedStructureIsEditable(billOfMaterials, trx)
    await assertImplementationTypificationIsAvailable(billOfMaterials, payload.name, trx)

    const existingLines = await BillOfMaterialLine.query({ client: trx })
      .where('billOfMaterialsId', billOfMaterials.id)
      .forUpdate()
    const materials = await loadRequestedMaterials(payload.lines, trx)
    const patternSets = await loadRequestedPatternSets(payload.lines, trx)
    const linePlan = planBillOfMaterialsLineReplacement(
      payload.lines,
      existingLines.map((line) => ({
        publicId: line.publicId,
        constructionPiece: line.constructionPiece,
        materialId: line.materialId,
        materialQuantity: line.materialQuantity,
        patternSetId: line.patternSetId,
        verified: line.verifiedAt !== null,
      })),
      new Map(
        [...materials].map(([publicId, material]) => [
          publicId,
          { databaseId: material.id, available: material.deletedAt === null },
        ])
      ),
      new Map(
        [...patternSets].map(([publicId, patternSet]) => [
          publicId,
          { databaseId: patternSet.id, available: patternSet.status === 'active' },
        ])
      )
    )
    const existingLineByPublicId = new Map(existingLines.map((line) => [line.publicId, line]))

    const removedLineIds = existingLines
      .filter((line) => !linePlan.retainedLineIds.has(line.publicId))
      .map((line) => line.id)
    if (removedLineIds.length > 0) {
      await BillOfMaterialLine.query({ client: trx }).whereIn('id', removedLineIds).delete()
    }
    const temporaryOrderOffset = existingLines.length + payload.lines.length + 1
    if (linePlan.retainedLineIds.size > 0) {
      await BillOfMaterialLine.query({ client: trx })
        .where('billOfMaterialsId', billOfMaterials.id)
        .whereIn('publicId', [...linePlan.retainedLineIds])
        .increment('displayOrder', temporaryOrderOffset)
      existingLines.forEach((line) => {
        if (linePlan.retainedLineIds.has(line.publicId)) {
          line.displayOrder += temporaryOrderOffset
        }
      })
    }

    const verifiedAt = DateTime.utc()
    const reservedLineIds = new Set<string>()
    for (const [displayOrder, plannedLine] of linePlan.lines.entries()) {
      const requestedLine = plannedLine.requested
      const existingLine = plannedLine.existingPublicId
        ? existingLineByPublicId.get(plannedLine.existingPublicId)!
        : null

      const values = {
        constructionPiece: requestedLine.constructionPiece,
        materialId: plannedLine.materialDatabaseId,
        materialQuantity: requestedLine.materialQuantity,
        patternSetId: plannedLine.patternSetDatabaseId,
        lineNote: requestedLine.lineNote,
        displayOrder,
        verifiedByUserId: requestedLine.verified
          ? plannedLine.preserveVerification
            ? existingLine!.verifiedByUserId
            : updatedByUserId
          : null,
        verifiedAt: requestedLine.verified
          ? plannedLine.preserveVerification
            ? existingLine!.verifiedAt
            : verifiedAt
          : null,
      }

      if (existingLine) {
        await trx
          .from('bill_of_materials_lines')
          .where('id', existingLine.id)
          .update({
            construction_piece: values.constructionPiece,
            material_id: values.materialId,
            material_quantity: values.materialQuantity,
            pattern_set_id: values.patternSetId,
            line_note: values.lineNote,
            display_order: values.displayOrder,
            verified_by_user_id: values.verifiedByUserId,
            verified_at: values.verifiedAt?.toSQL() ?? null,
            updated_at: DateTime.utc().toSQL(),
          })
      } else {
        await BillOfMaterialLine.create(
          {
            publicId: await generateBillOfMaterialsLineId(trx, reservedLineIds),
            billOfMaterialsId: billOfMaterials.id,
            ...values,
          },
          { client: trx }
        )
      }
    }

    billOfMaterials.name = payload.name
    billOfMaterials.description = payload.description
    billOfMaterials.enableForceUpdate()
    billOfMaterials.useTransaction(trx)
    await billOfMaterials.save()

    return loadBillOfMaterialsDetail(billOfMaterials.publicId, trx)
  })
}

async function assertRelatedStructureIsEditable(
  billOfMaterials: BillOfMaterial,
  trx: TransactionClientContract
) {
  if (billOfMaterials.productId !== null) {
    const productQuery = Product.query({ client: trx })
      .where('id', billOfMaterials.productId)
      .forUpdate()
    Product.includeDeleted(productQuery)
    const product = await productQuery.firstOrFail()
    if (product.deletedAt) {
      throw new BillOfMaterialsUpdateValidationError(
        'updatedAt',
        'Restore the assigned Product before editing this Bill of Materials.'
      )
    }
  }

  if (billOfMaterials.productVariantId !== null) {
    const variantQuery = ProductVariant.query({ client: trx })
      .where('id', billOfMaterials.productVariantId)
      .forUpdate()
    ProductVariant.includeDeleted(variantQuery)
    const variant = await variantQuery.firstOrFail()
    const productQuery = Product.query({ client: trx }).where('id', variant.productId).forUpdate()
    Product.includeDeleted(productQuery)
    const product = await productQuery.firstOrFail()
    if (variant.deletedAt || product.deletedAt) {
      throw new BillOfMaterialsUpdateValidationError(
        'updatedAt',
        'Restore the Product and Product Variant before editing this Bill of Materials.'
      )
    }
  }
}

async function assertImplementationTypificationIsAvailable(
  billOfMaterials: BillOfMaterial,
  name: string,
  trx: TransactionClientContract
) {
  if (billOfMaterials.productVariantId === null) return
  const variant = await ProductVariant.query({ client: trx })
    .where('id', billOfMaterials.productVariantId)
    .firstOrFail()
  const duplicate = await BillOfMaterial.query({ client: trx })
    .join('product_variants', 'product_variants.id', 'bills_of_materials.product_variant_id')
    .where('product_variants.product_id', variant.productId)
    .whereNot('bills_of_materials.id', billOfMaterials.id)
    .whereRaw('lower(bills_of_materials.name) = lower(?)', [name])
    .select('bills_of_materials.public_id', 'bills_of_materials.name')
    .first()
  if (duplicate) {
    throw new BillOfMaterialsUpdateValidationError(
      'name',
      'Another BOM Implementation in this Product already uses this typification.'
    )
  }
}

async function loadRequestedMaterials(
  lines: UpdateBillOfMaterialsLineRequest[],
  trx: TransactionClientContract
) {
  const publicIds = [
    ...new Set(lines.flatMap((line) => (line.materialId ? [line.materialId] : []))),
  ]
  if (publicIds.length === 0) return new Map<string, Material>()
  const materials = await Material.queryWithDeleted()
    .useTransaction(trx)
    .whereIn('publicId', publicIds)
    .forUpdate()
  return new Map(materials.map((material) => [material.publicId, material]))
}

async function loadRequestedPatternSets(
  lines: UpdateBillOfMaterialsLineRequest[],
  trx: TransactionClientContract
) {
  const publicIds = [
    ...new Set(lines.flatMap((line) => (line.patternSetId ? [line.patternSetId] : []))),
  ]
  if (publicIds.length === 0) return new Map<string, PatternSet>()
  const patternSets = await PatternSet.query({ client: trx })
    .whereIn('publicId', publicIds)
    .forUpdate()
  return new Map(patternSets.map((patternSet) => [patternSet.publicId, patternSet]))
}

export class BillOfMaterialsNotFoundError extends Error {}

export class BillOfMaterialsDeletedConflictError extends Error {
  constructor() {
    super('This Bill of Materials was deleted while it was open. Your draft was not saved.')
  }
}

export class BillOfMaterialsStaleConflictError extends Error {
  constructor(readonly currentUpdatedAt: string) {
    super('This Bill of Materials changed after you opened it. Your draft was not saved.')
  }
}

export { BillOfMaterialsUpdateValidationError }
