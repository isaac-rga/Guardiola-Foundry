import Product from '#models/product'
import ProductVariant from '#models/product_variant'
import { authenticateAs } from '#tests/functional/products/support/product_test_support'
import db from '@adonisjs/lucid/services/db'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Product restoration', (group) => {
  group.each.setup(async () => {
    await testUtils.db('postgres_test').truncate()
  })

  test('restores a deleted Product for Admins and rejects Operator recovery', async ({
    assert,
    client,
  }) => {
    const adminSession = await authenticateAs(client, 'admin')
    const productId = await createProduct(client, adminSession.token, 'Recoverable Sample', {
      lifecycleStatus: 'approved',
      productStatus: 'active',
    })

    const deleteResponse = await client
      .delete(`/products/${productId}`)
      .header('Authorization', `Bearer ${adminSession.token}`)

    deleteResponse.assertStatus(204)

    const operatorSession = await authenticateAs(client, 'operator')
    const forbiddenRestoreResponse = await client
      .post(`/products/${productId}/restore`)
      .header('Authorization', `Bearer ${operatorSession.token}`)

    forbiddenRestoreResponse.assertStatus(403)
    forbiddenRestoreResponse.assertBodyContains({
      message: 'Only admins can restore deleted Products.',
    })

    const restoreResponse = await client
      .post(`/products/${productId}/restore`)
      .header('Authorization', `Bearer ${adminSession.token}`)

    restoreResponse.assertStatus(204)

    const restoredProduct = await db
      .from('products')
      .select(['lifecycle_status', 'product_status', 'deleted_at'])
      .where('public_id', productId)
      .firstOrFail()

    assert.equal(restoredProduct.lifecycle_status, 'approved')
    assert.equal(restoredProduct.product_status, 'inactive')
    assert.isNull(restoredProduct.deleted_at)

    const showResponse = await client
      .get(`/products/${productId}`)
      .header('Authorization', `Bearer ${adminSession.token}`)

    showResponse.assertStatus(200)
    showResponse.assertBodyContains({
      state: 'active',
      product: {
        id: productId,
        lifecycleStatus: 'approved',
        productStatus: 'inactive',
      },
    })
  })

  test('creates an Active Base Variant when restoring an exceptional empty Product', async ({
    client,
  }) => {
    const adminSession = await authenticateAs(client, 'admin')
    const productId = await createProduct(client, adminSession.token, 'Empty recovery sample')

    const deleteResponse = await client
      .delete(`/products/${productId}`)
      .header('Authorization', `Bearer ${adminSession.token}`)

    deleteResponse.assertStatus(204)

    const product = await Product.queryWithDeleted().where('publicId', productId).firstOrFail()
    const existingVariant = await ProductVariant.findByOrFail('productId', product.id)
    await existingVariant.softDelete()

    const restoreResponse = await client
      .post(`/products/${productId}/restore`)
      .header('Authorization', `Bearer ${adminSession.token}`)

    restoreResponse.assertStatus(204)

    const variantsResponse = await client
      .get(`/products/${productId}/variants`)
      .header('Authorization', `Bearer ${adminSession.token}`)

    variantsResponse.assertStatus(200)
    variantsResponse.assertBodyContains({
      variants: [
        {
          productId,
          name: 'Base',
          status: 'active',
          deletedAt: null,
        },
      ],
    })
  })

  test('restores a Product without changing its retained Product Variants', async ({ client }) => {
    const adminSession = await authenticateAs(client, 'admin')
    const productId = await createProduct(client, adminSession.token, 'Retained Variant sample')
    const createVariantResponse = await client
      .post(`/products/${productId}/variants`)
      .header('Authorization', `Bearer ${adminSession.token}`)
      .json({ name: 'Showroom' })

    createVariantResponse.assertStatus(201)

    const beforeDeleteResponse = await client
      .get(`/products/${productId}/variants`)
      .header('Authorization', `Bearer ${adminSession.token}`)

    beforeDeleteResponse.assertStatus(200)

    const deleteResponse = await client
      .delete(`/products/${productId}`)
      .header('Authorization', `Bearer ${adminSession.token}`)

    deleteResponse.assertStatus(204)

    const restoreResponse = await client
      .post(`/products/${productId}/restore`)
      .header('Authorization', `Bearer ${adminSession.token}`)

    restoreResponse.assertStatus(204)

    const afterRestoreResponse = await client
      .get(`/products/${productId}/variants`)
      .header('Authorization', `Bearer ${adminSession.token}`)

    afterRestoreResponse.assertStatus(200)
    afterRestoreResponse.assertBody(beforeDeleteResponse.body())
  })

  test('rolls back the recovery Base when the later Product restoration fails', async ({
    assert,
    client,
  }) => {
    const adminSession = await authenticateAs(client, 'admin')
    const productId = await createProduct(client, adminSession.token, 'Atomic recovery sample')

    const deleteResponse = await client
      .delete(`/products/${productId}`)
      .header('Authorization', `Bearer ${adminSession.token}`)

    deleteResponse.assertStatus(204)

    const product = await Product.queryWithDeleted().where('publicId', productId).firstOrFail()
    const existingVariant = await ProductVariant.findByOrFail('productId', product.id)
    await existingVariant.softDelete()

    await db.rawQuery(`
      CREATE FUNCTION reject_product_recovery() RETURNS trigger AS $$
      BEGIN
        IF OLD.deleted_at IS NOT NULL
          AND NEW.deleted_at IS NULL
          AND EXISTS (
            SELECT 1
            FROM product_variants
            WHERE product_id = NEW.id
              AND name = 'Base'
              AND status = 'active'
              AND deleted_at IS NULL
          ) THEN
          RAISE EXCEPTION 'forced Product restoration failure';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER reject_product_recovery
      BEFORE UPDATE ON products
      FOR EACH ROW EXECUTE FUNCTION reject_product_recovery();
    `)

    try {
      const restoreResponse = await client
        .post(`/products/${productId}/restore`)
        .header('Authorization', `Bearer ${adminSession.token}`)

      restoreResponse.assertStatus(500)
    } finally {
      await db.rawQuery('DROP TRIGGER reject_product_recovery ON products')
      await db.rawQuery('DROP FUNCTION reject_product_recovery()')
    }

    const persistedProduct = await Product.queryWithDeleted()
      .where('publicId', productId)
      .firstOrFail()
    assert.isNotNull(persistedProduct.deletedAt)
    assert.lengthOf(await ProductVariant.query().where('productId', product.id), 0)
  })
})

async function createProduct(
  client: any,
  token: string,
  name: string,
  overrides: { lifecycleStatus?: string; productStatus?: string } = {}
) {
  const response = await client
    .post('/products')
    .header('Authorization', `Bearer ${token}`)
    .json({ name, ...overrides })

  response.assertStatus(201)

  return response.body().id as string
}
