import { authenticateAs } from '#tests/functional/products/support/product_test_support'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Product catalog', (group) => {
  group.each.setup(async () => {
    await testUtils.db('postgres_test').truncate()
  })

  test('searches Product names with a partial case-insensitive match', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')

    for (const name of ['Zephyr Gown', 'Mini Zephyr Veil', 'Marisol Cape']) {
      const createResponse = await client
        .post('/products')
        .header('Authorization', `Bearer ${session.token}`)
        .json({ name })

      createResponse.assertStatus(201)
    }

    const response = await client
      .get('/products?search=zEpHyR')
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(200)
    assert.sameMembers(
      response.body().products.map((product: { name: string }) => product.name),
      ['Zephyr Gown', 'Mini Zephyr Veil']
    )
  })

  test('treats percent and underscore characters as literal Product-name search text', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')

    for (const name of ['Silk 100% Gown', 'Silk 100X Gown', 'A_B Veil', 'A1B Veil']) {
      const createResponse = await client
        .post('/products')
        .header('Authorization', `Bearer ${session.token}`)
        .json({ name })

      createResponse.assertStatus(201)
    }

    for (const [search, expectedName] of [
      ['%', 'Silk 100% Gown'],
      ['_', 'A_B Veil'],
    ]) {
      const response = await client
        .get(`/products?search=${encodeURIComponent(search)}`)
        .header('Authorization', `Bearer ${session.token}`)

      response.assertStatus(200)
      assert.deepEqual(
        response.body().products.map((product: { name: string }) => product.name),
        [expectedName]
      )
    }
  })

  test('rejects an Operator who explicitly requests deleted Products', async ({ client }) => {
    const session = await authenticateAs(client, 'operator')

    const response = await client
      .get('/products?includeDeleted=true')
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(403)
    response.assertBodyContains({
      message: 'Only Admins can include deleted Products.',
    })
  })

  test('allows an Admin to include deleted Products', async ({ assert, client }) => {
    const session = await authenticateAs(client, 'admin')
    const createResponse = await client
      .post('/products')
      .header('Authorization', `Bearer ${session.token}`)
      .json({ name: 'Archive Sample' })

    createResponse.assertStatus(201)

    const deleteResponse = await client
      .delete(`/products/${createResponse.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)

    deleteResponse.assertStatus(204)

    const response = await client
      .get('/products?includeDeleted=true')
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(200)
    response.assertBodyContains({
      products: [
        {
          id: createResponse.body().id,
          name: 'Archive Sample',
          productStatus: 'inactive',
        },
      ],
    })
    assert.isString(response.body().products[0].deletedAt)
  })

  test('rejects invalid Product catalog query parameters', async ({ client }) => {
    const session = await authenticateAs(client, 'admin')

    const response = await client
      .get('/products?includeDeleted=yes')
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(422)
    response.assertBody({ message: 'Invalid Product filters.' })
  })
})
