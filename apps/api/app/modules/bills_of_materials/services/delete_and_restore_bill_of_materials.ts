import Product from '#models/product'
import BillOfMaterial from '#modules/bills_of_materials/models/bill_of_material'
import {
  findImplementationRestorationConflict,
  lockImplementationDestinationForRestoration,
} from '#modules/bills_of_materials/services/implementation_destination/index'
import { loadBillOfMaterialsDetail } from '#modules/bills_of_materials/services/read_bills_of_materials'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type {
  BillOfMaterialsDetail,
  BillOfMaterialsReference,
} from '@guardiola-foundry/shared-types'

export async function softDeleteBillOfMaterials(
  publicId: string
): Promise<'deleted' | 'not-found'> {
  return db.transaction(async (trx) => {
    const billOfMaterials = await BillOfMaterial.query({ client: trx })
      .where('publicId', publicId)
      .forUpdate()
      .first()
    if (!billOfMaterials) return 'not-found'

    await billOfMaterials.softDelete()
    return 'deleted'
  })
}

export async function restoreBillOfMaterials(
  publicId: string
): Promise<BillOfMaterialsDetail | 'not-found' | { conflict: BillOfMaterialsReference }> {
  return db.transaction(async (trx) => {
    const candidateQuery = BillOfMaterial.query({ client: trx }).where('publicId', publicId)
    BillOfMaterial.includeDeleted(candidateQuery)
    const candidate = await candidateQuery.first()
    if (!candidate?.deletedAt) return 'not-found'

    if (candidate.kind === 'template' && candidate.productId !== null) {
      await lockProduct(candidate.productId, trx)
    }
    if (candidate.kind === 'implementation') {
      await lockImplementationDestinationForRestoration(candidate, trx)
    }

    const billOfMaterialsQuery = BillOfMaterial.query({ client: trx })
      .where('id', candidate.id)
      .forUpdate()
    BillOfMaterial.includeDeleted(billOfMaterialsQuery)
    const billOfMaterials = await billOfMaterialsQuery.first()
    if (!billOfMaterials?.deletedAt) return 'not-found'

    const conflict = await findRestoreConflict(billOfMaterials, trx)
    if (conflict) return { conflict }

    await billOfMaterials.restore()
    return loadBillOfMaterialsDetail(publicId, trx)
  })
}

async function lockProduct(id: number, trx: TransactionClientContract) {
  const query = Product.query({ client: trx }).where('id', id).forUpdate()
  Product.includeDeleted(query)
  await query.firstOrFail()
}

async function findRestoreConflict(
  billOfMaterials: BillOfMaterial,
  trx: TransactionClientContract
): Promise<BillOfMaterialsReference | null> {
  if (billOfMaterials.kind === 'template') {
    if (billOfMaterials.productId === null) return null
    const occupant = await BillOfMaterial.query({ client: trx })
      .where('kind', 'template')
      .where('productId', billOfMaterials.productId)
      .whereNot('id', billOfMaterials.id)
      .first()
    return occupant ? { id: occupant.publicId, name: occupant.name } : null
  }

  return findImplementationRestorationConflict(billOfMaterials, trx)
}
