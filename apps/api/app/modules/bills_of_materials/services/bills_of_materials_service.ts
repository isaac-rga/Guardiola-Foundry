import BillOfMaterial from '#modules/bills_of_materials/models/bill_of_material'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type {
  BillOfMaterialsSummary,
  CreateBillOfMaterialsTemplateRequest,
  ListBillsOfMaterialsResponse,
} from '@guardiola-foundry/shared-types'
import { randomBytes } from 'node:crypto'

const BILL_OF_MATERIALS_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const BILL_OF_MATERIALS_ID_LENGTH = 6

export async function listBillsOfMaterials(): Promise<ListBillsOfMaterialsResponse> {
  const billsOfMaterials = await BillOfMaterial.query()
    .preload('createdBy')
    .orderBy('updatedAt', 'desc')

  return { billsOfMaterials: billsOfMaterials.map(serializeBillOfMaterials) }
}

export async function createBillOfMaterialsTemplate(
  createdByUserId: number,
  payload: CreateBillOfMaterialsTemplateRequest
): Promise<BillOfMaterialsSummary> {
  return db.transaction(async (trx) => {
    const billOfMaterials = await BillOfMaterial.create(
      {
        publicId: await generateBillOfMaterialsId(trx),
        kind: 'template',
        name: payload.name,
        description: payload.description,
        createdByUserId,
      },
      { client: trx }
    )

    await billOfMaterials.load('createdBy')
    return serializeBillOfMaterials(billOfMaterials)
  })
}

function serializeBillOfMaterials(billOfMaterials: BillOfMaterial): BillOfMaterialsSummary {
  return {
    id: billOfMaterials.publicId,
    kind: billOfMaterials.kind,
    name: billOfMaterials.name,
    description: billOfMaterials.description,
    createdBy: {
      id: billOfMaterials.createdBy.id,
      email: billOfMaterials.createdBy.email,
    },
    createdAt: billOfMaterials.createdAt.toISO()!,
    updatedAt: billOfMaterials.updatedAt.toISO()!,
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
