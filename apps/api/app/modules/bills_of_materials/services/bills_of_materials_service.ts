import Material from '#models/material'
import BillOfMaterial from '#modules/bills_of_materials/models/bill_of_material'
import BillOfMaterialLine from '#modules/bills_of_materials/models/bill_of_material_line'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type {
  BillOfMaterialsDetail,
  BillOfMaterialsLine,
  BillOfMaterialsSummary,
  CreateBillOfMaterialsTemplateRequest,
  ListBillsOfMaterialsResponse,
} from '@guardiola-foundry/shared-types'
import { randomBytes } from 'node:crypto'

const BILL_OF_MATERIALS_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const BILL_OF_MATERIALS_ID_LENGTH = 6
const BILL_OF_MATERIALS_LINE_ID_PREFIX = 'BML-'

export async function listBillsOfMaterials(): Promise<ListBillsOfMaterialsResponse> {
  const billsOfMaterials = await BillOfMaterial.query()
    .preload('createdBy')
    .orderBy('updatedAt', 'desc')

  return { billsOfMaterials: billsOfMaterials.map(serializeBillOfMaterials) }
}

export async function createBillOfMaterialsTemplate(
  createdByUserId: number,
  payload: CreateBillOfMaterialsTemplateRequest
): Promise<BillOfMaterialsDetail> {
  return db.transaction(async (trx) => {
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
      },
      { client: trx }
    )

    const reservedLineIds = new Set<string>()
    if (payload.lines.length > 0) {
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
        })),
        { client: trx }
      )
    }

    return await loadBillOfMaterialsDetail(billOfMaterials.publicId, trx)
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

function serializeBillOfMaterialsDetail(billOfMaterials: BillOfMaterial): BillOfMaterialsDetail {
  return {
    ...serializeBillOfMaterials(billOfMaterials),
    lines: billOfMaterials.lines.map(serializeBillOfMaterialsLine),
  }
}

function serializeBillOfMaterialsLine(line: BillOfMaterialLine): BillOfMaterialsLine {
  const hasValidQuantity = line.materialQuantity !== null && line.materialQuantity > 0

  return {
    id: line.publicId,
    constructionPiece: line.constructionPiece,
    material:
      line.materialId === null ? null : { id: line.material.publicId, name: line.material.name },
    materialQuantity: line.materialQuantity,
    lineNote: line.lineNote,
    order: line.displayOrder,
    completeness:
      line.constructionPiece.length > 0 && line.materialId !== null && hasValidQuantity
        ? 'complete'
        : 'incomplete',
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
    .preload('lines', (lines) => {
      lines.preload('material').orderBy('displayOrder', 'asc')
    })
    .first()
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
