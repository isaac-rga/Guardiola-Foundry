import Product from '#models/product'
import ProductVariant from '#models/product_variant'
import BillOfMaterial from '#modules/bills_of_materials/models/bill_of_material'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

export async function resolveImplementationDestination(
  productVariantPublicId: string,
  name: string,
  trx: TransactionClientContract,
  expectedProductId?: number
) {
  const candidateQuery = ProductVariant.query({ client: trx }).where(
    'publicId',
    productVariantPublicId
  )
  ProductVariant.includeDeleted(candidateQuery)
  const candidate = await candidateQuery.first()
  if (!candidate || candidate.deletedAt) {
    throw new ImplementationDestinationValidationError(
      'The selected Product Variant is no longer available.'
    )
  }

  const productQuery = Product.query({ client: trx }).where('id', candidate.productId).forUpdate()
  Product.includeDeleted(productQuery)
  const product = await productQuery.firstOrFail()
  const variantQuery = ProductVariant.query({ client: trx }).where('id', candidate.id).forUpdate()
  ProductVariant.includeDeleted(variantQuery)
  const variant = await variantQuery.firstOrFail()

  if (expectedProductId !== undefined && product.id !== expectedProductId) {
    throw new ImplementationDestinationValidationError(
      'Select a Product Variant belonging to the Template Product.'
    )
  }
  if (product.deletedAt || product.productStatus !== 'active') {
    throw new ImplementationDestinationValidationError(
      'The selected Product is no longer available.'
    )
  }
  if (variant.deletedAt || variant.status !== 'active') {
    throw new ImplementationDestinationValidationError(
      'The selected Product Variant is no longer available.'
    )
  }

  const existingImplementation = await BillOfMaterial.query({ client: trx })
    .where('productVariantId', variant.id)
    .first()
  if (existingImplementation) {
    throw new ImplementationDestinationVariantConflictError({
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
    throw new ImplementationDestinationTypificationConflictError({
      id: duplicateTypification.publicId,
      name: duplicateTypification.name,
    })
  }

  return { product, variant }
}

export class ImplementationDestinationValidationError extends Error {}

export class ImplementationDestinationVariantConflictError extends Error {
  constructor(readonly conflictingImplementation: { id: string; name: string }) {
    super(`Product Variant already has ${conflictingImplementation.name}.`)
  }
}

export class ImplementationDestinationTypificationConflictError extends Error {
  constructor(readonly conflictingImplementation: { id: string; name: string }) {
    super('Another BOM Implementation in this Product already uses this typification.')
  }
}
