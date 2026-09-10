import Material from '#models/material'
import BillOfMaterial from '#modules/bills_of_materials/models/bill_of_material'
import BillOfMaterialLine from '#modules/bills_of_materials/models/bill_of_material_line'
import { loadBillOfMaterialsDetail } from '#modules/bills_of_materials/services/read_bills_of_materials'
import { lockTemplateProductSlot } from '#modules/bills_of_materials/services/template_product_slot'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type {
  BillOfMaterialsDetail,
  CreateBillOfMaterialsTemplateRequest,
} from '@guardiola-foundry/shared-types'
import { DateTime } from 'luxon'
import { randomBytes } from 'node:crypto'

const BILL_OF_MATERIALS_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const BILL_OF_MATERIALS_ID_LENGTH = 6
const BILL_OF_MATERIALS_LINE_ID_PREFIX = 'BML-'

export async function createBillOfMaterialsTemplate(
  createdByUserId: number,
  payload: CreateBillOfMaterialsTemplateRequest
): Promise<BillOfMaterialsDetail> {
  return db.transaction(async (trx) => {
    const productSlot =
      payload.productId === null ? null : await lockTemplateProductSlot(payload.productId, trx)

    if (productSlot?.status === 'unavailable') {
      throw new BillOfMaterialsValidationError(
        'productId',
        'BOM Templates can only be associated with an active Product.'
      )
    }
    if (productSlot?.status === 'occupied') {
      throw new BillOfMaterialsProductConflictError(productSlot.conflictingTemplate)
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
        productId: productSlot?.status === 'available' ? productSlot.product.id : null,
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

    return loadBillOfMaterialsDetail(billOfMaterials.publicId, trx)
  })
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
