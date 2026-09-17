import BillOfMaterial from '#modules/bills_of_materials/models/bill_of_material'
import {
  authenticateAs,
  createProduct,
  createTemplate,
  createProductVariant,
  updateProduct,
  updateProductVariant,
  createImplementation,
} from '#tests/functional/bills_of_materials/support/bom_test_support'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Bills of Materials', (group) => {
  group.each.setup(() => testUtils.db('postgres_test').truncate())

  test('restricts Product-context candidates to the requested Product', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const jackieId = await createProduct(client, session.token, 'Jackie')
    const jackieVariantId = await createProductVariant(client, session.token, jackieId, 'Showroom')
    const palomaId = await createProduct(client, session.token, 'Paloma')
    await createProductVariant(client, session.token, palomaId, 'Showroom')

    const response = await client
      .get(`/bills-of-materials/product-variant-candidates?search=showroom&productId=${jackieId}`)
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(200)
    assert.deepEqual(
      response.body().items.map((candidate: { id: string }) => candidate.id),
      [jackieVariantId]
    )
  })

  test('rejects ambiguous Product and Template candidate scope', async ({ client }) => {
    const session = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, session.token, 'Jackie')
    const template = await createTemplate(client, session.token, 'Jackie base', { productId })

    const response = await client
      .get(
        `/bills-of-materials/product-variant-candidates?search=showroom&productId=${productId}&templateId=${template.id}`
      )
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(422)
  })

  test('matches Product Variant candidates across fields without accents or significant whitespace', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, session.token, 'Çeleste  Atelier')
    const variantId = await createProductVariant(
      client,
      session.token,
      productId,
      'Élite  Showroom'
    )

    const response = await client
      .get('/bills-of-materials/product-variant-candidates?search=showroom%20%20celeste')
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(200)
    assert.deepEqual(
      response.body().items.map((candidate: { id: string }) => candidate.id),
      [variantId]
    )
  })

  test('ranks mixed-field Variant relevance before Product-only context and eligibility', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const mixedFieldProductId = await createProduct(client, session.token, 'Celeste Atelier')
    const mixedFieldVariantId = await createProductVariant(
      client,
      session.token,
      mixedFieldProductId,
      'Showroom'
    )
    await createImplementation(client, session.token, mixedFieldVariantId, 'Occupied construction')
    const productOnlyId = await createProduct(client, session.token, 'Celeste Showroom')
    const productOnlyVariantId = await createProductVariant(
      client,
      session.token,
      productOnlyId,
      'Editorial'
    )

    const response = await client
      .get('/bills-of-materials/product-variant-candidates?search=celeste%20showroom')
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(200)
    assert.deepEqual(
      response.body().items.map((candidate: { id: string }) => candidate.id),
      [mixedFieldVariantId, productOnlyVariantId]
    )
  })

  test('ranks Variant relevance before eligibility and uses eligibility only for equivalent ties', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const eligibleProductId = await createProduct(client, session.token, 'Eligible Jackie')
    const eligibleWordMatchId = await createProductVariant(
      client,
      session.token,
      eligibleProductId,
      'Jackie Showroom'
    )
    const occupiedProductId = await createProduct(client, session.token, 'Occupied Jackie')
    const occupiedWordMatchId = await createProductVariant(
      client,
      session.token,
      occupiedProductId,
      'Jackie Showroom'
    )
    await createImplementation(client, session.token, occupiedWordMatchId, 'Occupied construction')
    const secondaryProductId = await createProduct(client, session.token, 'Showroom collection')
    const secondaryContextId = await createProductVariant(
      client,
      session.token,
      secondaryProductId,
      'Editorial'
    )

    const response = await client
      .get('/bills-of-materials/product-variant-candidates?search=showroom')
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(200)
    assert.deepEqual(
      response.body().items.map((candidate: { id: string }) => candidate.id),
      [eligibleWordMatchId, occupiedWordMatchId, secondaryContextId]
    )
  })

  test('bounds Product Variant candidate responses without returning a total', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, session.token, 'Bounded Jackie')
    for (let index = 0; index < 26; index += 1) {
      await createProductVariant(
        client,
        session.token,
        productId,
        `Showroom ${String(index).padStart(2, '0')}`
      )
    }

    const response = await client
      .get('/bills-of-materials/product-variant-candidates?search=showroom')
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(200)
    assert.lengthOf(response.body().items, 25)
    assert.isTrue(response.body().hasMore)
    assert.notProperty(response.body(), 'total')
  })

  test('searches Product Variant candidates with canonical eligibility and occupancy context', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const eligibleProductId = await createProduct(client, session.token, 'Eligible Jackie')
    const eligibleVariantId = await createProductVariant(
      client,
      session.token,
      eligibleProductId,
      'Showroom'
    )
    const inactiveProductId = await createProduct(client, session.token, 'Inactive Jackie')
    const inactiveProductVariantId = await createProductVariant(
      client,
      session.token,
      inactiveProductId,
      'Showroom'
    )
    await updateProduct(client, session.token, inactiveProductId, 'Inactive Jackie', 'inactive')
    const inactiveVariantProductId = await createProduct(
      client,
      session.token,
      'Variant inactive Jackie'
    )
    const inactiveVariantId = await createProductVariant(
      client,
      session.token,
      inactiveVariantProductId,
      'Showroom'
    )
    await updateProductVariant(
      client,
      session.token,
      inactiveVariantProductId,
      inactiveVariantId,
      'Showroom',
      'inactive'
    )
    const occupiedProductId = await createProduct(client, session.token, 'Occupied Jackie')
    const occupiedVariantId = await createProductVariant(
      client,
      session.token,
      occupiedProductId,
      'Showroom'
    )
    const implementation = await createImplementation(
      client,
      session.token,
      occupiedVariantId,
      'Occupied construction'
    )
    await updateProduct(client, session.token, occupiedProductId, 'Occupied Jackie', 'inactive')
    await updateProductVariant(
      client,
      session.token,
      occupiedProductId,
      occupiedVariantId,
      'Showroom',
      'inactive'
    )

    const response = await client
      .get('/bills-of-materials/product-variant-candidates?search=jackie%20showroom')
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(200)
    response.assertBodyContains({ hasMore: false })
    const byId = new Map<string, any>(response.body().items.map((item: any) => [item.id, item]))
    assertCandidate(assert, byId.get(eligibleVariantId), true, 'eligible', null)
    assertCandidate(assert, byId.get(inactiveProductVariantId), false, 'product-unavailable', null)
    assertCandidate(assert, byId.get(inactiveVariantId), false, 'variant-inactive', null)
    assertCandidate(
      assert,
      byId.get(occupiedVariantId),
      false,
      'implementation-exists',
      implementation.id
    )
    assert.equal(byId.get(eligibleVariantId).id, eligibleVariantId)
    assert.equal(byId.get(eligibleVariantId).status, 'active')
    assert.deepEqual(byId.get(eligibleVariantId).product, {
      id: eligibleProductId,
      name: 'Eligible Jackie',
      availability: 'available',
    })
    assert.deepEqual(byId.get(occupiedVariantId).existingImplementation, {
      id: implementation.id,
      name: 'Occupied construction',
    })
  })

  test('associates an unassociated Template once and rejects reassignment', async ({ client }) => {
    const session = await authenticateAs(client, 'operator')
    const firstProductId = await createProduct(client, session.token, 'Jackie')
    const secondProductId = await createProduct(client, session.token, 'Paloma')
    const template = await createTemplate(client, session.token, 'Shared construction')

    const associated = await client
      .post(`/bills-of-materials/${template.id}/product`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({ productId: firstProductId })

    associated.assertStatus(200)
    associated.assertBodyContains({
      id: template.id,
      product: { id: firstProductId, name: 'Jackie', availability: 'available' },
    })

    const reassigned = await client
      .post(`/bills-of-materials/${template.id}/product`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({ productId: secondProductId })

    reassigned.assertStatus(422)
    reassigned.assertBodyContains({
      errors: { productId: ['A Template Product association is permanent once assigned.'] },
    })
  })

  test('rejects unavailable Products while preserving an existing association', async ({
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const inactiveProductId = await createProduct(client, session.token, 'Inactive Jackie', {
      productStatus: 'inactive',
    })
    const deletedProductId = await createProduct(client, session.token, 'Deleted Paloma')
    await client
      .delete(`/products/${deletedProductId}`)
      .header('Authorization', `Bearer ${session.token}`)

    for (const productId of [inactiveProductId, deletedProductId]) {
      const response = await client
        .post('/bills-of-materials')
        .header('Authorization', `Bearer ${session.token}`)
        .json({ kind: 'template', name: `Blocked ${productId}`, description: null, productId })

      response.assertStatus(422)
      response.assertBodyContains({
        errors: { productId: ['BOM Templates can only be associated with an active Product.'] },
      })
    }

    const activeProductId = await createProduct(client, session.token, 'Associated Jackie')
    const template = await createTemplate(client, session.token, 'Associated construction', {
      productId: activeProductId,
    })
    await client
      .put(`/products/${activeProductId}`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        name: 'Associated Jackie',
        shortDescription: null,
        lifecycleStatus: 'approved',
        productStatus: 'inactive',
        productCategory: null,
        collectionId: null,
      })

    const preserved = await client
      .get(`/bills-of-materials/${template.id}`)
      .header('Authorization', `Bearer ${session.token}`)

    preserved.assertStatus(200)
    preserved.assertBodyContains({
      product: { id: activeProductId, name: 'Associated Jackie', availability: 'unavailable' },
    })

    await client
      .delete(`/products/${activeProductId}`)
      .header('Authorization', `Bearer ${session.token}`)
    const preservedAfterDeletion = await client
      .get(`/bills-of-materials/${template.id}`)
      .header('Authorization', `Bearer ${session.token}`)

    preservedAfterDeletion.assertStatus(200)
    preservedAfterDeletion.assertBodyContains({
      product: { id: activeProductId, name: 'Associated Jackie', availability: 'unavailable' },
    })
  })

  test('atomically gives a Product slot to only one competing Template creation', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, session.token, 'Contended Jackie')

    const responses = await Promise.all(
      ['First construction', 'Second construction'].map((name) =>
        client
          .post('/bills-of-materials')
          .header('Authorization', `Bearer ${session.token}`)
          .json({ kind: 'template', name, description: null, productId })
      )
    )

    assert.deepEqual(responses.map((response) => response.status()).sort(), [201, 409])
    const conflict = responses.find((response) => response.status() === 409)!
    assert.match(conflict.body().conflictingTemplate.id, /^BOM-[A-Z2-9]{6}$/)
    assert.include(
      ['First construction', 'Second construction'],
      conflict.body().conflictingTemplate.name
    )

    const associatedCount = await BillOfMaterial.query()
      .whereNotNull('productId')
      .count('* as total')
    assert.equal(Number(associatedCount[0].$extras.total), 1)
  })

  test('atomically gives a Product slot to only one competing existing Template', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, session.token, 'Association race Jackie')
    const templates = await Promise.all([
      createTemplate(client, session.token, 'First existing construction'),
      createTemplate(client, session.token, 'Second existing construction'),
    ])

    const responses = await Promise.all(
      templates.map((template) =>
        client
          .post(`/bills-of-materials/${template.id}/product`)
          .header('Authorization', `Bearer ${session.token}`)
          .json({ productId })
      )
    )

    assert.deepEqual(responses.map((response) => response.status()).sort(), [200, 409])
    const winner = responses.find((response) => response.status() === 200)!
    const conflict = responses.find((response) => response.status() === 409)!
    assert.equal(conflict.body().conflictingTemplate.id, winner.body().id)

    const associated = await BillOfMaterial.query().whereNotNull('productId')
    assert.lengthOf(associated, 1)
    assert.equal(associated[0].publicId, winner.body().id)
  })
})

function assertCandidate(
  assert: any,
  candidate: any,
  selectable: boolean,
  outcome: string,
  existingImplementationId: string | null
) {
  assert.equal(candidate.selectable, selectable)
  assert.equal(candidate.outcome, outcome)
  if (existingImplementationId === null) assert.isNull(candidate.existingImplementation)
  else assert.equal(candidate.existingImplementation.id, existingImplementationId)
}
