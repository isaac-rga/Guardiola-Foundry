import Collection from '#models/collection'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

const COLLECTION_NAMES = ['2025', '2026', '2027'] as const

test.group('Products create flow', (group) => {
  group.each.setup(async () => {
    await testUtils.db('postgres_test').truncate()
    await Promise.all(COLLECTION_NAMES.map((name) => Collection.firstOrCreate({ name })))
  })

  test('creates a product with persisted defaults and returns it in the newest-first list', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'admin')

    const createResponse = await client
      .post('/products')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        name: '  Valencia Gown  ',
      })

    createResponse.assertStatus(201)
    createResponse.assertBodyContains({
      name: 'Valencia Gown',
      lifecycleStatus: 'concept',
      productStatus: 'active',
      productCategory: null,
      createdBy: {
        email: 'admin@example.com',
      },
      collection: null,
    })

    assert.match(createResponse.body().id, /^P-[A-Z2-9]{6}$/)
    assert.exists(createResponse.body().createdAt)

    const listResponse = await client
      .get('/products')
      .header('Authorization', `Bearer ${session.token}`)

    listResponse.assertStatus(200)
    listResponse.assertBodyContains({
      products: [
        {
          id: createResponse.body().id,
          name: 'Valencia Gown',
          lifecycleStatus: 'concept',
          productStatus: 'active',
          productCategory: null,
        },
      ],
      collections: [{ name: '2025' }, { name: '2026' }, { name: '2027' }],
    })
  })

  test('allows lifecycle status, product status, and collection overrides during creation', async ({
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const collection = await Collection.findByOrFail('name', '2026')

    const response = await client
      .post('/products')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        name: 'Mila Cape',
        lifecycleStatus: 'testing',
        productStatus: 'inactive',
        collectionId: collection.id,
      })

    response.assertStatus(201)
    response.assertBodyContains({
      name: 'Mila Cape',
      lifecycleStatus: 'testing',
      productStatus: 'inactive',
      productCategory: null,
      collection: {
        id: collection.id,
        name: '2026',
      },
      createdBy: {
        email: 'operator@example.com',
      },
    })
  })

  test('lists products newest first', async ({ assert, client }) => {
    const session = await authenticateAs(client, 'admin')

    const firstResponse = await client
      .post('/products')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        name: 'Aster Dress',
      })

    firstResponse.assertStatus(201)

    const secondResponse = await client
      .post('/products')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        name: 'Bianca Veil',
      })

    secondResponse.assertStatus(201)

    const listResponse = await client
      .get('/products')
      .header('Authorization', `Bearer ${session.token}`)

    listResponse.assertStatus(200)
    assert.equal(listResponse.body().products[0]?.id, secondResponse.body().id)
    assert.equal(listResponse.body().products[1]?.id, firstResponse.body().id)
  })
})

async function authenticateAs(client: any, role: 'admin' | 'operator') {
  await User.firstOrCreate(
    {
      email: `${role}@example.com`,
    },
    {
      password: 'Password123',
      role,
      active: true,
    }
  )

  const response = await client.post('/auth/login').json({
    email: `${role}@example.com`,
    password: 'Password123',
  })

  response.assertStatus(200)

  return response.body() as { token: string }
}
