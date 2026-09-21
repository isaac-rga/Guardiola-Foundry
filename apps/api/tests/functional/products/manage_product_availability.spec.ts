import Product from '#models/product'
import ProductVariant from '#models/product_variant'
import { authenticateAs } from '#tests/functional/products/support/product_test_support'
import db from '@adonisjs/lucid/services/db'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Product availability', (group) => {
  group.each.setup(async () => {
    await testUtils.db('postgres_test').truncate()
  })

  test('inactivates only the Product when the Variant choice is omitted', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, session.token, 'Jackie')

    const response = await client
      .post(`/products/${productId}/inactivate`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({})

    response.assertStatus(200)
    response.assertBodyContains({ id: productId, productStatus: 'inactive' })

    const product = await Product.findByOrFail('publicId', productId)
    const variants = await ProductVariant.query().where('productId', product.id)

    assert.equal(product.productStatus, 'inactive')
    assert.deepEqual(
      variants.map((variant) => variant.status),
      ['active']
    )
  })

  test('inactivates every currently Active Variant and leaves Inactive Variants unchanged', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'admin')
    const productId = await createProduct(client, session.token, 'Paloma')
    const product = await Product.findByOrFail('publicId', productId)
    const initialVariant = await ProductVariant.findByOrFail('productId', product.id)

    initialVariant.status = 'inactive'
    await initialVariant.save()

    const activeVariant = await ProductVariant.create({
      publicId: 'PV-ACTIVE',
      productId: product.id,
      name: 'Showroom',
      status: 'active',
    })

    const response = await client
      .post(`/products/${productId}/inactivate`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({ inactivateVariants: true })

    response.assertStatus(200)
    response.assertBodyContains({ id: productId, productStatus: 'inactive' })

    await product.refresh()
    await initialVariant.refresh()
    await activeVariant.refresh()
    assert.equal(product.productStatus, 'inactive')
    assert.equal(initialVariant.status, 'inactive')
    assert.equal(activeVariant.status, 'inactive')
  })

  test('bulk inactivation evaluates Active Variants after it acquires the Product lock', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'admin')
    const productId = await createProduct(client, session.token, 'Current State')
    const product = await Product.findByOrFail('publicId', productId)
    const gateLockId = 903202
    const gate = await db.transaction()
    let gateReleased = false

    await gate.rawQuery(`SELECT pg_advisory_xact_lock(${gateLockId})`)
    await db.rawQuery(`
      CREATE FUNCTION block_current_variant_insert() RETURNS trigger AS $$
      BEGIN
        IF NEW.name = 'Current Active Variant' THEN
          PERFORM pg_advisory_xact_lock(${gateLockId});
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER block_current_variant_insert
      BEFORE INSERT ON product_variants
      FOR EACH ROW EXECUTE FUNCTION block_current_variant_insert();
    `)

    const variantRequest = client
      .post(`/products/${productId}/variants`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({ name: 'Current Active Variant' })
      .then((response) => response)

    try {
      await waitForDatabaseCondition(async () => {
        const result = await db.rawQuery(`
          SELECT count(*)::int AS waiting_count
          FROM pg_locks
          WHERE locktype = 'advisory'
            AND granted = false
        `)

        return result.rows[0].waiting_count > 0
      })

      const inactivationRequest = client
        .post(`/products/${productId}/inactivate`)
        .header('Authorization', `Bearer ${session.token}`)
        .json({ inactivateVariants: true })
        .then((response) => response)

      await waitForDatabaseCondition(async () => {
        const result = await db.rawQuery(`
          SELECT count(*)::int AS waiting_count
          FROM pg_stat_activity
          WHERE datname = current_database()
            AND pid <> pg_backend_pid()
            AND wait_event_type = 'Lock'
            AND query LIKE '%"products"%'
        `)

        return result.rows[0].waiting_count > 0
      })

      await gate.commit()
      gateReleased = true

      const variantResponse = await variantRequest
      const inactivationResponse = await inactivationRequest

      variantResponse.assertStatus(201)
      inactivationResponse.assertStatus(200)

      const currentVariant = await ProductVariant.findByOrFail(
        'publicId',
        variantResponse.body().id
      )

      await product.refresh()
      assert.equal(product.productStatus, 'inactive')
      assert.equal(currentVariant.status, 'inactive')
    } finally {
      if (!gateReleased) {
        await gate.rollback()
      }

      await variantRequest.catch(() => undefined)
      await db.rawQuery('DROP TRIGGER IF EXISTS block_current_variant_insert ON product_variants')
      await db.rawQuery('DROP FUNCTION IF EXISTS block_current_variant_insert()')
    }
  })

  test('activates only the Product when every Variant is Inactive', async ({ assert, client }) => {
    const session = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, session.token, 'Mila')
    const product = await Product.findByOrFail('publicId', productId)
    const variant = await ProductVariant.findByOrFail('productId', product.id)

    product.productStatus = 'inactive'
    variant.status = 'inactive'
    await product.save()
    await variant.save()

    const response = await client
      .post(`/products/${productId}/activate`)
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(200)
    response.assertBodyContains({ id: productId, productStatus: 'active' })

    await product.refresh()
    await variant.refresh()
    assert.equal(product.productStatus, 'active')
    assert.equal(variant.status, 'inactive')
  })

  test('keeps repeated availability transitions idempotent without broadening their effect', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'admin')
    const productId = await createProduct(client, session.token, 'Aster')
    const product = await Product.findByOrFail('publicId', productId)
    const variant = await ProductVariant.findByOrFail('productId', product.id)

    for (const payload of [{ inactivateVariants: true }, {}]) {
      const response = await client
        .post(`/products/${productId}/inactivate`)
        .header('Authorization', `Bearer ${session.token}`)
        .json(payload)

      response.assertStatus(200)
    }

    await variant.refresh()
    variant.status = 'active'
    await variant.save()

    const productOnlyRepeat = await client
      .post(`/products/${productId}/inactivate`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({})

    productOnlyRepeat.assertStatus(200)
    await variant.refresh()
    assert.equal(variant.status, 'active')

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await client
        .post(`/products/${productId}/activate`)
        .header('Authorization', `Bearer ${session.token}`)

      response.assertStatus(200)
    }

    await product.refresh()
    await variant.refresh()
    assert.equal(product.productStatus, 'active')
    assert.equal(variant.status, 'active')
  })

  test('requires authentication for both availability actions', async ({ client }) => {
    const response = await client.post('/products/P-MISSING/inactivate').json({})
    response.assertStatus(401)

    const activationResponse = await client.post('/products/P-MISSING/activate')
    activationResponse.assertStatus(401)
  })

  test('rolls back Variant changes when Product inactivation fails', async ({ assert, client }) => {
    const session = await authenticateAs(client, 'admin')
    const productId = await createProduct(client, session.token, 'Celeste')
    const product = await Product.findByOrFail('publicId', productId)
    const variant = await ProductVariant.findByOrFail('productId', product.id)

    await db.rawQuery(`
      CREATE FUNCTION reject_product_inactivation() RETURNS trigger AS $$
      BEGIN
        IF NEW.product_status = 'inactive' THEN
          RAISE EXCEPTION 'forced Product inactivation failure';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER reject_product_inactivation
      BEFORE UPDATE ON products
      FOR EACH ROW EXECUTE FUNCTION reject_product_inactivation();
    `)

    try {
      const response = await client
        .post(`/products/${productId}/inactivate`)
        .header('Authorization', `Bearer ${session.token}`)
        .json({ inactivateVariants: true })

      response.assertStatus(500)
    } finally {
      await db.rawQuery('DROP TRIGGER reject_product_inactivation ON products')
      await db.rawQuery('DROP FUNCTION reject_product_inactivation()')
    }

    await product.refresh()
    await variant.refresh()
    assert.equal(product.productStatus, 'active')
    assert.equal(variant.status, 'active')
  })
})

async function createProduct(client: any, token: string, name: string) {
  const response = await client
    .post('/products')
    .header('Authorization', `Bearer ${token}`)
    .json({ name })

  response.assertStatus(201)

  return response.body().id as string
}

async function waitForDatabaseCondition(condition: () => Promise<boolean>) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (await condition()) {
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 10))
  }

  throw new Error('Timed out while waiting for concurrent database transactions.')
}
