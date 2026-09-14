import BillOfMaterial from '#modules/bills_of_materials/models/bill_of_material'
import {
  authenticateAs,
  createProduct,
  createProductVariant,
  updateProductVariant,
  createImplementation,
} from '#tests/functional/bills_of_materials/support/bom_test_support'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Bills of Materials', (group) => {
  group.each.setup(() => testUtils.db('postgres_test').truncate())

  test('creates an unassociated Template with immutable creation metadata', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'admin')

    const response = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'template',
        name: '  Jackie base construction  ',
        description: '  Reusable starting point  ',
      })

    response.assertStatus(201)
    response.assertBodyContains({
      kind: 'template',
      name: 'Jackie base construction',
      description: 'Reusable starting point',
      createdBy: { id: session.userId, email: 'admin@example.com' },
    })
    assert.match(response.body().id, /^BOM-[A-Z2-9]{6}$/)
    assert.isString(response.body().createdAt)
    assert.isString(response.body().updatedAt)
    assert.isAtLeast(Date.parse(response.body().updatedAt), Date.parse(response.body().createdAt))
    assert.isNull(response.body().product)
  })

  test('creates a Product-associated Template and exposes immutable Product context', async ({
    client,
  }) => {
    const session = await authenticateAs(client, 'admin')
    const productId = await createProduct(client, session.token, 'Jackie', {
      lifecycleStatus: 'finished',
    })

    const response = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'template',
        name: 'Jackie base construction',
        description: null,
        productId,
      })

    response.assertStatus(201)
    response.assertBodyContains({
      product: { id: productId, name: 'Jackie', availability: 'available' },
    })

    const reloaded = await client
      .get(`/bills-of-materials/${response.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)

    reloaded.assertStatus(200)
    reloaded.assertBodyContains({
      product: { id: productId, name: 'Jackie', availability: 'available' },
    })
  })

  test('creates a manual Implementation for a Product Variant with no lines or origin', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, session.token, 'Jackie')
    const variantId = await createProductVariant(
      client,
      session.token,
      productId,
      'Jackie Showroom'
    )

    const response = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'implementation',
        name: '  Jackie - Blush - Chapel Train  ',
        description: '  Manual construction  ',
        productVariantId: variantId,
        lines: [],
      })

    response.assertStatus(201)
    response.assertBodyContains({
      kind: 'implementation',
      name: 'Jackie - Blush - Chapel Train',
      description: 'Manual construction',
      product: { id: productId, name: 'Jackie', availability: 'available' },
      productVariant: {
        id: variantId,
        name: 'Jackie Showroom',
        availability: 'available',
      },
      origin: null,
      lines: [],
    })

    const persisted = await BillOfMaterial.findByOrFail('publicId', response.body().id)
    assert.isNull(persisted.productId)
    assert.isNumber(persisted.productVariantId)
  })

  test('scopes case-insensitive BOM Typification uniqueness to one Product', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const jackieId = await createProduct(client, session.token, 'Jackie')
    const jackieShowroomId = await createProductVariant(client, session.token, jackieId, 'Showroom')
    const jackieEditorialId = await createProductVariant(
      client,
      session.token,
      jackieId,
      'Editorial'
    )
    const palomaId = await createProduct(client, session.token, 'Paloma')
    const palomaShowroomId = await createProductVariant(client, session.token, palomaId, 'Showroom')
    await createImplementation(client, session.token, jackieShowroomId, 'Blush construction')

    const duplicate = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'implementation',
        name: 'BLUSH CONSTRUCTION',
        description: null,
        productVariantId: jackieEditorialId,
        lines: [],
      })
    duplicate.assertStatus(409)
    duplicate.assertBodyContains({
      errors: {
        name: ['Another BOM Implementation in this Product already uses this typification.'],
      },
    })

    const otherProduct = await createImplementation(
      client,
      session.token,
      palomaShowroomId,
      'BLUSH CONSTRUCTION'
    )
    assert.equal(otherProduct.product.id, palomaId)
    const count = await BillOfMaterial.query().where('kind', 'implementation').count('* as total')
    assert.equal(Number(count[0].$extras.total), 2)
  })

  test('atomically gives a Product Variant to only one competing Implementation', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, session.token, 'Contended Jackie')
    const variantId = await createProductVariant(client, session.token, productId, 'Showroom')

    const responses = await Promise.all(
      ['First construction', 'Second construction'].map((name) =>
        client.post('/bills-of-materials').header('Authorization', `Bearer ${session.token}`).json({
          kind: 'implementation',
          name,
          description: null,
          productVariantId: variantId,
          lines: [],
        })
      )
    )

    assert.deepEqual(responses.map((response) => response.status()).sort(), [201, 409])
    const conflict = responses.find((response) => response.status() === 409)!
    assert.match(conflict.body().conflictingImplementation.id, /^BOM-[A-Z2-9]{6}$/)
    const count = await BillOfMaterial.query().whereNotNull('productVariantId').count('* as total')
    assert.equal(Number(count[0].$extras.total), 1)
  })

  test('revalidates Implementation availability atomically and accepts an Incomplete line', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, session.token, 'Jackie')
    const inactiveVariantId = await createProductVariant(
      client,
      session.token,
      productId,
      'Inactive'
    )
    await updateProductVariant(
      client,
      session.token,
      productId,
      inactiveVariantId,
      'Inactive',
      'inactive'
    )

    const unavailable = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'implementation',
        name: 'Must remain atomic',
        description: null,
        productVariantId: inactiveVariantId,
        lines: [
          {
            constructionPiece: 'Skirt',
            materialId: null,
            materialQuantity: null,
            lineNote: null,
            verified: false,
          },
        ],
      })
    unavailable.assertStatus(422)
    unavailable.assertBodyContains({
      errors: {
        productVariantId: ['The selected Product Variant is no longer available.'],
      },
    })
    let count = await BillOfMaterial.query().count('* as total').firstOrFail()
    assert.equal(Number(count.$extras.total), 0)

    const activeVariantId = await createProductVariant(client, session.token, productId, 'Active')
    const created = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'implementation',
        name: 'Progressive construction',
        description: null,
        productVariantId: activeVariantId,
        lines: [
          {
            constructionPiece: 'Skirt',
            materialId: null,
            materialQuantity: null,
            lineNote: null,
            verified: false,
          },
        ],
      })
    created.assertStatus(201)
    created.assertBodyContains({
      lines: [{ constructionPiece: 'Skirt', completeness: 'incomplete' }],
    })
    count = await BillOfMaterial.query().count('* as total').firstOrFail()
    assert.equal(Number(count.$extras.total), 1)
  })

  test('rejects invalid names and unsupported Implementation creation without a record', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')

    for (const payload of [
      { kind: 'template', name: '   ', description: null },
      { kind: 'implementation', name: 'Not in this slice', description: null },
    ]) {
      const response = await client
        .post('/bills-of-materials')
        .header('Authorization', `Bearer ${session.token}`)
        .json(payload)
      response.assertStatus(422)
    }

    const count = await BillOfMaterial.query().count('* as total').firstOrFail()
    assert.equal(Number(count.$extras.total), 0)
  })
})
