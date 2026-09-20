import Product from '#models/product'
import ProductVariant from '#models/product_variant'
import { authenticateAs } from '#tests/functional/products/support/product_test_support'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Product Variants', (group) => {
  group.each.setup(async () => {
    await testUtils.db('postgres_test').truncate()
  })

  test('treats the initial Base as a normal renamable Product Variant', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, session.token, 'Jackie')
    const initialListResponse = await client
      .get(`/products/${productId}/variants`)
      .header('Authorization', `Bearer ${session.token}`)

    initialListResponse.assertStatus(200)
    initialListResponse.assertBodyContains({
      variants: [{ productId, name: 'Base', status: 'active', deletedAt: null }],
    })
    const initialVariant = initialListResponse.body().variants[0]

    const updateResponse = await client
      .put(`/products/${productId}/variants/${initialVariant.id}`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({ name: 'Jackie Foundation', status: 'inactive' })

    updateResponse.assertStatus(200)
    updateResponse.assertBodyContains({
      id: initialVariant.id,
      productId,
      name: 'Jackie Foundation',
      status: 'inactive',
    })

    const createResponse = await client
      .post(`/products/${productId}/variants`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({ name: '  Jackie Showroom  ' })

    createResponse.assertStatus(201)
    createResponse.assertBodyContains({
      productId,
      name: 'Jackie Showroom',
      status: 'active',
    })
    assert.match(createResponse.body().id, /^PV-[A-Z2-9]{6}$/)

    const persistedVariant = await ProductVariant.findByOrFail('publicId', createResponse.body().id)

    assert.equal(persistedVariant.productId, await getProductDatabaseId(productId))

    const deletedVariant = await ProductVariant.create({
      publicId: 'PV-DELETE',
      productId: persistedVariant.productId,
      name: 'Deleted Variant',
      status: 'inactive',
    })
    await deletedVariant.softDelete()

    const listResponse = await client
      .get(`/products/${productId}/variants`)
      .header('Authorization', `Bearer ${session.token}`)

    listResponse.assertStatus(200)
    listResponse.assertBody({ variants: [updateResponse.body(), createResponse.body()] })
  })

  test('renames and changes Variant status without changing identity or Product ownership', async ({
    client,
  }) => {
    const session = await authenticateAs(client, 'admin')
    const productId = await createProduct(client, session.token, 'Jackie')
    const otherProductId = await createProduct(client, session.token, 'Paloma')
    const variant = await createVariant(client, session.token, productId, 'Jackie Showroom')

    const updateResponse = await client
      .put(`/products/${productId}/variants/${variant.id}`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({ name: 'Jackie Boutique', status: 'inactive' })

    updateResponse.assertStatus(200)
    updateResponse.assertBodyContains({
      id: variant.id,
      productId,
      name: 'Jackie Boutique',
      status: 'inactive',
    })

    const crossProductResponse = await client
      .put(`/products/${otherProductId}/variants/${variant.id}`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({ name: 'Moved Variant', status: 'active' })

    crossProductResponse.assertStatus(404)
    crossProductResponse.assertBodyContains({ message: 'Product Variant not found.' })

    const originalProductList = await client
      .get(`/products/${productId}/variants`)
      .header('Authorization', `Bearer ${session.token}`)

    originalProductList.assertBodyContains({
      variants: [
        {
          id: variant.id,
          productId,
          name: 'Jackie Boutique',
          status: 'inactive',
        },
      ],
    })
  })

  test('enforces case-insensitive names within one Product while allowing them across Products', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'admin')
    const productId = await createProduct(client, session.token, 'Jackie')
    const otherProductId = await createProduct(client, session.token, 'Paloma')
    const firstVariant = await createVariant(client, session.token, productId, 'Showroom')

    const duplicateCreateResponse = await client
      .post(`/products/${productId}/variants`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({ name: '  showroom  ' })

    duplicateCreateResponse.assertStatus(422)
    duplicateCreateResponse.assertBodyContains({
      errors: {
        name: ['Another Product Variant in this Product already uses this name.'],
      },
    })

    const secondVariant = await createVariant(client, session.token, productId, 'Boutique')
    const duplicateUpdateResponse = await client
      .put(`/products/${productId}/variants/${secondVariant.id}`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({ name: 'SHOWROOM', status: 'inactive' })

    duplicateUpdateResponse.assertStatus(422)
    duplicateUpdateResponse.assertBodyContains({
      errors: {
        name: ['Another Product Variant in this Product already uses this name.'],
      },
    })

    const otherProductVariant = await createVariant(
      client,
      session.token,
      otherProductId,
      'showroom'
    )

    assert.equal(otherProductVariant.productId, otherProductId)
    assert.equal(firstVariant.productId, productId)
  })

  test('rejects registration for inactive and soft-deleted Products regardless of lifecycle', async ({
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const inactiveProductId = await createProduct(client, session.token, 'Inactive Jackie')

    const inactiveProductResponse = await client
      .put(`/products/${inactiveProductId}`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        name: 'Inactive Jackie',
        shortDescription: null,
        lifecycleStatus: 'testing',
        productStatus: 'inactive',
        productCategory: null,
        collectionId: null,
      })

    inactiveProductResponse.assertStatus(200)

    const inactiveCreateResponse = await client
      .post(`/products/${inactiveProductId}/variants`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({ name: 'Entered name stays actionable' })

    inactiveCreateResponse.assertStatus(422)
    inactiveCreateResponse.assertBodyContains({
      errors: {
        productId: ['Product Variants can only be added to an active Product.'],
      },
    })

    const deletedProductId = await createProduct(client, session.token, 'Deleted Jackie')

    const deleteResponse = await client
      .delete(`/products/${deletedProductId}`)
      .header('Authorization', `Bearer ${session.token}`)

    deleteResponse.assertStatus(204)

    const deletedCreateResponse = await client
      .post(`/products/${deletedProductId}/variants`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({ name: 'Another entered name' })

    deletedCreateResponse.assertStatus(422)
    deletedCreateResponse.assertBodyContains({
      errors: {
        productId: ['Product Variants can only be added to an active Product.'],
      },
    })
  })

  test('rejects Product Variant names that exceed the persisted length limit', async ({
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, session.token, 'Jackie')

    const response = await client
      .post(`/products/${productId}/variants`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({ name: 'V'.repeat(256) })

    response.assertStatus(422)
    response.assertBodyContains({
      errors: {
        name: ['Product Variant name must be 255 characters or fewer.'],
      },
    })
  })

  test('soft deletes a Product Variant and lets an Admin inspect the preserved record', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, session.token, 'Jackie')
    const variant = await createVariant(client, session.token, productId, 'Jackie Showroom')
    const initialListResponse = await client
      .get(`/products/${productId}/variants`)
      .header('Authorization', `Bearer ${session.token}`)
    const baseVariant = initialListResponse.body().variants[0]

    const deleteResponse = await client
      .delete(`/products/${productId}/variants/${variant.id}`)
      .header('Authorization', `Bearer ${session.token}`)

    deleteResponse.assertStatus(204)

    const ordinaryListResponse = await client
      .get(`/products/${productId}/variants`)
      .header('Authorization', `Bearer ${session.token}`)

    ordinaryListResponse.assertStatus(200)
    ordinaryListResponse.assertBody({ variants: [baseVariant] })

    const operatorRecoveryListResponse = await client
      .get(`/products/${productId}/variants?includeDeleted=true`)
      .header('Authorization', `Bearer ${session.token}`)

    operatorRecoveryListResponse.assertStatus(200)
    operatorRecoveryListResponse.assertBody({ variants: [baseVariant] })

    const adminSession = await authenticateAs(client, 'admin')
    const recoveryListResponse = await client
      .get(`/products/${productId}/variants?includeDeleted=true`)
      .header('Authorization', `Bearer ${adminSession.token}`)

    recoveryListResponse.assertStatus(200)
    const deletedVariant = recoveryListResponse
      .body()
      .variants.find((candidate: { id: string }) => candidate.id === variant.id)
    assert.deepInclude(deletedVariant, {
      id: variant.id,
      productId,
      name: 'Jackie Showroom',
      status: 'active',
    })
    assert.isString(deletedVariant.deletedAt)
  })

  test('rejects deletion of the last non-deleted Product Variant', async ({ client }) => {
    const session = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, session.token, 'Jackie')
    const variantsResponse = await client
      .get(`/products/${productId}/variants`)
      .header('Authorization', `Bearer ${session.token}`)
    const baseVariant = variantsResponse.body().variants[0]

    const deleteResponse = await client
      .delete(`/products/${productId}/variants/${baseVariant.id}`)
      .header('Authorization', `Bearer ${session.token}`)

    deleteResponse.assertStatus(422)
    deleteResponse.assertBody({
      message: 'Create another Product Variant before deleting this one.',
    })

    const preservedVariantsResponse = await client
      .get(`/products/${productId}/variants`)
      .header('Authorization', `Bearer ${session.token}`)

    preservedVariantsResponse.assertStatus(200)
    preservedVariantsResponse.assertBody({ variants: [baseVariant] })
  })

  test('protects the last Product Variant while its Product is soft-deleted', async ({
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, session.token, 'Deleted Jackie')
    const variantsResponse = await client
      .get(`/products/${productId}/variants`)
      .header('Authorization', `Bearer ${session.token}`)
    const baseVariant = variantsResponse.body().variants[0]

    const deleteProductResponse = await client
      .delete(`/products/${productId}`)
      .header('Authorization', `Bearer ${session.token}`)

    deleteProductResponse.assertStatus(204)

    const deleteVariantResponse = await client
      .delete(`/products/${productId}/variants/${baseVariant.id}`)
      .header('Authorization', `Bearer ${session.token}`)

    deleteVariantResponse.assertStatus(422)
    deleteVariantResponse.assertBody({
      message: 'Create another Product Variant before deleting this one.',
    })

    const preservedVariantsResponse = await client
      .get(`/products/${productId}/variants`)
      .header('Authorization', `Bearer ${session.token}`)

    preservedVariantsResponse.assertBody({ variants: [baseVariant] })
  })

  test('serializes competing deletions so one non-deleted Product Variant remains', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, session.token, 'Concurrent Jackie')
    const replacement = await createVariant(client, session.token, productId, 'Showroom')
    const variantsResponse = await client
      .get(`/products/${productId}/variants`)
      .header('Authorization', `Bearer ${session.token}`)
    const baseVariant = variantsResponse
      .body()
      .variants.find((variant: { name: string }) => variant.name === 'Base')

    const responses = await Promise.all([
      client
        .delete(`/products/${productId}/variants/${baseVariant.id}`)
        .header('Authorization', `Bearer ${session.token}`),
      client
        .delete(`/products/${productId}/variants/${replacement.id}`)
        .header('Authorization', `Bearer ${session.token}`),
    ])

    assert.deepEqual(responses.map((response) => response.status()).sort(), [204, 422])

    const remainingVariantsResponse = await client
      .get(`/products/${productId}/variants`)
      .header('Authorization', `Bearer ${session.token}`)

    remainingVariantsResponse.assertStatus(200)
    assert.lengthOf(remainingVariantsResponse.body().variants, 1)
  })

  test('allows only an Admin to restore a Product Variant without changing its ownership', async ({
    client,
  }) => {
    const adminSession = await authenticateAs(client, 'admin')
    const productId = await createProduct(client, adminSession.token, 'Jackie')
    const variant = await createVariant(client, adminSession.token, productId, 'Jackie Showroom')

    await client
      .delete(`/products/${productId}/variants/${variant.id}`)
      .header('Authorization', `Bearer ${adminSession.token}`)

    const operatorSession = await authenticateAs(client, 'operator')
    const forbiddenRestoreResponse = await client
      .post(`/products/${productId}/variants/${variant.id}/restore`)
      .header('Authorization', `Bearer ${operatorSession.token}`)

    forbiddenRestoreResponse.assertStatus(403)
    forbiddenRestoreResponse.assertBody({
      message: 'Only Admins can restore deleted Product Variants.',
    })

    const restoreResponse = await client
      .post(`/products/${productId}/variants/${variant.id}/restore`)
      .header('Authorization', `Bearer ${adminSession.token}`)

    restoreResponse.assertStatus(200)
    restoreResponse.assertBodyContains({
      id: variant.id,
      productId,
      name: 'Jackie Showroom',
      status: 'active',
      deletedAt: null,
    })

    const ordinaryListResponse = await client
      .get(`/products/${productId}/variants`)
      .header('Authorization', `Bearer ${operatorSession.token}`)

    ordinaryListResponse.assertStatus(200)
    ordinaryListResponse.assertBodyContains({
      variants: [{ id: variant.id, productId, name: 'Jackie Showroom' }],
    })
  })

  test('preserves a deleted Variant and blocks its name conflict while the Product is unavailable', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'admin')
    const productId = await createProduct(client, session.token, 'Jackie')
    const deletedVariant = await createVariant(client, session.token, productId, 'Jackie Showroom')

    await client
      .delete(`/products/${productId}/variants/${deletedVariant.id}`)
      .header('Authorization', `Bearer ${session.token}`)

    const replacement = await createVariant(client, session.token, productId, 'jackie showroom')

    const inactivateProductResponse = await client
      .put(`/products/${productId}`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        name: 'Jackie',
        shortDescription: null,
        lifecycleStatus: 'concept',
        productStatus: 'inactive',
        productCategory: null,
        collectionId: null,
      })

    inactivateProductResponse.assertStatus(200)

    const restoreResponse = await client
      .post(`/products/${productId}/variants/${deletedVariant.id}/restore`)
      .header('Authorization', `Bearer ${session.token}`)

    restoreResponse.assertStatus(422)
    restoreResponse.assertBody({
      errors: {
        name: ['Restore blocked: another Product Variant in this Product already uses this name.'],
      },
    })

    const recoveryListResponse = await client
      .get(`/products/${productId}/variants?includeDeleted=true`)
      .header('Authorization', `Bearer ${session.token}`)

    const variants = recoveryListResponse.body().variants as Array<{
      id: string
      name: string
      productId: string
      deletedAt: string | null
    }>
    const preservedVariant = variants.find((variant) => variant.id === deletedVariant.id)

    assert.deepInclude(preservedVariant, {
      id: deletedVariant.id,
      name: 'Jackie Showroom',
      productId,
    })
    assert.isString(preservedVariant?.deletedAt)
    assert.deepInclude(
      variants.find((variant) => variant.id === replacement.id),
      { id: replacement.id, name: 'jackie showroom', productId, deletedAt: null }
    )
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

async function createVariant(client: any, token: string, productId: string, name: string) {
  const response = await client
    .post(`/products/${productId}/variants`)
    .header('Authorization', `Bearer ${token}`)
    .json({ name })

  response.assertStatus(201)

  return response.body() as {
    id: string
    productId: string
    name: string
    status: 'active' | 'inactive'
  }
}

async function getProductDatabaseId(productId: string) {
  const product = await Product.findByOrFail('publicId', productId)

  return product.id
}
