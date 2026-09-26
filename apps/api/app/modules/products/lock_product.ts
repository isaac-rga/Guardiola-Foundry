import Product from '#models/product'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

export async function lockProductIncludingDeleted(
  productPublicId: string,
  trx: TransactionClientContract
) {
  const productQuery = Product.query({ client: trx }).where('publicId', productPublicId).forUpdate()
  Product.includeDeleted(productQuery)

  return productQuery.first()
}
