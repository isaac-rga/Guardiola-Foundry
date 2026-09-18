import Product from '#models/product'
import ProductVariant from '#models/product_variant'
import {
  isProductAvailable,
  isProductVariantAvailable,
} from '#modules/bills_of_materials/services/implementation_destination/candidate_eligibility'
import {
  ImplementationDestinationTypificationConflictError,
  ImplementationDestinationValidationError,
  ImplementationDestinationVariantConflictError,
} from '#modules/bills_of_materials/services/implementation_destination/errors'
import {
  findProductTypificationOccupant,
  findVariantImplementationOccupant,
} from '#modules/bills_of_materials/services/implementation_destination/existing_implementation'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

export async function reserveManualImplementationDestination(
  productVariantPublicId: string,
  name: string,
  trx: TransactionClientContract
) {
  return reserveImplementationDestination(productVariantPublicId, name, trx)
}

export async function reserveTemplateApplicationDestination(
  productVariantPublicId: string,
  name: string,
  templateProductId: number,
  trx: TransactionClientContract
) {
  return reserveImplementationDestination(productVariantPublicId, name, trx, templateProductId)
}

async function reserveImplementationDestination(
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
  if (product.deletedAt || !isProductAvailable(product.productStatus)) {
    throw new ImplementationDestinationValidationError(
      'The selected Product is no longer available.'
    )
  }
  if (variant.deletedAt || !isProductVariantAvailable(variant.status)) {
    throw new ImplementationDestinationValidationError(
      'The selected Product Variant is no longer available.'
    )
  }

  const existingImplementation = await findVariantImplementationOccupant(variant.id, null, trx)
  if (existingImplementation) {
    throw new ImplementationDestinationVariantConflictError(existingImplementation)
  }

  const duplicateTypification = await findProductTypificationOccupant(product.id, name, null, trx)
  if (duplicateTypification) {
    throw new ImplementationDestinationTypificationConflictError(duplicateTypification)
  }

  return { product, variant }
}
