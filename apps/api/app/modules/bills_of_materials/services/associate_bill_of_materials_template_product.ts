import BillOfMaterial from '#modules/bills_of_materials/models/bill_of_material'
import { loadBillOfMaterialsDetail } from '#modules/bills_of_materials/services/read_bills_of_materials'
import { lockTemplateProductSlot } from '#modules/bills_of_materials/services/template_product_slot'
import db from '@adonisjs/lucid/services/db'
import type { BillOfMaterialsDetail } from '@guardiola-foundry/shared-types'

export type AssociateTemplateProductResult =
  | BillOfMaterialsDetail
  | 'template-not-found'
  | 'template-already-associated'
  | 'product-unavailable'
  | { conflict: { id: string; name: string } }

export async function associateBillOfMaterialsTemplateProduct(
  billOfMaterialsPublicId: string,
  productPublicId: string
): Promise<AssociateTemplateProductResult> {
  return db.transaction(async (trx) => {
    const billOfMaterials = await BillOfMaterial.query({ client: trx })
      .where('publicId', billOfMaterialsPublicId)
      .where('kind', 'template')
      .forUpdate()
      .first()

    if (!billOfMaterials) return 'template-not-found'
    if (billOfMaterials.productId !== null) return 'template-already-associated'

    const productSlot = await lockTemplateProductSlot(productPublicId, trx)
    if (productSlot.status === 'unavailable') return 'product-unavailable'
    if (productSlot.status === 'occupied') {
      return { conflict: productSlot.conflictingTemplate }
    }

    billOfMaterials.productId = productSlot.product.id
    billOfMaterials.useTransaction(trx)
    await billOfMaterials.save()
    return loadBillOfMaterialsDetail(billOfMaterials.publicId, trx)
  })
}
