import Product from '#models/product'
import BillOfMaterial from '#modules/bills_of_materials/models/bill_of_material'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

export type TemplateProductSlot =
  | { status: 'available'; product: Product }
  | { status: 'occupied'; conflictingTemplate: { id: string; name: string } }
  | { status: 'unavailable' }

export async function lockTemplateProductSlot(
  productPublicId: string,
  trx: TransactionClientContract
): Promise<TemplateProductSlot> {
  const productQuery = Product.query({ client: trx }).where('publicId', productPublicId).forUpdate()
  Product.includeDeleted(productQuery)
  const product = await productQuery.first()

  if (!product || product.deletedAt !== null || product.productStatus !== 'active') {
    return { status: 'unavailable' }
  }

  const conflictingTemplate = await BillOfMaterial.query({ client: trx })
    .where('productId', product.id)
    .where('kind', 'template')
    .first()

  return conflictingTemplate
    ? {
        status: 'occupied',
        conflictingTemplate: {
          id: conflictingTemplate.publicId,
          name: conflictingTemplate.name,
        },
      }
    : { status: 'available', product }
}
