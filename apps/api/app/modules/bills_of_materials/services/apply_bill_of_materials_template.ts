import BillOfMaterial from '#modules/bills_of_materials/models/bill_of_material'
import BillOfMaterialLine from '#modules/bills_of_materials/models/bill_of_material_line'
import {
  generateBillOfMaterialsId,
  generateBillOfMaterialsLineId,
} from '#modules/bills_of_materials/services/create_bill_of_materials'
import {
  ImplementationDestinationValidationError,
  reserveTemplateApplicationDestination,
} from '#modules/bills_of_materials/services/implementation_destination/index'
import { loadBillOfMaterialsDetail } from '#modules/bills_of_materials/services/read_bills_of_materials'
import { deriveTemplateApplicationSnapshot } from '#modules/bills_of_materials/services/template_application_snapshot'
import db from '@adonisjs/lucid/services/db'
import type {
  ApplyBillOfMaterialsTemplateRequest,
  BillOfMaterialsDetail,
} from '@guardiola-foundry/shared-types'

export async function applyBillOfMaterialsTemplate(
  templatePublicId: string,
  createdByUserId: number,
  payload: ApplyBillOfMaterialsTemplateRequest
): Promise<BillOfMaterialsDetail> {
  return db.transaction(async (trx) => {
    const template = await BillOfMaterial.queryWithDeleted()
      .useTransaction(trx)
      .where('publicId', templatePublicId)
      .forUpdate()
      .first()

    if (!template || template.kind !== 'template' || template.deletedAt) {
      throw new BillOfMaterialsTemplateNotFoundError()
    }
    if (template.productId === null) {
      throw new ApplyBillOfMaterialsTemplateValidationError(
        'templateId',
        'Associate this BOM Template with a Product before creating an Implementation.'
      )
    }

    let destination
    try {
      destination = await reserveTemplateApplicationDestination(
        payload.productVariantId,
        payload.name,
        template.productId,
        trx
      )
    } catch (error) {
      if (error instanceof ImplementationDestinationValidationError) {
        throw new ApplyBillOfMaterialsTemplateValidationError('productVariantId', error.message)
      }
      throw error
    }

    const sourceLines = await BillOfMaterialLine.query({ client: trx })
      .where('billOfMaterialsId', template.id)
      .orderBy('displayOrder', 'asc')
      .forUpdate()
    const snapshot = deriveTemplateApplicationSnapshot({
      description: template.description,
      lines: sourceLines,
    })

    const implementation = await BillOfMaterial.create(
      {
        publicId: await generateBillOfMaterialsId(trx),
        kind: 'implementation',
        name: payload.name,
        description: snapshot.description,
        createdByUserId,
        productId: null,
        productVariantId: destination.variant.id,
        originBillOfMaterialsId: template.id,
      },
      { client: trx }
    )

    const reservedLineIds = new Set<string>()
    for (const line of snapshot.lines) {
      await BillOfMaterialLine.create(
        {
          publicId: await generateBillOfMaterialsLineId(trx, reservedLineIds),
          billOfMaterialsId: implementation.id,
          ...line,
        },
        { client: trx }
      )
    }

    return loadBillOfMaterialsDetail(implementation.publicId, trx)
  })
}

export class BillOfMaterialsTemplateNotFoundError extends Error {}

export class ApplyBillOfMaterialsTemplateValidationError extends Error {
  constructor(
    readonly field: 'templateId' | 'productVariantId',
    message: string
  ) {
    super(message)
  }
}
