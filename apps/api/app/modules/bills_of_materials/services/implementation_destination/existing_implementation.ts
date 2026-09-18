import Product from '#models/product'
import ProductVariant from '#models/product_variant'
import BillOfMaterial from '#modules/bills_of_materials/models/bill_of_material'
import { ImplementationDestinationTypificationConflictError } from '#modules/bills_of_materials/services/implementation_destination/errors'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type { BillOfMaterialsReference } from '@guardiola-foundry/shared-types'

export async function assertImplementationDestinationEditable(
  billOfMaterials: BillOfMaterial,
  trx: TransactionClientContract
) {
  if (billOfMaterials.productVariantId === null) return

  const variantCandidateQuery = ProductVariant.query({ client: trx }).where(
    'id',
    billOfMaterials.productVariantId
  )
  ProductVariant.includeDeleted(variantCandidateQuery)
  const variantCandidate = await variantCandidateQuery.firstOrFail()

  const product = await lockProductIncludingDeleted(variantCandidate.productId, trx)
  const variant = await lockVariantIncludingDeleted(variantCandidate.id, trx)
  if (variant.deletedAt || product.deletedAt) {
    throw new ImplementationDestinationEditUnavailableError()
  }
}

export async function assertImplementationTypificationAvailableForRename(
  billOfMaterials: BillOfMaterial,
  name: string,
  trx: TransactionClientContract
) {
  if (billOfMaterials.productVariantId === null) return

  const variant = await ProductVariant.query({ client: trx })
    .where('id', billOfMaterials.productVariantId)
    .firstOrFail()
  const duplicate = await findProductTypificationOccupant(
    variant.productId,
    name,
    billOfMaterials.id,
    trx
  )
  if (duplicate) throw new ImplementationDestinationTypificationConflictError(duplicate)
}

export async function lockImplementationDestinationForRestoration(
  billOfMaterials: BillOfMaterial,
  trx: TransactionClientContract
) {
  const variantCandidateQuery = ProductVariant.query({ client: trx }).where(
    'id',
    billOfMaterials.productVariantId!
  )
  ProductVariant.includeDeleted(variantCandidateQuery)
  const variantCandidate = await variantCandidateQuery.firstOrFail()

  await lockProductIncludingDeleted(variantCandidate.productId, trx)
  await lockVariantIncludingDeleted(variantCandidate.id, trx)
}

export async function findImplementationRestorationConflict(
  billOfMaterials: BillOfMaterial,
  trx: TransactionClientContract
): Promise<BillOfMaterialsReference | null> {
  const variantQuery = ProductVariant.query({ client: trx }).where(
    'id',
    billOfMaterials.productVariantId!
  )
  ProductVariant.includeDeleted(variantQuery)
  const variant = await variantQuery.firstOrFail()
  const slotOccupant = await findVariantImplementationOccupant(variant.id, billOfMaterials.id, trx)
  if (slotOccupant) return slotOccupant

  return findProductTypificationOccupant(
    variant.productId,
    billOfMaterials.name,
    billOfMaterials.id,
    trx
  )
}

export async function findVariantImplementationOccupant(
  variantId: number,
  excludedImplementationId: number | null,
  trx: TransactionClientContract
): Promise<BillOfMaterialsReference | null> {
  const query = BillOfMaterial.query({ client: trx }).where('productVariantId', variantId)
  if (excludedImplementationId !== null) query.whereNot('id', excludedImplementationId)
  const occupant = await query.first()
  return occupant ? { id: occupant.publicId, name: occupant.name } : null
}

export async function findProductTypificationOccupant(
  productId: number,
  name: string,
  excludedImplementationId: number | null,
  trx: TransactionClientContract
): Promise<BillOfMaterialsReference | null> {
  const query = BillOfMaterial.query({ client: trx })
    .join('product_variants', 'product_variants.id', 'bills_of_materials.product_variant_id')
    .where('product_variants.product_id', productId)
    .whereRaw('lower(bills_of_materials.name) = lower(?)', [name])
    .select('bills_of_materials.public_id', 'bills_of_materials.name')
  if (excludedImplementationId !== null) {
    query.whereNot('bills_of_materials.id', excludedImplementationId)
  }
  const occupant = await query.first()
  return occupant ? { id: occupant.publicId, name: occupant.name } : null
}

async function lockProductIncludingDeleted(id: number, trx: TransactionClientContract) {
  const query = Product.query({ client: trx }).where('id', id).forUpdate()
  Product.includeDeleted(query)
  return query.firstOrFail()
}

async function lockVariantIncludingDeleted(id: number, trx: TransactionClientContract) {
  const query = ProductVariant.query({ client: trx }).where('id', id).forUpdate()
  ProductVariant.includeDeleted(query)
  return query.firstOrFail()
}

export class ImplementationDestinationEditUnavailableError extends Error {}
