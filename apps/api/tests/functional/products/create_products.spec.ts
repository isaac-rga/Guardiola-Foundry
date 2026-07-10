import app from '@adonisjs/core/services/app'
import Collection from '#models/collection'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { mkdir, readdir, unlink } from 'node:fs/promises'
import { join } from 'node:path'

const COLLECTION_NAMES = ['2025', '2026', '2027'] as const
const PRODUCT_IMAGE_DIRECTORY = app.makePath('tmp/product-images')

test.group('Products create flow', (group) => {
  group.each.setup(async () => {
    await testUtils.db('postgres_test').truncate()
    await clearStoredProductImages()
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

  test('allows duplicate product names after trimmed and case-insensitive normalization', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'admin')

    const firstResponse = await client
      .post('/products')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        name: 'Valencia Gown',
      })

    firstResponse.assertStatus(201)

    const secondResponse = await client
      .post('/products')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        name: '  valencia gown  ',
      })

    secondResponse.assertStatus(201)
    secondResponse.assertBodyContains({
      name: 'valencia gown',
      lifecycleStatus: 'concept',
      productStatus: 'active',
    })

    const listResponse = await client
      .get('/products')
      .header('Authorization', `Bearer ${session.token}`)

    listResponse.assertStatus(200)
    const productNames = listResponse
      .body()
      .products.map((product: { name: string }) => product.name)

    assert.includeMembers(productNames, ['valencia gown', 'Valencia Gown'])
    assert.isAtLeast(
      productNames.filter((name: string) => name.toLocaleLowerCase() === 'valencia gown').length,
      2
    )
  })

  test('loads a product directly by short id with immutable metadata and editable optional fields', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'admin')
    const collection = await Collection.findByOrFail('name', '2026')

    const createResponse = await client
      .post('/products')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        name: 'Valencia Gown',
        collectionId: collection.id,
      })

    createResponse.assertStatus(201)

    const showResponse = await client
      .get(`/products/${createResponse.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)

    showResponse.assertStatus(200)
    showResponse.assertBodyContains({
      product: {
        id: createResponse.body().id,
        name: 'Valencia Gown',
        shortDescription: null,
        image: null,
        lifecycleStatus: 'concept',
        productStatus: 'active',
        productCategory: null,
        collection: {
          id: collection.id,
          name: '2026',
        },
        createdBy: {
          email: 'admin@example.com',
        },
      },
      collections: [{ name: '2025' }, { name: '2026' }, { name: '2027' }],
    })
    assert.exists(showResponse.body().product.createdAt)
  })

  test('updates editable product fields by short id, keeps optional fields nullable, and trims saved text', async ({
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const collection = await Collection.findByOrFail('name', '2025')

    const createResponse = await client
      .post('/products')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        name: 'Mila Cape',
      })

    createResponse.assertStatus(201)

    const updateResponse = await client
      .put(`/products/${createResponse.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        name: '  Mila Cape Revised  ',
        shortDescription: '  Silk sample for fittings  ',
        lifecycleStatus: 'testing',
        productStatus: 'inactive',
        productCategory: 'dress',
        collectionId: collection.id,
      })

    updateResponse.assertStatus(200)
    updateResponse.assertBodyContains({
      id: createResponse.body().id,
      name: 'Mila Cape Revised',
      shortDescription: 'Silk sample for fittings',
      image: null,
      lifecycleStatus: 'testing',
      productStatus: 'inactive',
      productCategory: 'dress',
      collection: {
        id: collection.id,
        name: '2025',
      },
      createdBy: {
        email: 'operator@example.com',
      },
    })

    const clearOptionalFieldsResponse = await client
      .put(`/products/${createResponse.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        name: 'Mila Cape Revised',
        shortDescription: null,
        lifecycleStatus: 'approved',
        productStatus: 'active',
        productCategory: null,
        collectionId: null,
      })

    clearOptionalFieldsResponse.assertStatus(200)
    clearOptionalFieldsResponse.assertBodyContains({
      id: createResponse.body().id,
      shortDescription: null,
      image: null,
      lifecycleStatus: 'approved',
      productStatus: 'active',
      productCategory: null,
      collection: null,
    })
  })

  test('uploads one product image, persists it on reload, and removes it back to a no-image state', async ({
    client,
  }) => {
    const session = await authenticateAs(client, 'admin')

    const createResponse = await client
      .post('/products')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        name: 'Celeste Gown',
      })

    createResponse.assertStatus(201)

    const uploadResponse = await client
      .put(`/products/${createResponse.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)
      .fields({
        name: 'Celeste Gown',
        shortDescription: '',
        lifecycleStatus: 'concept',
        productStatus: 'active',
        productCategory: '',
        collectionId: '',
      })
      .file('image', tinyPngBuffer(), {
        filename: 'celeste-gown.png',
        contentType: 'image/png',
      })

    uploadResponse.assertStatus(200)
    uploadResponse.assertBodyContains({
      id: createResponse.body().id,
      image: {
        fileName: 'celeste-gown.png',
      },
    })

    const persistedResponse = await client
      .get(`/products/${createResponse.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)

    persistedResponse.assertStatus(200)
    persistedResponse.assertBodyContains({
      product: {
        id: createResponse.body().id,
        image: {
          fileName: 'celeste-gown.png',
        },
      },
    })

    const removeResponse = await client
      .put(`/products/${createResponse.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)
      .fields({
        name: 'Celeste Gown',
        shortDescription: '',
        lifecycleStatus: 'concept',
        productStatus: 'active',
        productCategory: '',
        collectionId: '',
        removeImage: 'true',
      })

    removeResponse.assertStatus(200)
    removeResponse.assertBodyContains({
      id: createResponse.body().id,
      image: null,
    })

    const clearedResponse = await client
      .get(`/products/${createResponse.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)

    clearedResponse.assertStatus(200)
    clearedResponse.assertBodyContains({
      product: {
        id: createResponse.body().id,
        image: null,
      },
    })
  })

  test('soft deletes a product, forces it inactive, and hides it from the default list', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'admin')

    const createResponse = await client
      .post('/products')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        name: 'Valencia Gown',
        productStatus: 'active',
      })

    createResponse.assertStatus(201)

    const deleteResponse = await client
      .delete(`/products/${createResponse.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)

    deleteResponse.assertStatus(204)

    const deletedProduct = await db
      .from('products')
      .select(['product_status', 'deleted_at'])
      .where('public_id', createResponse.body().id)
      .firstOrFail()

    assert.equal(deletedProduct.product_status, 'inactive')
    assert.isNotNull(deletedProduct.deleted_at)

    const listResponse = await client
      .get('/products')
      .header('Authorization', `Bearer ${session.token}`)

    listResponse.assertStatus(200)
    assert.notInclude(
      listResponse.body().products.map((product: { id: string }) => product.id),
      createResponse.body().id
    )
  })

  test('only admins can opt into deleted Products on the list', async ({ assert, client }) => {
    const adminSession = await authenticateAs(client, 'admin')

    const createResponse = await client
      .post('/products')
      .header('Authorization', `Bearer ${adminSession.token}`)
      .json({
        name: 'Archive Sample',
      })

    createResponse.assertStatus(201)

    const deleteResponse = await client
      .delete(`/products/${createResponse.body().id}`)
      .header('Authorization', `Bearer ${adminSession.token}`)

    deleteResponse.assertStatus(204)

    const adminIncludedResponse = await client
      .get('/products?includeDeleted=true')
      .header('Authorization', `Bearer ${adminSession.token}`)

    adminIncludedResponse.assertStatus(200)
    adminIncludedResponse.assertBodyContains({
      products: [
        {
          id: createResponse.body().id,
          name: 'Archive Sample',
          productStatus: 'inactive',
        },
      ],
    })
    assert.isString(adminIncludedResponse.body().products[0].deletedAt)

    const operatorSession = await authenticateAs(client, 'operator')

    const operatorIncludedResponse = await client
      .get('/products?includeDeleted=true')
      .header('Authorization', `Bearer ${operatorSession.token}`)

    operatorIncludedResponse.assertStatus(200)
    assert.notInclude(
      operatorIncludedResponse.body().products.map((product: { id: string }) => product.id),
      createResponse.body().id
    )
  })

  test('restores a deleted Product for admins and rejects non-admin recovery', async ({
    assert,
    client,
  }) => {
    const adminSession = await authenticateAs(client, 'admin')

    const createResponse = await client
      .post('/products')
      .header('Authorization', `Bearer ${adminSession.token}`)
      .json({
        name: 'Recoverable Sample',
        lifecycleStatus: 'approved',
        productStatus: 'active',
      })

    createResponse.assertStatus(201)

    const deleteResponse = await client
      .delete(`/products/${createResponse.body().id}`)
      .header('Authorization', `Bearer ${adminSession.token}`)

    deleteResponse.assertStatus(204)

    const operatorSession = await authenticateAs(client, 'operator')
    const forbiddenRestoreResponse = await client
      .post(`/products/${createResponse.body().id}/restore`)
      .header('Authorization', `Bearer ${operatorSession.token}`)

    forbiddenRestoreResponse.assertStatus(403)
    forbiddenRestoreResponse.assertBodyContains({
      message: 'Only admins can restore deleted Products.',
    })

    const restoreResponse = await client
      .post(`/products/${createResponse.body().id}/restore`)
      .header('Authorization', `Bearer ${adminSession.token}`)

    restoreResponse.assertStatus(204)

    const restoredProduct = await db
      .from('products')
      .select(['lifecycle_status', 'product_status', 'deleted_at'])
      .where('public_id', createResponse.body().id)
      .firstOrFail()

    assert.equal(restoredProduct.lifecycle_status, 'approved')
    assert.equal(restoredProduct.product_status, 'inactive')
    assert.isNull(restoredProduct.deleted_at)

    const showResponse = await client
      .get(`/products/${createResponse.body().id}`)
      .header('Authorization', `Bearer ${adminSession.token}`)

    showResponse.assertStatus(200)
    showResponse.assertBodyContains({
      state: 'active',
      product: {
        id: createResponse.body().id,
        lifecycleStatus: 'approved',
        productStatus: 'inactive',
      },
    })
  })

  test('returns a deleted Product state for deleted records and 404 for nonexistent Product IDs', async ({
    client,
  }) => {
    const session = await authenticateAs(client, 'admin')

    const createResponse = await client
      .post('/products')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        name: 'Retired Sample',
      })

    createResponse.assertStatus(201)

    const deleteResponse = await client
      .delete(`/products/${createResponse.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)

    deleteResponse.assertStatus(204)

    const deletedResponse = await client
      .get(`/products/${createResponse.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)

    deletedResponse.assertStatus(200)
    deletedResponse.assertBodyContains({
      state: 'deleted',
      product: {
        id: createResponse.body().id,
        name: 'Retired Sample',
        productStatus: 'inactive',
      },
    })

    const missingResponse = await client
      .get('/products/P-MISSING')
      .header('Authorization', `Bearer ${session.token}`)

    missingResponse.assertStatus(404)
    missingResponse.assertBodyContains({
      message: 'Product not found.',
    })
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

async function clearStoredProductImages() {
  await mkdir(PRODUCT_IMAGE_DIRECTORY, { recursive: true })

  const fileNames = await readdir(PRODUCT_IMAGE_DIRECTORY)

  await Promise.all(fileNames.map((fileName) => unlink(join(PRODUCT_IMAGE_DIRECTORY, fileName))))
}

function tinyPngBuffer() {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6SxZkAAAAASUVORK5CYII=',
    'base64'
  )
}
